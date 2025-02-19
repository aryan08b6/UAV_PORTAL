import { Uav } from "../Models/uav.model.js"
import { asyncHandler } from "../util/asyncHandler.js";
import { ApiError } from "../util/ApiError.js"
import { ApiResponse } from "../util/ApiResponse.js";

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

export { loginUAV }