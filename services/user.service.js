const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const User = require("../models/user.model");
const OTP = require("../models/otp.model");

const { config } = require("../config/settings");
const logger = require("../config/winston.config");

class UserService {
  // Generate JWT token
  generateToken(id) {
    return jwt.sign({ id }, config.jwtSecret, { expiresIn: "15m" });
  }

  // Generate Refresh Token
  generateRefreshToken(id) {
    return jwt.sign({ id }, config.refreshTokenSecret, { expiresIn: "7d" });
  }

  // Store Refresh Token in the database
  async storeRefreshToken(userId, refreshToken) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await User.findByIdAndUpdate(userId, {
      $push: { refreshTokens: { token: refreshToken, expiresAt } },
    });
  }

  // Revoke Refresh Token
  async revokeRefreshToken(userId, refreshToken) {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { token: refreshToken } },
    });
  }

  // Register service
  async registerUser(fullName, email, password, role = "user") {
    try {
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
        role,
      }).save();

      if (user) {
        const token = this.generateToken(user._id);
        const refreshToken = this.generateRefreshToken(user._id);
        await this.storeRefreshToken(user._id, refreshToken);

        return {
          _id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          token,
          refreshToken,
        };
      } else {
        throw new Error("Invalid user data");
      }
    } catch (error) {
      logger.error(`Error in registerUser: ${error.message}`);
      throw error;
    }
  }

  // Login service
  async loginUser(email, password) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error("Email not found!");
      }

      const passwordMatched = await bcrypt.compare(password, user.password);

      if (passwordMatched) {
        const token = this.generateToken(user._id);
        const refreshToken = this.generateRefreshToken(user._id);
        await this.storeRefreshToken(user._id, refreshToken);

        return {
          _id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          isLoggedIn: true,
          onboarded: user.onboarded,
          role: user.role,
          token,
          refreshToken,
        };
      } else {
        throw new Error("Invalid password!");
      }
    } catch (error) {
      logger.error(`Error in loginUser: ${error.message}`);
      throw error;
    }
  }

  // Refresh Token service
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new Error("User not found");
      }

      // Check if the refresh token is valid and not revoked
      const validToken = user.refreshTokens.some(
        (token) => token.token === refreshToken && token.expiresAt > new Date()
      );

      if (!validToken) {
        throw new Error("Invalid or expired refresh token");
      }

      const token = this.generateToken(user._id);
      return {
        token,
      };
    } catch (error) {
      logger.error(`Error in refreshToken: ${error.message}`);
      throw new Error("Invalid refresh token");
    }
  }

  // Forgot password service
  async forgotPassword(email) {
    try {
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
    } catch (error) {
      logger.error(`Error in forgotPassword: ${error.message}`);
      throw error;
    }
  }

  // Verify OTP service
  async verifyOTP(userId, otp) {
    try {
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
    } catch (error) {
      logger.error(`Error in verifyOTP: ${error.message}`);
      throw error;
    }
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
      logger.error(`Error in resetPassword: ${error.message}`);
      throw new Error("Invalid token");
    }
  }

  // Get User info service
  async getUser(id) {
    try {
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
        role: user.role,
        token: this.generateToken(user._id),
      };
    } catch (error) {
      logger.error(`Error in getUser: ${error.message}`);
      throw error;
    }
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
    try {
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
        role: user.role,
        token: this.generateToken(user._id),
      };
    } catch (error) {
      logger.error(`Error in updateUserProfile: ${error.message}`);
      throw error;
    }
  }

  // Get all users service
  async getAllUsers() {
    try {
      const users = await User.find({});
      return users.map((user) => ({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      }));
    } catch (error) {
      logger.error(`Error in getAllUsers: ${error.message}`);
      throw error;
    }
  }

  // Delete user service
  async deleteUser(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      await user.deleteOne();
    } catch (error) {
      logger.error(`Error in deleteUser: ${error.message}`);
      throw error;
    }
  }

  // Generate OTP service
  async generateOTP(userId) {
    try {
      const otpValue = Math.floor(1000 + Math.random() * 9000);

      // Save OTP to the database
      await new OTP({
        userId: userId,
        otp: otpValue,
        createdAt: new Date(),
      }).save();

      return otpValue;
    } catch (error) {
      logger.error(`Error in generateOTP: ${error.message}`);
      throw error;
    }
  }

  // Send OTP via email
  sendEmail(user, otp) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SOURCE_EMAIL,
        pass: process.env.SOURCE_EMAIL_PASS,
      },
    });

    const mailOptions = {
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
        logger.error(`Error sending email: ${error.message}`);
      } else {
        logger.info(`Email sent: ${info.response}`);
      }
    });
  }
}

module.exports = new UserService();