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

const allowedOrigins = (process.env.ORIGIN || "").split(",");
const corsOptions: cors.CorsOptionsDelegate = function (req, callback) {
	const origin = req.headers.origin || "";
	let corsOptions;
	if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
		corsOptions = {
			origin: true,
			credentials: true,
			optionsSuccessStatus: 200,
		};
	} else {
		corsOptions = { origin: false };
	}
	callback(null, corsOptions);
};

app.use(cors(corsOptions));

// CORS
// app.use(
// 	cors({
// 		origin: "*",
// 		optionsSuccessStatus: 200,
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
