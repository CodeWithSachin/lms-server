require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import orderModel, { IOrder } from "../models/order.model";
import courseModel from "../models/course.model";
import userModel from "../models/user.model";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMails";
import notificationModel from "../models/notification.model";
import { getAllOrderService, newOrder } from "../services/order.service";

// CREATE ORDER
export const createOrder = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { courseId, payment_info } = req.body as IOrder;
			const user = await userModel.findById(req.user?._id);
			const courseExistInUser = user?.courses.some(
				(course: any) => course._id.toString() === courseId
			);
			if (courseExistInUser) {
				return next(
					new ErrorHandler("You have already purchased this course", 400)
				);
			}
			const course = await courseModel.findById(courseId);

			if (!course) {
				return next(new ErrorHandler("Course not found", 404));
			}
			const data: any = {
				courseId: course._id,
				userId: user?._id,
				payment_info,
			};
			const mailData = {
				order: {
					_id: course._id.toString().slice(0, 6),
					name: course.name,
					price: course.price,
					date: new Date().toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					}),
				},
			};
			try {
				if (user) {
					await sendMail({
						email: user.email,
						subject: "Order Confirmation",
						template: "order-confirmation.ejs",
						data: mailData,
					});
				}
			} catch (error: any) {
				return next(new ErrorHandler(error.message, 500));
			}
			user?.courses.push(course?._id);
			await user?.save();
			await notificationModel.create({
				userId: user?._id,
				title: "New Order",
				message: `You have a new order from ${course.name}`,
			});
			course.purchased ? course.purchased++ : course.purchased;
			await course.save();

			newOrder(data, res, next);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// GET ALL ORDER --ONLY ADMIN
export const getAllOrders = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			getAllOrderService(res);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
