// import nodemailer from "nodemailer";

// export const sendEmail = async(email, subject, message)=>{
//     const transporter = nodemailer.createTransport({
//         service:"gmail",

//         auth:{
//             user:process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS,
//         },
//     });

//     await transporter.sendMail({
//         from : process.env.EMAIL_USER,
//         to: email,
//         subject,
//         text: message,
//     });
// }

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (email, subject, message) => {
  await resend.emails.send({
    from: "Campus Sathi <onboarding@resend.dev>",
    to: email,
    subject,
    text: message,
  });
};