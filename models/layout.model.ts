import mongoose, { Document, Model, Schema } from "mongoose";

interface IFaqItem extends Document {
	question: string;
	answer: string;
}

interface ICategory extends Document {
	title: string;
}
interface IBannerImage extends Document {
	public_id: string;
	url: string;
}
interface ILayout extends Document {
	type: string;
	faq: IFaqItem[];
	category: ICategory[];
	banner: {
		image: IBannerImage;
		title: string;
		subTitle: string;
	};
}

const faqSchema: Schema = new Schema<IFaqItem>({
	question: { type: String },
	answer: { type: String },
});
const categorySchema: Schema = new Schema<ICategory>({
	title: { type: String },
});
const bannerImageSchema: Schema = new Schema<IBannerImage>({
	public_id: { type: String },
	url: { type: String },
});
const layoutSchema: Schema = new Schema<ILayout>({
	type: { type: String },
	faq: [faqSchema],
	category: [categorySchema],
	banner: {
		image: bannerImageSchema,
		title: { type: String },
		subTitle: { type: String },
	},
});

const layoutModel: Model<ILayout> = mongoose.model<ILayout>(
	"Layout",
	layoutSchema
);

export default layoutModel;
