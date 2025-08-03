const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please provide lesson title"],
        trim: true,
        maxlength: [120, "Title cannot be more than 120 characters"],
        minlength: [3, "Title must be at least 3 characters"]
    },
    description: {
        type: String,
        required: [true, "Please provide lesson description"],
        trim: true,
        maxlength: [1000, "Description cannot be more than 1000 characters"],
        minlength: [10, "Description must be at least 10 characters"]
    },
    videoUrl: {
        type: String,
        required: [true, "Please provide video URL"]
    },
    tutorialId: {
        type: mongoose.Types.ObjectId,
        ref: "Tutorial",
        required: [true, "Please provide tutorialId"]
    },
    resources: [{
        type: mongoose.Types.ObjectId,
        ref: "Resource"
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model("Lesson", LessonSchema);
