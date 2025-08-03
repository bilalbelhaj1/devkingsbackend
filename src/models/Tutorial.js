const mongoose = require("mongoose");

const TutorialSchema = new mongoose.Schema({
    teacherId: { 
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: [true, "Please provide teacherId"]
    },
    category: {
        type: String,
        required: [true, "Please provide category"]
    },
    title: {
        type: String,
        required: [true, "Please provide title"],
        trim: true,
        maxlength: [120, "Title cannot be more than 120 characters"],
        minlength: [3, "Title must be at least 3 characters"],
    },
    thumbnail: {
        type: String,
        required: [true, "Please provide thumbnail"],
        trim: true,
        maxlength: [1000, "Thumbnail cannot be more than 1000 characters"],
        minlength: [10, "Thumbnail must be at least 10 characters"],
    },
    description: {
        type: String,
        required: [true, "Please provide description"],
        trim: true,
        maxlength: [1000, "Description cannot be more than 1000 characters"],
        minlength: [10, "Description must be at least 10 characters"],
    },
    price: {
        type: Number,
        default: 0.0,
        min: 0,
        max: 1000000
    },
    benefits: [{
        type: String,
        required: [true, "Please provide benefits"],
        trim: true,
        maxlength: [120, "Benefits cannot be more than 120 characters"],
        minlength: [3, "Benefits must be at least 3 characters"],
    }],
    prerequisites: [{
        type: String,
        required: [true, "Please provide prerequisites"],
        trim: true,
        maxlength: [120, "Prerequisites cannot be more than 120 characters"],
        minlength: [3, "Prerequisites must be at least 3 characters"],
    }],
    resources: [{
        type: mongoose.Types.ObjectId,
        ref: "Resource"
    }],
    lessons: [{
        type: mongoose.Types.ObjectId,
        ref: "Lesson"
    }],
    faqs: [{
        type: mongoose.Types.ObjectId,
        ref: "Faq"
    }],
    quiz: {
        type: mongoose.Types.ObjectId,
        ref: "Quiz"
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model("Tutorial", TutorialSchema);