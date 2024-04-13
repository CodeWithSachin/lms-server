require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import courseModel from "../models/course.model";

export const uploadCourse = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const data = req.body;
			const thumbnail = data.thumbnail;
			if (thumbnail) {
				const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
					folder: "Courses",
				});
				data.thumbnail = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url,
				};
			}
			createCourse(data, res, next);
		} catch (error: any) {
			console.log("🚀 ~ error:", error)
			return next(new ErrorHandler(error.message, 400));
		}
	}
);
export const updateCourse = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const data = req.body;
			const thumbnail = data.thumbnail;
			if (thumbnail) {
				const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
					folder: "Courses",
				});
				data.thumbnail = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url,
				};
			}
			const courseId = req.params.id;
			const course = await courseModel.findByIdAndUpdate(courseId,{$set:data},{new:true});

			res.status(201).json({
				status:true,
				course
			})
		} catch (error: any) {
			console.log("🚀 ~ error:", error)
			return next(new ErrorHandler(error.message, 400));
		}
	}
);
