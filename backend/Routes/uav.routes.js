import { Router } from "express";
import { loginUAV, getUAVS, changeName, changePassword } from "../Controllers/uav.controller.js";
import { verifyJWT, verifyUAV } from "../Middleware/auth.middleware.js";

const router = Router()

//secured routes
router.route("/login-uav").post(verifyUAV,loginUAV);
router.route("/get-uavs").post(verifyJWT,getUAVS);
router.route("/change-name").post(verifyJWT,changeName);
router.route("/change-password").post(verifyJWT,changePassword);

export default router