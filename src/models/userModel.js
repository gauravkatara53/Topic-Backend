import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

const GENDER_ENUM = ["Male", "Female", "Other"];
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    phone: {
      type: String,
      unique: true,
      sparse: true, // Allows Google users without phone to still register
      validate: {
        validator: (v) => (v ? validator.isMobilePhone(v, "any") : true),
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    avatar: {
      type: String,
      default: "default_profile_image.png",
    },
    bio: {
      type: String,
      default: "Student",
    },
    gender: {
      type: String,
      enum: GENDER_ENUM,
    },
    isActive: { type: Boolean, default: false },
    googleId: { type: String, unique: true, sparse: true }, // Allow some users without Google ID
    role: {
      type: String,
      enum: ["student", "uploader", "admin"],
      default: "student",
    },
    isUploaderVerified: { type: Boolean, default: false },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],
      default: null, // Optional for Google login
    },
    refreshToken: {
      type: String,
    },
    collegeId: {
      type: String,
      unique: true,
      trim: true,
      validate: {
        validator: (v) => validator.isUppercase(v),
        message: (props) => `${props.value} must be in uppercase!`,
      },
    },
    collegePassword: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],
      default: null, // Optional for Google login
    },
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
    isAttendancePortalConnected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🔒 Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  try {
    if (this.password && this.isModified("password")) {
      const saltRounds = 10;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// 🔑 Compare password method
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// 🔐 Generate Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } // e.g., '15m'
  );
};

// 🔐 Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY } // e.g., '7d'
  );
};

const User = mongoose.model("User", userSchema);

export default User;
