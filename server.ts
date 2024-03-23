import { app } from "./app";
import connectDB from "./utils/db";
require('dotenv').config();


// CREATE SERVER

app.listen(process.env["PORT"], ()=>{
    console.log(`SERVER IS RUNNING ON PORT ${process.env["PORT"]}`)
    connectDB();
})