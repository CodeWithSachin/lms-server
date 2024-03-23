require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";

// BODY PARSER
app.use(express.json({ limit: "50mb" }));

// COOKIE PARSER
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: process.env.ORIGIN,
  })
);

//ROUTES
app.use("/api/v1", userRouter);

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
