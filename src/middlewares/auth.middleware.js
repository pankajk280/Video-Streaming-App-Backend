import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async(req,_,next)=>{
    try {
        //sometimes access token can be sent via authorization header as well through postman
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        if(!accessToken){
            throw new ApiError(401,"Unauthorized request");
        }

        const decodedToken = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET);

        // we have signed jwt using _id that's why it has _id value
        const user = await User.findById(decodedToken._id)?.select("-password -refreshToken");
        if(!user){
            throw new ApiError(401,"Invalid access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token");
    }
});