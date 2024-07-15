import { Router } from "express";
import { isAuthenticated, verifiedUser } from "../middlewares/Auth.js";
import { login, registerUser ,logoutUser,resetPassword,forgetPassword, getMyProfile,
     updateProfilePicture,deleteMyProfile,
     changePassword} from "../controllers/user.controller.js";

import singleUpload from "../middlewares/multer.middleware.js";

const router=Router();

router.route("/register").post(singleUpload,registerUser);
router.route("/login").post(login);
router.route("/logout").post(logoutUser);
router.route("/forgetPassword").post(isAuthenticated,forgetPassword);
router.route("/resetPassword").patch(isAuthenticated,resetPassword);
router.route("/changepassword").put(isAuthenticated,changePassword);

//get my profile
router.route("/me").get(isAuthenticated, getMyProfile);
//delete profile 
router.route("/me").delete(isAuthenticated,deleteMyProfile);
router.route("/updateProfilePicture").put(isAuthenticated,updateProfilePicture);

export default router;