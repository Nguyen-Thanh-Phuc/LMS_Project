import mongoose from "mongoose";
import dns from "node:dns"; // Import thư viện DNS của Node.js

const connectDB = async () => {
  try {
    // 1. Ép Node.js sử dụng DNS của Google (8.8.8.8) và Cloudflare (1.1.1.1)
    // Việc này giúp bỏ qua DNS lỗi của nhà mạng hoặc máy cục bộ
    dns.setServers(["8.8.8.8", "1.1.1.1"]); 

    console.log("DNS Servers set to Google & Cloudflare");

    // 2. Kết nối như bình thường (Dùng lại chuỗi kết nối gốc trong .env)
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;