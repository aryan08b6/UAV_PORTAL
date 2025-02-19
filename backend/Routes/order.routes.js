import { Router } from "express";
import { 
    createOrder,
    getOrders,
    completeOrder
} from "../Controllers/order.controller.js";
import { verifyAdmin, verifyJWT } from "../Middleware/auth.middleware.js";


const router = Router()

//user
router.route("/create-order").post(verifyJWT, createOrder);

//admin
router.route("/admin/get-orders").post(verifyJWT, getOrders);
router.route("/complete-order").post(verifyAdmin, completeOrder);


export default router