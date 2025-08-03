const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    minlength: 3,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please provide valid email"
    ],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["student", "teacher"],
    default: "student"
  },
  profile: {
    type: String,
    trim: true,
    maxlength: 50,
    minlength: 3,
  },
  profilePic: {
    type:String,
    default:'https://www.shutterstock.com/image-vector/default-avatar-photo-placeholder-grey-600nw-2007531536.jpg'
  },
  bio: String
}, {
  timestamps: true
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.createAccessToken = function () {
  return jwt.sign(
    { userId: this._id, name: `${this.firstName} ${this.lastName}`, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.JWT_ACCESS_LIFETIME || "7d" }
  );
};

UserSchema.methods.createRefreshToken = function () {
  return jwt.sign(
    { userId: this._id, name: `${this.firstName} ${this.lastName}`, role: this.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.JWT_REFRESH_LIFETIME || "30d" }
  );
};

UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
