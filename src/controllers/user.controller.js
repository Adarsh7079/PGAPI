import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail } from "../utils/sendEmail.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary"
import { sendToken } from "../utils/sendToken.js";

// export const generateAccessAndRefreshToken=async(userId)=>{ 
//     try{
//         const user=await User.findById(userId);
//         const accessToken=user.generateAccessToken();
//         const refreshToken=user.generateRefreshToken();

//         user.refreshToken=refreshToken;
//         await user.save({validateBeforeSave:false})

//         return {accessToken, refreshToken};
//     }
//     catch(error){
//         throw new ApiError(500,"Something went wrong while generating refreshandaccesstoken")
//     }
// }
export const registerUser=asyncHandler(async(req,res,next)=>{
    const {email,fullName,mobile,password}=req.body;
    const file=req.file;

    //check fileds are empty than throw error 
    if([email,fullName,mobile,password].some((fields)=>fields?.trim()=="")){
        throw new ApiError(400,"All fields are required")
    }

    //find if user already exist than throw error 
    const existUser=await User.findOne({email});
    if(existUser)
    {
        throw new ApiError(409 ,"User Already exist")
    }
    //upload file on cloudinary
    const fileUri=getDataUri(file);
    const mycloud=await cloudinary.v2.uploader.upload(fileUri.content);

    const user= await User.create({
        fullName,
        email,
        mobile,
        password,
        avatar:{
            public_id:mycloud.public_id,
            url:mycloud.secure_url
        }
        
    });
    sendToken(res,user,"Register Succefully",201);
})

export const login=asyncHandler(async(req,res)=>{
    const {email,password}=req.body;

    if(!email|| !password)
    {
        throw new ApiError(400, "username or email is required")
    }

    const user=await User.findOne({email}).select("+password");
   // console.log("user got ",user);
    if(!user){
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordvalid=await user.isPasswordCorrect(password);

    if(!isPasswordvalid){
        throw new ApiError(401,"Invalid User Credentials")
    }
    sendToken(res,user,`Welcome back ${user.fullName}`,200)
});
export const getMyProfile= asyncHandler(async(req,res,next)=>{
   // console.log("got res: ",req);
    const user=await User.findById(req.user._id);
  

    res.status(200).json({
        success:true,
        user,
       
    })
    
})

export const deleteMyProfile=asyncHandler(async(req,res,next)=>{
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    await User.deleteOne({ _id: req.user._id });

    res.status(200)
        .cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true
        })
        .json({
            success: true,
            message: "ID deleted successfully"
        });
})
export const logoutUser=asyncHandler(async(req,res,next)=>{
    res.status(200).cookie("token",null,{
        expires:new Date(Date.now()),
    }).json({
        success:true,
        message:"Logges Out Successfully"
    })
})
export const updateProfilePicture=asyncHandler(async(req,res,next)=>{
   
    const file=req.file;
    const user=await User.findById(req.user._id);

    const fileUri=getDataUri(file);

    const mycloud=await cloudinary.v2.uploader.upload(fileUri.content);

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);    

    user.avatar={
        public_id:mycloud.public_id,
        url:mycloud.url
    }

    await user.save();
    return res.status(201).json(
        new ApiResponse(200,createdUser,"Profile Picture Updated Successfully")
    )

})

export const changePassword=asyncHandler(async(req,res,next)=>{
    const{oldPassword,newPassword}=req.body;

    if(!oldPassword || !newPassword){
        throw  new ApiError(400,"All field are required");
    }

    const user=await User.findById(req.user._id).select("+password");

    console.log(user);
    const isMatch=await user.isPasswordCorrect(oldPassword);
    if(!isMatch)
      return next( new ApiError(400,"Incorrect Password"));

    user.password=newPassword;
    await user.save()
    return res.status(201).json(
        new ApiResponse(200,user,"Password Changed Successfully")
    )

})

export const forgetPassword=asyncHandler(async(req,res)=>{
    //take email to send the token to verify
  
    const{email}=req.body;

    //find user from this mail 
    const user=await User.findOne({email});

    if(!user)
    {
        throw new ApiError(400,"user not found");
    }

    //generate and get ResetToken 
    const resetToken=await user.getResetToken();
    await user.save();

    //send token Via Email
    const url=`${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
    const message=`click on the link to reser your password ${url}. if you have not requested than please ignore `;
    await sendEmail(user.email,"Reset Password",message);
    res.status(200).json({
        success:true,
        message:`Reset Token has been sent to ${user.email} `
    })
})

export const resetPassword=asyncHandler(async(req,res)=>{
    const {token}=req.body;
    const resetPasswordToken=crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
    const user=await user.findOne({
        resetPasswordToken,
        resetPasswordExpire:{
            $gt:Date.now(),
        },
    })
    if(!user)
    {
        return ApiError(400,"tokken invalid and expire")
    }
    user.password=req.body.password;
    user.resetPasswordExpire=undefined;
    user.resetPasswordToken=undefined;  
    user.save();
    res.status(200).json({
        success:true,
        message:'password change successfully'
    })
})




