import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrder extends Document {
	courseId: string;
	userId: string;
	payment_info: object;
}

const orderSchema: Schema = new Schema<IOrder>(
	{
		courseId: {
			type: String,
			required: true,
		},
		userId: {
			type: String,
			required: true,
		},
		payment_info: {
			type: Object,
		},
	},
	{ timestamps: true }
);

const orderModel: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);

export default orderModel;
