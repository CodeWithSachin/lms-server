require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import cloudinary from "cloudinary";
import { createCourse, getAllCoursesService } from "../services/course.service";
import courseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMails";
import { title } from "process";
import notificationModel from "../models/notification.model";

// CREATE COURSE
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
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// UPDATE COURSE
export const updateCourse = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const data = req.body;
			const thumbnail = data.thumbnail;
			if (thumbnail) {
				await cloudinary.v2.uploader.destroy(thumbnail.public_id);
				const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
					folder: "Courses",
				});
				data.thumbnail = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url,
				};
			}
			const courseId = req.params.id;
			const course = await courseModel.findByIdAndUpdate(
				courseId,
				{ $set: data },
				{ new: true }
			);

			res.status(201).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// GET SINGLE COURSE --WITHOUT PURCHASE
export const getSingleCourse = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const courseId = req.params.id;
			const isCourseCacheExist = await redis.get(courseId);
			if (isCourseCacheExist) {
				const course = JSON.parse(isCourseCacheExist);
				res.status(200).json({
					success: true,
					course,
				});
			} else {
				const course = await courseModel
					.findById(courseId)
					.select(
						"-courseData.suggestion -courseData.videoUrl -courseData.links -courseData.questions"
					);
				await redis.set(courseId, JSON.stringify(course), "EX", 604800);
				res.status(201).json({
					success: true,
					course,
				});
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
// GET ALL COURSE --WITHOUT PURCHASE
export const getAllCourse = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const isCourseCacheExist = await redis.get("allCourses");
			if (isCourseCacheExist) {
				const course = JSON.parse(isCourseCacheExist);
				res.status(200).json({
					success: true,
					course,
				});
			} else {
				const course = await courseModel
					.find()
					.select(
						"-courseData.suggestion -courseData.videoUrl -courseData.links -courseData.questions"
					);
				await redis.set("allCourses", JSON.stringify(course));
				res.status(201).json({
					success: true,
					course,
				});
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
// GET COURSE CONTENT --ONLY VALID USER
export const getCourseByUser = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userCourseList = req.user?.courses;
			const courseId = req.params.id;

			const courseExist = userCourseList?.find(
				(course: any) => course._id.toString() === courseId
			);
			if (!courseExist) {
				return next(
					new ErrorHandler("You are not eligible to Access this course", 404)
				);
			}
			const course = await courseModel.findById(courseId);
			const content = course?.courseData;
			res.status(200).json({
				success: true,
				content,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// ADD QUESTION IN COURSE

interface IAddQuestionData {
	question: string;
	courseId: string;
	contentId: string;
}

export const addQuestion = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { question, courseId, contentId } = req.body as IAddQuestionData;
			const course = await courseModel.findById(courseId);
			if (!mongoose.Types.ObjectId.isValid(contentId)) {
				return next(new ErrorHandler("Invalid Content", 400));
			}
			const courseContent = course?.courseData?.find((item: any) =>
				item._id.equals(contentId)
			);
			if (!courseContent) {
				return next(new ErrorHandler("Invalid Content", 400));
			}
			// Create new Question Object
			const newQuestion: any = {
				user: req.user,
				question,
				questionReplies: [],
			};

			// Add this Question to Course
			courseContent.questions.push(newQuestion);

			await notificationModel.create({
				userId: req.user?._id,
				title: "New Question Received",
				message: `You have a new question in ${courseContent?.title}`,
			});

			// Save the updated Question
			await course?.save();

			res.status(200).json({
				success: true,
				question,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// ADD ANSWER TO QUESTION IN COURSE

interface IAddAnswerData {
	answer: string;
	courseId: string;
	contentId: string;
	questionId: string;
}

export const addAnswer = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { answer, courseId, contentId, questionId }: IAddAnswerData =
				req.body;
			const course = await courseModel.findById(courseId);
			if (!mongoose.Types.ObjectId.isValid(contentId)) {
				return next(new ErrorHandler("Invalid Content Id", 400));
			}
			const courseContent = course?.courseData?.find((item: any) =>
				item._id.equals(contentId)
			);
			if (!courseContent) {
				return next(new ErrorHandler("Invalid Content Id", 400));
			}
			const question = courseContent?.questions?.find((item: any) =>
				item._id.equals(questionId)
			);
			if (!question) {
				return next(new ErrorHandler("Invalid Question Id", 400));
			}

			const newAnswer: any = {
				user: req.user,
				answer,
			};

			question.questionReplies?.push(newAnswer);

			await course?.save();

			if (req.user?._id === question.user._id) {
				// create Notification
				await notificationModel.create({
					userId: req.user?._id,
					title: "New Question Reply Received",
					message: `You have a new question reply in ${courseContent?.title}`,
				});
			} else {
				console.log("first");
				const data = {
					name: question.user.name,
					title: courseContent.title,
				};

				// const html = await ejs.renderFile(
				// 	path.join(__dirname, "../mails/question-reply.ejs"),
				// 	data
				// );
				try {
					await sendMail({
						email: question.user.email,
						subject: "Question Reply",
						template: "question-reply.ejs",
						data,
					});
				} catch (error: any) {
					return next(new ErrorHandler(error.message, 500));
				}
			}
			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// ADD ANSWER TO QUESTION IN COURSE

interface IAddReviewData {
	review: string;
	rating: number;
	userId: string;
}

export const addReview = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userCourseList = req.user?.courses;
			const courseId = req.params.id;

			// check if courseId is already isExist in userCourseList based on id
			const courseExist = userCourseList?.some(
				(course: any) => course._id.toString() === courseId.toString()
			);
			if (!courseExist) {
				return next(
					new ErrorHandler("Not Eligible to access this course", 400)
				);
			}

			const course = await courseModel.findById(courseId);

			const { review, rating, userId }: IAddReviewData = req.body;
			const reviewData: any = {
				user: req.user,
				comment: review,
				rating,
			};
			course?.reviews.push(reviewData);

			let average = 0;

			course?.reviews.forEach((review: any) => {
				average += review.rating;
			});

			if (course) {
				course.ratings = average / course.reviews.length;
			}

			await course?.save();

			const notification = {
				title: "New Review Received",
				message: `${req.user?.name} has given a review in ${course?.name}`,
			};

			// Create Notification

			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
// ADD REPLY IN REVIEW

interface IAddReplyInReviewData {
	comment: string;
	courseId: number;
	reviewId: string;
}

export const addReplyToReview = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { comment, courseId, reviewId } = req.body as IAddReplyInReviewData;
			const course = await courseModel.findById(courseId);
			if (!course) {
				return next(new ErrorHandler("Course not found", 404));
			}
			const review = course.reviews.find(
				(rev: any) => rev._id.toString() === reviewId
			);
			if (!review) {
				return next(new ErrorHandler("Review not found", 404));
			}
			const replyData: any = {
				user: req.user,
				comment,
			};
			if (!review.commentReplies) {
				review.commentReplies = [];
			}
			review.commentReplies?.push(replyData);
			await course?.save();
			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// GET ALL USER --ONLY ADMIN
export const getAllCourses = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			getAllCoursesService(res);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// DELETE COURSE --ONLY ADMIN
export const deleteCourse = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			const course = await courseModel.findById(id);
			if (!course) {
				return next(new ErrorHandler("Course not found", 404));
			}
			await course.deleteOne({ id });
			await redis.del(id);
			res.status(200).json({
				success: true,
				message: "Course deleted successfully",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
