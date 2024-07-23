import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user =  await User.findById(userId);
        const accessToken = await User.generateAccessToken();
        const refreshToken = await User.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
    }
}


const registerUser = asyncHandler(async(req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists or not
    // check for images, check for avatar
    // upload them on cloudinary, check whether avatar is uploaded or not on cloudinary
    // create user object- create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response
    
    const {fullName, email, userName, password}= req.body
    console.log("fullName: ", fullName);
    console.log("email: ", email);
    console.log("username: ", userName);
    console.log("password: ", password);   

    console.log("Registered User: ", registerUser);
    if(
        [fullName, email, userName, password].some((field)=>
        field?.trim()==="")
    )
    {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    console.log("Existing User: ", existingUser);
    if (existingUser){
        throw new ApiError(409, "User already exists with same username or password")
    }
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    if(!coverImage){
        throw new ApiError(400, "Cover Image file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    const userCreated = await User.findById(user._id).select(" -password -refreshToken")
    console.log("User's creation: ", Boolean(userCreated)); 
    console.log(user);

    if(!userCreated){
        throw new ApiError(500, "Something went wrong please try again")
    }

    return res.status(201).json(
        new ApiResponse(200, "User is successfully registered")
    )
})

const loginUser = asyncHandler(async( req, res)=>{
    // request data from body
    // login via username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const {email, userName, password} = req.body;
    console.log(email);

    if (!userName && !email) {
        throw new ApiError(400, "username or email required")
    }

    const user = await User.findOne({
        $or: [{userName}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Password is incorrect")
    }

    const { accessToken,refreshToken } = 
    await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = 
    {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse (
            200,
            {
            user: loggedInUser, accessToken , refreshToken 
        },
        "User logged in successfully"
    )
)
})

const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = 
    {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200,
        {},
        "User Logged Out Successfully"
    )
)
})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if(!refreshAccessToken){
        throw new ApiError(401, "Unauthorized Request")
    }
    
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        const user =  await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200,
            { accessToken, refreshToken: newRefreshToken}, 
            "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh token ")

    }
})

const changeCurrentPassword = asyncHandler(async (req,res)=>{

    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Password Invalid")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(200, {}, "Password changed successfully")

})

const getCurrentUser = asyncHandler(async(req,res) =>{
    return res
    .status(200)
    .json(200, res.user, "User Fetched Successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {userName, email} = req.body

    if(!userName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        res.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path     

    if (!avatarLocalPath) {
        throw new ApiError(200, "Avatar fil is missing")        
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

   const user =  await User.findByIdAndUpdate(
        req.user?._id,{
            $set: {
                avatar:avatar.url
            }            
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar is uploaded successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path     

    if (!coverImageLocalPath) {
        throw new ApiError(200, "Cover Image file is missing")        
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,{
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image is uploaded successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}