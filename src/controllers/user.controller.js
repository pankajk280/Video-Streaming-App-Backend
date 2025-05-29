import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { user } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // });
    const {userName,email,fullname,password} = req.body;

    //apply validations
    if([userName,email,fullname,password].some((x=>x.trim()===''))){
        throw new ApiError(400,"Fields are mandatory");
    }

    const existingUser = await user.findOne({
        $or : [{userName},{email}]
    });

    if(existingUser){
        throw new ApiError(409, "User already exists");
    }

    // get images from local server
    const avatarImgLocalPath = req.files?.avatar[0]?.path; // multer gives access to req.files
    const coverImagLocalPath =  req.files?.avatar[0]?.path; 

    if(!avatarImgLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    //upload images on cloudinary
    const avatar = await uploadOnCloudinary(avatarImgLocalPath);
    const coverImage = await uploadOnCloudinary(coverImagLocalPath);

    if(!avatar){
        throw new ApiError(400,"Error while uploading avatar");
    }

    //store in database
    const userCreated = await user.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        userName,
        email,
        password
    });

    const createdUser = await user.findById(userCreated._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User created Successfully")
    );

});

export {registerUser};