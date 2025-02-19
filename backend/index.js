import {app} from './app.js'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const {PORT, MONGO_URL} = process.env

mongoose.connect(MONGO_URL).then(() => {
    console.log("Database connected")
}).catch((error) => {
    console.log("Error connecting to database", error)
})
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`)
})

