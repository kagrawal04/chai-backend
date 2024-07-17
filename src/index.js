import mongoose, { connect } from "mongoose";
import {DB_NAME} from "./constants.js"
import connectDB from "./db/index.js";

import dotenv from "dotenv"

dotenv.config({
    path: './env'
})


connectDB()

/*  basic appoach to connect to the database
import express from "express"
const app = express()

( async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI} / ${DB_NAME}`)
        app.on("error", (error) =>{
            console.log("ERROR: ", error);
            throw error
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on ${process.env.PORT}` );
        })
    } catch (error) {
        console.error("ERROR: ", error)
        throw error
    }
})
*/