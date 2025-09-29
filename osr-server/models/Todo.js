const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
});

module.exports = mongoose.model("Todo", todoSchema);
