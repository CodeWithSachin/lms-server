import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import courseModel from "../models/course.model";

// GET USER INFO BY ID
export const createCourse = CatchAsyncError(
	async (data: Request, res: Response) => {
		const course = await courseModel.create(data);
		res.status(201).json({
			success: true,
			course,
		});
	}
);

// GET ALL COURSES --ONLY ADMIN
export const getAllCoursesService = async (res: Response) => {
	const course = await courseModel.find().sort({ createdAt: -1 });
	res.status(200).json({
		success: true,
		course,
	});
};
