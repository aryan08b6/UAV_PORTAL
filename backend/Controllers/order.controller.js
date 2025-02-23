import { asyncHandler } from "../util/asyncHandler.js";
import { Uav } from "../Models/uav.model.js"
import { User } from "../Models/user.model.js";
import { Warehouse } from "../Models/warehouses.model.js";
import { Order } from "../Models/order.model.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { Product } from "../Models/product.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";

const createOrder = asyncHandler(async (req, res) => {
    const { cartItems, customer, locale } = req.body;
    const orders = [];

    const productUpdates = [];
    const userUpdates = [];
    const orderPromises = [];
    let admin;

    for (const item of cartItems) {
        const uavPromises = [];
        for (let i = 0; i < item.quantity; i++) {
            uavPromises.push(Uav.create({
                productType: item.id,
                owner: customer,
            }));
        }

        const uavs = await Promise.all(uavPromises);

        productUpdates.push(Product.findOneAndUpdate({ _id: item.id }, { $inc: { stock: -item.quantity } }));
        userUpdates.push(User.findOneAndUpdate({ _id: customer }, { $push: { uavs: { $each: uavs.map(uav => uav._id) } } }));

        admin = (await Warehouse.findOne({ locale }))?.admin;

        for (const uav of uavs) {
            orderPromises.push(Order.create({
                product: item.id,
                customer,
                uav: uav._id,
                admin,
            }));
        }
    }

    await Promise.all([...productUpdates, ...userUpdates]);
    const createdOrders = await Promise.all(orderPromises);
    orders.push(...createdOrders);
    res.status(200).json(new ApiResponse(200, orders, "Orders created successfully"));
});

const getOrders = asyncHandler(async (req, res) => {

    const orders = await Order.find({ admin: req.user._id }).exec();
    res.status(200).json(new ApiResponse(200, orders, "Oreders"))

})

const completeOrder = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.body.order_id })
    order.status = "Shipped"
    await order.save()
    console.log("order copmleted")
    res.status(200).json(new ApiResponse(200, order, "Order completed successfully"));
})


const getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find().exec();
    res.status(200).json(new ApiResponse(200, products, "Products retrieved successfully"));
});

const getUserOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ customer: req.user._id }).exec();
    res.status(200).json(new ApiResponse(200, orders, "Orders retrieved successfully"));
});

export {
    getOrders,
    completeOrder,
    createOrder,
    getProducts,
    getUserOrders
}