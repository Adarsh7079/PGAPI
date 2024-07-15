import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const isAuthenticated=asyncHandler(async(req,res,next)=>{

    const {token}=req.cookies;
    if(!token) throw new ApiError(401,"Not Loggesd In");

    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    req.user=await User.findById(decoded._id);
    next();
})

export const verifiedUser=asyncHandler(async(req,res,next)=>{
    const {token}=req.cookies;
    if(!token) throw new ApiError(401,"Not Loggesd In");

    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    const user=await User.findById(decoded._id);
    req.user=user;
    if(user.isVerified)
    {
        next();
    }
    else
    {
        throw new ApiError(401,"user not verified");
    }
})