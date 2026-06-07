import nodemailer from "nodemailer";

export const sendEmail = async(email, subject, message)=>{
    const transporter = nodemailer.createTransport({
      // service:"gmail",
      host: "smtp.gmail.com", // or your provider's host
      port: 465, // use 587 (not 25, not 465 for most)
      secure: true, // false for 587, true for 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    //   connectionTimeout: 10000, // 10 seconds
    //   greetingTimeout: 10000,
    //   socketTimeout: 10000,
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    });

    await transporter.sendMail({
        from : process.env.EMAIL_USER,
        to: email,
        subject,
        text: message,
    });
}