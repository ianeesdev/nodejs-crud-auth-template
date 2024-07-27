const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const User = require("../models/user.model");
const OTP = require("../models/otp.model");

const { config } = require("../config/settings");

class UserService {
  // Register service
  async registerUser(fullName, email, password, role = "user") {
    if (!fullName || !email || !password) {
      const error = new Error("Please add all fields");
      error.status = 400;
      throw error;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      const error = new Error("User already exists");
      error.status = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await new User({
      fullName,
      email,
      password: hashedPassword,
      role,
    }).save();

    if (user) {
      return {
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: this.generateToken(user._id),
      };
    } else {
      const error = new Error("Invalid user data");
      error.status = 400;
      throw error;
    }
  }

  // Login service
  async loginUser(email, password) {
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("Email not found!");
      error.status = 404;
      throw error;
    }

    const passwordMatched = await bcrypt.compare(password, user.password);

    if (passwordMatched) {
      return {
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isLoggedIn: true,
        onboarded: user.onboarded,
        role: user.role,
        token: this.generateToken(user._id),
      };
    } else {
      const error = new Error("Invalid password!");
      error.status = 401;
      throw error;
    }
  }

  // Forgot password service
  async forgotPassword(email) {
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User not found!");
      error.status = 404;
      throw error;
    }

    const otp = await this.generateOTP(user._id);
    this.sendEmail(user, otp);

    return {
      _id: user.id,
      token: this.generateToken(user._id),
    };
  }

  // Verify OTP service
  async verifyOTP(userId, otp) {
    const otpRecord = await OTP.findOne({ userId, otp });

    if (!otpRecord) {
      const error = new Error("Invalid OTP!");
      error.status = 400;
      throw error;
    }

    const otpAge = Date.now() - new Date(otpRecord.createdAt).getTime();
    const otpValidityPeriod = 10 * 60 * 1000; // 10 minutes in milliseconds

    if (otpAge > otpValidityPeriod) {
      await OTP.deleteOne({ userId, otp });
      const error = new Error("OTP expired!");
      error.status = 400;
      throw error;
    }

    await OTP.deleteOne({ userId, otp });

    return {
      isVerified: true,
      token: this.generateToken(userId),
    };
  }

  // Reset password service
  async resetPassword(userId, password) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const user = await User.findByIdAndUpdate(
        userId,
        { password: hash },
        { new: true }
      );

      if (!user) {
        const error = new Error("User not found!");
        error.status = 404;
        throw error;
      }

      return {
        isUpdated: true,
      };
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  // Get User info service
  async getUser(id) {
    const user = await User.findOne({ _id: id });

    if (!user) {
      const error = new Error("Invalid credentials");
      error.status = 400;
      throw error;
    }
    return {
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isLoggedIn: true,
      onboarded: user.onboarded,
      role: user.role,
      token: this.generateToken(user._id),
    };
  }

  // Update user profile service
  async updateUserProfile(
    id,
    avatar,
    fullName,
    email,
    phoneNumber,
    currentPassword,
    newPassword
  ) {
    const user = await User.findById(id);

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    if (currentPassword && newPassword) {
      const passwordMatched = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordMatched) {
        const error = new Error("Current password is incorrect");
        error.status = 401;
        throw error;
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    user.avatar = avatar || user.avatar;
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    await user.save();

    return {
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isLoggedIn: true,
      onboarded: user.onboarded,
      role: user.role,
      token: this.generateToken(user._id),
    };
  }

  // Get all users service
  async getAllUsers() {
    const users = await User.find({});
    return users.map((user) => ({
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    }));
  }

  // Delete user service
  async deleteUser(userId) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    await user.deleteOne();
  }

  // Generate OTP service
  async generateOTP(userId) {
    const otpValue = Math.floor(1000 + Math.random() * 9000);

    // Save OTP to the database
    await new OTP({
      userId: userId,
      otp: otpValue,
      createdAt: new Date(),
    }).save();

    return otpValue;
  }

  // Generate JWT token
  generateToken(id) {
    return jwt.sign({ id }, config.jwtSecret, { expiresIn: "30d" });
  }

  // Send OTP via email
  sendEmail(user, otp) {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SOURCE_EMAIL,
        pass: process.env.SOURCE_EMAIL_PASS,
      },
    });

    var mailOptions = {
      from: process.env.SOURCE_EMAIL,
      to: user.email,
      subject: "OTP Verification",
      html: `
        <p>Hello ${user.fullName},</p>
        <p>Your OTP is: <strong>${otp}</strong></p>
      `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }
}

module.exports = new UserService();
