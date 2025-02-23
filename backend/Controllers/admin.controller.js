import { asyncHandler } from "../util/asyncHandler.js";
import {ApiError} from "../util/ApiError.js"
import { Uav } from "../Models/uav.model.js"
import { Order } from "../Models/order.model.js";
import { Product } from "../Models/product.model.js"
import {Warehouse} from "../Models/warehouses.model.js"
import { ApiResponse } from "../util/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const createWarehouse = asyncHandler(async(req, res) => {
    const { name, location, admin } = req.body
    console.log(admin)
    const warehouse = await Warehouse.create({
        name,
        locale: location,
        admin
    })

    res.status(200).json(new ApiResponse(200, warehouse, "Warehouse created successfully"))
})

const deleteUav = asyncHandler(async(req, res) => {
    const id = req.uav_id
    await findOneAndDelete({ _id: id })
    res.status(200)
})

const getUavDetails = asyncHandler(async(req, res) => {
    const id = req.uav_id
    const uav = await Uav.findById(id)
    res.status(200).json(new ApiResponse(200, uav, "UAV Details"))

})

const addProduct = asyncHandler(async (req, res) => {
    const {name, stock, dimentions, price} = req.body

    const newProduct = await Product.create({
        name,
        stock,
        dimentions,
        price
    })

    res.status(200).json(new ApiResponse(200, newProduct, "product created sucessfully"))


})

export {
    deleteUav,
    getUavDetails,
    addProduct,
    createWarehouse
}