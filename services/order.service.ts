import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import orderModel from "../models/order.model";

// CREATE NEW ORDER
export const newOrder = CatchAsyncError(
	async (data: Request, res: Response, next: NextFunction) => {
		const order = await orderModel.create(data);
		res.status(201).json({
			success: true,
			order,
		});
	}
);

// GET ALL ORDERS --ONLY ADMIN
export const getAllOrderService = async (res: Response) => {
	const order = await orderModel.find().sort({ createdAt: -1 });
	res.status(200).json({
		success: true,
		order,
	});
};
