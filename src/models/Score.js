const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    quizId: {
        type: mongoose.Types.ObjectId,
        ref: "Quiz",
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    tutorialId: {
        type: mongoose.Types.ObjectId,
        ref: "Tutorial",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Score", ScoreSchema);
