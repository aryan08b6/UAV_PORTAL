import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({ origin: 'http://localhost:5173', methods: ['GET', 'POST'], credentials: true,  }))
app.use(express.json())
app.use(cookieParser())

import adminRoutes from './Routes/admin.routes.js'
import userRouter from './Routes/user.routes.js'
import uavRoutes from "./Routes/uav.routes.js"
import orderRoutes from "./Routes/order.routes.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/admins", adminRoutes)
app.use("/api/v1/uav", uavRoutes)
app.use("/api/v1/order", orderRoutes)

// Export app
export { app }
