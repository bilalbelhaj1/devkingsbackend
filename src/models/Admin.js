const mongoose = require("mongoose")
const bycrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const AdminSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "Please provide first name"],
        trim: true,
        maxlength: [50, "First name cannot be more than 50 characters"],
        minlength: [3, "First name must be at least 3 characters"],
    },
    lastName: {
        type: String,
        required: [true, "Please provide last name"],
        trim: true,
        maxlength: [50, "Last name cannot be more than 50 characters"],
        minlength: [3, "Last name must be at least 3 characters"],
    },
    email: {
        type: String,
        required: [true, "Please provide email"],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please provide valid email"
        ],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Please provide password"],
        trim: true,
        minlength: [6, "Password must be at least 6 characters"],
    },
    profilePic: {
        type: String,
        default:'https://www.shutterstock.com/image-vector/default-avatar-photo-placeholder-grey-600nw-2007531536.jpg'
    },
    role:{
        type:String,
        default:"Admin"
    }
}, {
    timestamps: true
})

AdminSchema.pre("save", async function (next) {
    const salt = await bycrypt.genSalt(10)
    this.password = await bycrypt.hash(this.password, salt)
    next()
})

AdminSchema.methods.createAccessToken = function () {
    return jwt.sign(
        { 
            userId: this._id, 
            name: this.firstName + " " + this.lastName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.JWT_ACCESS_LIFETIME || "15min" }
    )
}

AdminSchema.methods.comparePassword = async function (password) {
    const isMatch = await bycrypt.compare(password, this.password)
    return isMatch
}

AdminSchema.methods.createRefreshToken = function () {
    return jwt.sign(
        { 
            userId: this._id, 
            name: this.firstName + " " + this.lastName,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.JWT_REFRESH_LIFETIME || "7d" }
    )
}

module.exports = mongoose.model("Admin", AdminSchema)
