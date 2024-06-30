import notificationModel from "../models/notification.model";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import cron from "node-cron";

// GET ALL NOTIFICATION --ONLY FOR ADMIN
export const getNotification = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const notification = await notificationModel
				.find()
				.sort({ createdAt: -1 });
			res.status(201).json({
				status: true,
				notification,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// UPDATE NOTIFICATION --ONLY FOR ADMIN
export const updateNotification = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const notification = await notificationModel.findById(req.params.id);
			if (!notification) {
				return next(new ErrorHandler("Notification not found", 400));
			}
			notification.status
				? (notification.status = "read")
				: notification?.status;
			await notification.save();
			const updateNotification = await notificationModel
				.find()
				.sort({ createdAt: -1 });

			res.status(201).json({
				status: true,
				updateNotification,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// CRON TO DELETE ALL READ NOTIFICATION BEFORE 1 MONTH

cron.schedule("0 0 0 * * *", async () => {
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	await notificationModel.deleteMany({
		status: "read",
		createdAt: { $lt: thirtyDaysAgo },
	});
});
