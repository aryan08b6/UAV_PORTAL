import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const OrderSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "product"
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: "user"
        },
        status: {
            type: String,
            default: "Processing"
        },
        admin: {
            type: Schema.Types.ObjectId,
            ref: "user"
        },
        uav: {
            type: Schema.Types.ObjectId,
            ref: "uav"
        }
    },
    {
        timestamps: true
    }
)


export const Order = mongoose.model("Order", OrderSchema)