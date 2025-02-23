import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const uavSchema = new Schema(
    {
        productType: {
            type: Schema.Types.ObjectId,
            ref: "product",
        },
        name: {
            type: String,
            default: "UAV",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        secretToken: {
            type: String,
            trim: true, 
            index: true
        },
        password: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

uavSchema.methods.generateSecretToken = async function() {
    const secret = jwt.sign({
        _id: this._id,
    },
    process.env.UAV_TOKEN_SECRET,
    {
        expiresIn: process.env.UAV_TOKEN_EXPIRY
    })
    this.secret = secret
    await this.save()
    return secret
}

uavSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}


export const Uav = mongoose.model("Uav", uavSchema)