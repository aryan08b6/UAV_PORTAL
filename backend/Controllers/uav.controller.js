import { Uav } from "../Models/uav.model.js"
import { asyncHandler } from "../util/asyncHandler.js";
import { ApiError } from "../util/ApiError.js"
import { ApiResponse } from "../util/ApiResponse.js";

const getUAVS = asyncHandler(async (req, res) => {  
    const uavs = await Uav.find({ owner: req.user._id }).exec();
    res.status(200).json(new ApiResponse(200, uavs, "Oreders"))
});

const loginUAV = asyncHandler(async (req, res) => {

    const { id, secret, password } = req.body

    if (
        [id, secret, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const uav = await Uav.findOne({
        $or: [{ _id: id }]
    })

    if (!uav) {
        throw new ApiError(404, "UAV does not exist")
    }

    const isPasswordValid = await uav.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid uav credentials")
    }

    if (secret !== uav.secretToken){
        throw new ApiError(401, "token doesnt match")
    }

    let secretToken = await uav.generateSecretToken()


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("secret", secretToken, options)
        .json(
            new ApiResponse(
                200,
                "UAV logged In Successfully"
            )
        )
})

const changeName = asyncHandler(async (req, res) => {
    console.log("Name change request")
    const { name, uavID } = req.body
    const userID = req.user._id
    const uav = await Uav.findOne({ _id: uavID, owner: userID })
    if (!uav) {
        throw new ApiError(404, "UAV not found")
    }
    uav.name = name
    await uav.save()
    res.status(200).json(new ApiResponse(200, "Name changed successfully"))
})  

const changePassword = asyncHandler(async (req, res) => {
    const { password, uavID } = req.body
    const userID = req.user._id
    const uav = await Uav.findOne({ _id: uavID, owner: userID })
    if (!uav) {
        throw new ApiError(404, "UAV not found")
    }
    uav.password = password
    await uav.save()
    res.status(200).json(new ApiResponse(200, "Password changed successfully"))
})

export { loginUAV, getUAVS, changeName, changePassword }