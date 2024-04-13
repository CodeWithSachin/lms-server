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
