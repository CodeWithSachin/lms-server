import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import cloudinary from "cloudinary";
import layoutModel from "../models/layout.model";

// CREATE LAYOUT
export const createLayout = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { type } = req.body;
			const isTypeExist = await layoutModel.findOne({ type });
			if (isTypeExist) {
				return next(new ErrorHandler("Type already exist", 400));
			}
			if (type === "Banner") {
				const { image, title, subTitle } = req.body;
				const myCloud = await cloudinary.v2.uploader.upload(image, {
					folder: "layout",
				});
				const banner = {
					image: {
						public_id: myCloud.public_id,
						url: myCloud.secure_url,
					},
					title,
					subTitle,
				};

				await layoutModel.create({ type: "Banner", banner });
			}
			if (type === "FAQ") {
				const { faq } = req.body;
				await layoutModel.create({ type: "FAQ", faq });
			}
			if (type === "Categories") {
				const { categories } = req.body;
				await layoutModel.create({ type: "Categories", category: categories });
			}
			res.status(200).json({
				status: true,
				message: "Layout created successfully",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
