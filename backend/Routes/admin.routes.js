import { Router } from "express";
import {
    deleteUav,
    getUavDetails,
    addProduct,
    createWarehouse,
} from "../Controllers/admin.controller.js";
import { verifyAdmin } from "../Middleware/auth.middleware.js";


const router = Router()

//secured routes
router.route("/deleteUav").get(verifyAdmin, deleteUav)
router.route("/getUavDetails").get(verifyAdmin, getUavDetails)
router.route("/addProduct").post(verifyAdmin, addProduct)
router.route("/createWarehouse").post(verifyAdmin, createWarehouse)

export default router