import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { generateLast12MonthData } from "../utils/analytics.generator";
import userModel from "../models/user.model";
import courseModel from "../models/course.model";
import orderModel from "../models/order.model";

// GET USER ANALYTICS --ONLY FOR ADMIN
export const getUserAnalytics = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const users = await generateLast12MonthData(userModel);

			res.status(200).json({
				status: true,
				users,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// GET COURSE ANALYTICS --ONLY FOR ADMIN
export const getCourseAnalytics = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const course = await generateLast12MonthData(courseModel);

			res.status(200).json({
				status: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// GET ORDER ANALYTICS --ONLY FOR ADMIN
export const getOrderAnalytics = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const order = await generateLast12MonthData(orderModel);

			res.status(200).json({
				status: true,
				order,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
