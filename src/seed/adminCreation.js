import mongoose from "mongoose";

import { User } from "../models/user.model.js";

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://campussathiserver:campussathiuE3*T4nB@campussathi.uaripxh.mongodb.net/",
    );

    const existing = await User.findOne({
      role: "superAdmin",
    });

    if (existing) {
      console.log("Super Admin already exists");
      process.exit(0);
    }

    const superAdmin = await User.create({
      fullname: {
        firstname: "Rudra",
        lastname: "Verma",
      },
      username: "superadmin",
      email: "superadmin@campussathi.com",
      phone: "9876543210",
      password: "StrongPassword@123",
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

    console.log("Super Admin Created");
    console.log(superAdmin.email);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createSuperAdmin();
