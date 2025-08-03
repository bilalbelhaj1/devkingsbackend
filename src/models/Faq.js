const mongoose = require("mongoose");

const FaqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Please provide question"],
        trim: true,
        maxlength: [120, "Question cannot be more than 120 characters"],
        minlength: [3, "Question must be at least 3 characters"],
    },
    answer: {
        type: String,
        required: [true, "Please provide answer"],
        trim: true,
        maxlength: [120, "Answer cannot be more than 120 characters"],
        minlength: [3, "Answer must be at least 3 characters"],
    },
    tutorialId: {
        type: mongoose.Types.ObjectId,
        ref: "Tutorial",
        required: [true, "Please provide tutorialId"]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Faq", FaqSchema);