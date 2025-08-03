const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please provide resource title"],
        trim: true
    },
    path: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, "Path cannot be more than 1000 characters"],
        minlength: [10, "Path must be at least 10 characters"]
    }
}, { timestamps: true });

module.exports = mongoose.model("Resource", ResourceSchema);
