// using promises block

//import error from "mongoose/lib/error"

const asyncHandler = (requestHandler) => {
    return (req, res, next) =>{
        Promise.resolve(requestHandler(req, res, next)).catch((error)=> next(error))
    }
}

export {asyncHandler}

// using try and catch block

// const asyncHandler = (fn) => async( req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.error(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }