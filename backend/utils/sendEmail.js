import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  try {
    // Use explicit SMTP settings from .env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify connection
    await transporter.verify();
    console.log("✅ SMTP Connection verified");

    const message = {
      from: `${process.env.FROM_NAME || "LMS Support"} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: `<p>${options.message.replace(/\n/g, "<br>")}</p>`,
    };

    const info = await transporter.sendMail(message);
    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    console.error("Error details:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export default sendEmail;