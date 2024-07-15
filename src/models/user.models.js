import mongoose ,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";


const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: [true, "EmailId is Required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: [true, "Mobile Number is Required"],
    },
    password: {
      type: String,
      select: false,
      required: [true, "Password is Required"],
    },
    avatar: {
      public_id:{
        type:String,
        required:true,
      },
      url:{
        type:String,
        required:true
      }
    },
    address: {
      type: String,
    },
    isVerified:{
      type:Boolean,
      default:false,
    },
    role:{
      type:String,
      default:"user"
    },
    // pgdetails:[
    //   {
    //     pgnId:{
    //       type:String,
    //       required:true,
    //     },
    //     pgname:{
    //       type:String,
    //       required:true,
    //     },
    //     pgaddress:{
    //       type:String,
    //       required:true
    //     },
    //     isStay:{
    //       type:Boolean
    //     }
    //   }
    // ],
    createdAt: {
      type: Date,
      default:Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpire: String,
  },
  
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
      return next();
    }
    this.password =await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password, this.password)
};
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ _id:this._id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });
};
userSchema.methods.generateAccessToken=function(){
  return jwt.sign(
    {
      _id:this._id,
      email:this.email,
      fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
    }
  )
};


userSchema.methods.generateRefreshToken=function(){
  return jwt.sign(
    {
      _id:this._id,
      email:this.email,
      fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
  )
};

userSchema.methods.getResetToken=function(){

  const resetToken=crypto.randomBytes(20).toString("hex");

  //update the tokn 
  this.resetPasswordToken=crypto
  .createHash("sha256")
  .update(resetToken)
  .digest("hex");

  //this is only valid 15 mins 
  this.resetPasswordExpire=Date.now()+15*60*1000;
  return resetToken;

};


export const User = mongoose.model("USER", userSchema);
