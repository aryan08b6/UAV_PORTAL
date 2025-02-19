import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    setUav
} from "../Controllers/user.controller.js";
import { verifyJWT } from "../Middleware/auth.middleware.js";


const router = Router()

router.route("/register").post(registerUser)                            // done
router.route("/login").post(loginUser)                                  // done

//secured routes
// Authentication and Authorization
router.route("/logout").post(verifyJWT,  logoutUser)                    // done
router.route("/refresh-token").post(refreshAccessToken)                 // done
router.route("/change-password").post(verifyJWT, changeCurrentPassword) // done
router.route("/current-user").get(verifyJWT, getCurrentUser)            // done
router.route("/update-account").post(verifyJWT, updateAccountDetails)   // done

router.route("/set-uav").post(verifyJWT, setUav)                        // done  

export default router