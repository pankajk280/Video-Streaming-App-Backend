import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { loginUser } from "../controllers/user.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { logoutUser } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.route("/register").post(
    upload.fields([{
        name: " avatar",
        maxCount: 1
    },{
        name: "coverImage",
        maxCount: 1
    }
])
,registerUser);

userRouter.route("/login",loginUser);
userRouter.route("/logout").post(verifyJWT,logoutUser);

export {userRouter};