// import mongoose, { connect } from "mongoose";
// import {DB_NAME} from "./constants.js"
import connectDB from "./db/index.js";

import dotenv from "dotenv"
// import error from "mongoose/lib/error/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './.env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=> {
        console.log(`SERVER IS RUNNING AT PORT: ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MONGODB CONNECTION FAILED !!!" , error);
})

/*  basic approach to connect to the database
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