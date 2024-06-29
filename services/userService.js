const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const User = require("../models/userModel");
const OTP = require("../models/otpModel");

const { config } = require("../config/settings");

class UserService {
  // Register service
  async registerUser(fullName, email, password) {
    if (!fullName || !email || !password) {
      throw new Error("Please add all fields");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new Error("User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await new User({
      fullName,
      email,
      password: hashedPassword,
    }).save();

    if (user) {
      return {
        _id: user.id,
        email: user.email,
        token: this.generateToken(user._id),
      };
    } else {
      throw new Error("Invalid user data");
    }
  }

  // Login service
  async loginUser(email, password) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Email not found!");
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
        token: this.generateToken(user._id),
      };
    } else {
      throw new Error("Invalid password!");
    }
  }

  // Forgot password service
  async forgotPassword(email) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User not found!");
    }

    const otp = await this.generateOTP(user._id);
    this.sendEmail(user, otp);

    return {
      _id: user.id,
      token: this.generateToken(user._id),
    };
  }

  // verify otp sent from frontend with the server sent OTP
  async verifyOTP(userId, otp) {
    const otpRecord = await OTP.findOne({ userId, otp });

    if (!otpRecord) {
      throw new Error("Invalid OTP!");
    }

    const otpAge = Date.now() - new Date(otpRecord.createdAt).getTime();
    const otpValidityPeriod = 10 * 60 * 1000; // 10 minutes in milliseconds

    if (otpAge > otpValidityPeriod) {
      await OTP.deleteOne({ userId, otp });
      throw new Error("OTP expired!");
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
        throw new Error("User not found!");
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
      throw new Error("Invalid credentials");
    }
    return {
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isLoggedIn: true,
      onboarded: user.onboarded,
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
      throw new Error("User not found");
    }

    if (currentPassword && newPassword) {
      const passwordMatched = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordMatched) {
        throw new Error("Current password is incorrect");
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
      token: this.generateToken(user._id),
    };
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

  // generate JWT token for authentication
  generateToken(id) {
    return jwt.sign({ id }, config.jwtSecret, { expiresIn: "30d" });
  }

  // send OTP code to user provided email
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
