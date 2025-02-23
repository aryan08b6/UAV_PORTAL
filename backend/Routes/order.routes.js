import { Router } from "express";
import { 
    createOrder,
    getOrders,
    completeOrder,
    getProducts,
    getUserOrders
} from "../Controllers/order.controller.js";
import { verifyAdmin, verifyJWT } from "../Middleware/auth.middleware.js";


const router = Router()

//common
router.route("/getProducts").post(getProducts);

//user
router.route("/create-orders").post(verifyJWT, createOrder);
router.route("/user/get-orders").post(verifyJWT, getUserOrders);


//admin
router.route("/admin/get-orders").post(verifyAdmin, getOrders);
router.route("/complete-order").post(verifyAdmin, completeOrder);


export default router