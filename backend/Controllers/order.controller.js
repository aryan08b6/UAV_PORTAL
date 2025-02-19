import { asyncHandler } from "../util/asyncHandler.js";
import { Uav } from "../Models/uav.model.js"
import { Order } from "../Models/order.model.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { Product } from "../Models/product.model.js";

const createOrder = asyncHandler( async (req, res) => {
    const { product, customer, locale } = req.body
    
    const uav = await Uav.create({
        productType: product,
        owner: customer,
    })

    await Product.findOneAndUpdate({_id: product.id}, {$inc: {stock: -1}})
    await uav.save()
    await User.findOneAndUpdate( {_id: customer }, {$push: {uavs: uav._id}})
    const admin = (await warehouse.findOne({locale}))?.admin

    const order = await Order.create({
        product,
        customer,
        uav: uav._id,
        admin 
    })

    res.status(200)
    .json(new ApiResponse(200, order, "orderedSucessfully"))
})

const getOrders = asyncHandler(async(req, res) => {
    
    let orders = await Order.find({ admin: req.user._id }).exec();
    res.status(200).json(new ApiResponse(200, orders, "Oreders"))

})

const completeOrder = asyncHandler(async (req, res) => {
    const order = await Order.find({_id: req.order_id})
    order.status = "Shipped"
    await order.save()
    res.status(200)
})


export {
    getOrders,
    completeOrder,
    createOrder
}