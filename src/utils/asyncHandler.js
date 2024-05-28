//import { Promise } from "mongoose"

///----------------------------------method 1---------------------------------------///
const asyncHandler = (requestHandler) =>{
   return (req,res,next) =>{
      Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export { asyncHandler }





// const asyncHandler = () =>{}
// const asyncHandler = (func) => () =>{}           function pass into another function
// const asyncHandler = (func) => async() =>{}



///-----------------------------------method 2--------------------------------------------///
// const asyncHandler = (func) => async (res , req ,next) =>{
//     try {
//         await func(req , res ,next)
//     } catch (error) {
//         res.status(res.code || 500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }