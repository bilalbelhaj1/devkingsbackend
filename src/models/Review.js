const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    tutorialId: {
        type: mongoose.Types.ObjectId,
        ref: "Tutorial",
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [1000, "Comment cannot be more than 1000 characters"],
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Review", ReviewSchema);
