import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

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
    
    const {fullName, email, username, password}= req.body
    console.log("fullName: ", fullName);
    console.log("email: ", email);
    console.log("username: ", username);
    console.log("password: ", password);   

    console.log("Registered User: ", registerUser);
    if(
        [fullName, email, username, password].some((field)=>
        field?.trim()==="")
    )
    {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = User.findOne({
        $or: [{ username }, { email }]
    })

    console.log("Existing User: ", existingUser);
    if (existingUser){
        throw new ApiError(409, "User already exists with same username or password")
    }

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
        username: username.toLowerCase()
    })

    const userCreated = await User.findById(user._id).select(" -password -refreshToken")
    console.log("User's creation: ", Boolean(userCreated)); 

    if(!userCreated){
        throw new ApiError(500, "Something went wrong please try again")
    }

    return res.status(201).json(
        new ApiResponse(200, "User is successfully registered")
    )
})


export {
    registerUser
}