import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

// Credentials come from .env - nothing secret is hard-coded in the repo.
const EMAIL = process.env.SUPERADMIN_EMAIL || "superadmin@campussathi.com";
const PASSWORD = process.env.SUPERADMIN_PASSWORD;

const createSuperAdmin = async () => {
  try {
    if (!PASSWORD || PASSWORD.length < 8) {
      throw new Error("Set SUPERADMIN_PASSWORD (min 8 chars) in .env first");
    }
    await mongoose.connect(process.env.MONGO_URL);

    if (await User.findOne({ role: "superAdmin" })) {
      console.log("Super Admin already exists");
      process.exit(0);
    }

    await User.create({
      fullname: { firstname: "Super", lastname: "Admin" },
      username: "superadmin",
      email: EMAIL,
      phone: "9876543210",
      password: PASSWORD,
      rollNumber: "SUPER001",
      course: "BTech",
      department: "CSE",
      semester: 8,
      section: "A",
      batchYear: 2023,
      role: "superAdmin",
      isVerified: true,
      accountStatus: "active",
    });
    console.log(`Super Admin created: ${EMAIL}`);
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

createSuperAdmin();
