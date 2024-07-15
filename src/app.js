import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";


const app=express()

//Using MiddleWare
app.use(express.json());
app.use(
    express.urlencoded({
    extended:true
}))

app.use(cookieParser());

//import user route
import userRoute from "./routes/user.routes.js"

app.use("/api/v1/users",userRoute);


export {app}