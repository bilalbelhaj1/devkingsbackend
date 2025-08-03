const mongoose = require("mongoose");

const CompletedSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    lessonId: {
        type: mongoose.Types.ObjectId,
        ref: "Lesson",
        required: true
    },
    tutorialId: {
        type: mongoose.Types.ObjectId,
        ref: "Tutorial",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Completed", CompletedSchema);
