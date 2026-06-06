import nodemailer from "nodemailer";

export const sendEmail = async(email, subject, message)=>{
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false, // STARTTLS (important)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
        from : process.env.EMAIL_USER,
        to: email,
        subject,
        text: message,
    });
}