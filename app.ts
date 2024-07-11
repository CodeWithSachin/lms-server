require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.route";

// BODY PARSER
app.use(express.json({ limit: "50mb" }));

// COOKIE PARSER
app.use(cookieParser());

// const allowedOrigins = process.env.ORIGIN
// 	? process.env.ORIGIN
// 	: ["http://localhost:3000", "http://localhost:8000"];

// console.log("Allowed Origins:", allowedOrigins);
// var corsOptions = {
// 	origin: function (origin: any, callback: any) {
// 		if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
// 			callback(null, true);
// 		} else {
// 			callback(new Error("Not allowed by CORS"));
// 		}
// 	},
// };
// console.log("🚀 ~ corsOptionsDelegate ~ corsOptionsDelegate:", corsOptions);

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);

// // CORS
// app.use(
// 	cors({
// 		origin: process.env.ORIGIN,
// 		credentials: true,
// 	})
// );

//ROUTES
app.use(
	"/api/v1",
	userRouter,
	courseRouter,
	orderRouter,
	notificationRouter,
	analyticsRouter,
	layoutRouter
);

// TESTING API
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
	res.status(200).json({
		success: true,
		message: "API is Working",
	});
});

// UNKNOWN ROUTES
app.all("*", (req: Request, res: Response, next: NextFunction) => {
	const error = new Error(`Route ${req.originalUrl} is not found!`) as any;
	error.status = 404;
	next(error);
});

app.use(ErrorMiddleware);
