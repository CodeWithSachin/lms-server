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
					type,
					banner: {
						image: {
							public_id: myCloud.public_id,
							url: myCloud.secure_url,
						},
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
				success: true,
				message: "Layout created successfully",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// EDIT LAYOUT
export const editLayout = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { type } = req.body;
			const isTypeExist = await layoutModel.findOne({ type });
			if (isTypeExist) {
				return next(new ErrorHandler(`${type} is already exist`, 400));
			}
			if (type === "Banner") {
				const bannerImage: any = await layoutModel.findOne({ type });
				const { image, title, subTitle } = req.body;
				if (bannerImage) {
					await cloudinary.v2.uploader.destroy(bannerImage.image.public_id);
				}
				const myCloud = await cloudinary.v2.uploader.upload(image, {
					folder: "layout",
				});
				const banner = {
					type,
					banner: {
						image: {
							public_id: myCloud.public_id,
							url: myCloud.secure_url,
						},
					},
					title,
					subTitle,
				};

				await layoutModel.findByIdAndUpdate(bannerImage?._id, {
					type,
					banner,
				});
			}
			if (type === "FAQ") {
				const { faq } = req.body;
				const faqData: any = await layoutModel.findOne({ type });

				const faqItem = await Promise.all(
					faq.map(async (data: any) => {
						return { question: data.question, answer: data.answer };
					})
				);
				await layoutModel.findByIdAndUpdate(faqData?._id, {
					type,
					faq: faqItem,
				});
			}
			if (type === "Categories") {
				const { categories } = req.body;
				const categoriesData: any = await layoutModel.findOne({
					type,
				});
				const categoriesItem = await Promise.all(
					categories.map(async (data: any) => {
						return { title: data.title };
					})
				);
				const data = await layoutModel.findByIdAndUpdate(categoriesData?._id, {
					type,
					category: categoriesItem,
				});
			}
			res.status(200).json({
				success: true,
				message: "Layout updated successfully",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
// GET LAYOUT BY TYPE
export const getLayoutByType = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const layout = await layoutModel.findOne({ type: req.params.type });
			res.status(200).json({
				success: true,
				layout,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
