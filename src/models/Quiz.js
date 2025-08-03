const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true }
});

const QuizSchema = new mongoose.Schema({
    tutorialId: {
        type: mongoose.Types.ObjectId,
        ref: "Tutorial",
        required: true
    },
    questions: [QuestionSchema]
}, { timestamps: true });

module.exports = mongoose.model("Quiz", QuizSchema);
