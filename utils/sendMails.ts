require("dotenv").config();
import { Transporter, createTransport } from "nodemailer";
import { renderFile } from "ejs";
import path = require("path");

interface EmailOption {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (options: EmailOption): Promise<void> => {
  const transporter: Transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASS,
    },
  });

  const { email, subject, template, data } = options;

  const templatePath = path.join(__dirname, "../mails", template);

  try {
    const html: string = await renderFile(templatePath, data);

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully.");
  } catch (error: any) {
    console.error("Error sending email:", error);
  }
};

export default sendMail;
