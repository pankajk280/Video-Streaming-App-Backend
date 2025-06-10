import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        if(!user){
            throw new ApiError(400,"User does not exist");
        }
        const accessToken = user.generateAcessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
        
        await user.save({validateBeforeSave : false});
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(400,"Error occured while generating access and refrsh tokens");
    }
};

const registerUser = asyncHandler(async(req,res)=>{
    const {email,fullname,password} = req.body;

    //apply validations
    if([email,fullname,password].some((x=>x.trim()===''))){
        throw new ApiError(400,"Fields are mandatory");
    }

    const existingUser = await User.findOne({
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
    const userCreated = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password
    });

    const createdUser = await User.findById(userCreated._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User created Successfully")
    );

});

const loginUser = asyncHandler(async(req,res)=>{
    const {email,password} = req.body;
    if(!email || !password){
        throw new ApiError(400,"All fields are mandatory");
    }

    const user = await User.findOne({email}); //check if email exists in db
    if(!user){
        throw new ApiError(404,"User does not exist")
    }
    
    const isPasswordCorrect =  await user.isPasswordCorrect(password); //use user as this contains isPasswordCorrect fn
    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid credentials");
    }

    //generate access and refresh tokens

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    //set access and refrsh tokens in cookies that can only be changed from server side that's why options is used
    
    const options={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
              .cookie("accessToken",accessToken,options)
              .cookie("refreshToken",refreshToken,options)
              .json(
                 new ApiResponse(
                    200, 
                    {
                        user: loggedInUser, accessToken, refreshToken
                    },
                    "User logged In Successfully"
                )
              );
});

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset :{ refreshToken : 1}
        },
        {new :1 }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200, {}, "User logged Out Successfully"));
            
});

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Invalid refresh Token");
    }

    try {
        const decodedToken = await jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        
        const user = User.findById(decodedToken._id);
        if(!user){
            throw new ApiError(401,"Unauthoried request");
        }

        if(user.refreshToken != incomingRefreshToken){
            throw new ApiError(401,"Refresh Token is expired or used");
        }

        //generate tokens and update in db
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id);

        return res.status(200).cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options).json(new ApiResponse(
            200,{accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
        ));

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

});

export {loginUser,registerUser,logoutUser};