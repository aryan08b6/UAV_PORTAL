import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const ProductSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        stock: {
            type: Number,
            default: 150
        },
        dimentions: {
            type: String
        },
        price: {
            type: Number,
            default: 10000
        },
    },
    {
        timestamps: true
    }
)


export const Product = mongoose.model("Product", ProductSchema)