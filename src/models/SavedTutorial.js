const mongoose = require("mongoose");

const SavedTutorialSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    tutorialId: {
        type: mongoose.Types.ObjectId,
        ref: "Tutorial",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("SavedTutorial", SavedTutorialSchema);
