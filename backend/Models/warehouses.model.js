import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const WarehouseSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        locale: {
            type: String,
            required: true
        },
        admin: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
    },
    {
        timestamps: true
    }
)


export const Warehouse = mongoose.model("Warehouse", WarehouseSchema)