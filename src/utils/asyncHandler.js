// function to handle async functions properly

//using promises
var asyncHandler=(fn)=>{
    return (req,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch((err)=>next(err));
    }
}

export {asyncHandler};

// //using try catch
// var asyncHandler=(fn)=async(req,res,next)=>{
//     try{
//         await fn(req,res,next);
//     }catch(err){
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         });
//     }
// }