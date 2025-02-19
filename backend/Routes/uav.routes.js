import { Router } from "express";
import { loginUAV } from "../Controllers/uav.controller.js";


const router = Router()

//secured routes
router.route("login-uav").post(loginUAV);

export default router