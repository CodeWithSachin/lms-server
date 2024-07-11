import mongoose from "mongoose";
require("dotenv").config();

const dbUrls: string = process.env.DB_URI || "";

const connectDB = async () => {
	try {
		await mongoose.connect(dbUrls).then((data: any) => {
			console.log(`Database connected with ${data.connection.host}`);
		});
	} catch (error: any) {
		console.log(error.message);
		setTimeout(connectDB, 5000);
	}
};

export default connectDB;
