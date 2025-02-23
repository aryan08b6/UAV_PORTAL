import { ApiError } from "../util/ApiError.js";
import { asyncHandler } from "../util/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../Models/user.model.js";
import { Uav } from "../Models/uav.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        console.log("Unauthorized request")
    }
    
})

export const verifyUAV = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.secretToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "Unauthorized UAV")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const uav = await Uav.findById(decodedToken?._id)

        if (!uav) {
            throw new ApiError(401, "Invalid Uav Token")
        }

        if (uav.secretToken !== token) {
            throw new ApiError(401, "Fake UAV")
        }

        req.uav = uav

        next()
    }
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})


export const verifyAdmin = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "Unauthorized UAV")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid Uav Token")
        }

        if (user.isAdmin == false){
            throw new ApiError(401, "Not Admin")
        }

        req.user = user

        next()
    }
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})

