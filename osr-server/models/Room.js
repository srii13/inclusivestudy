const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  name: { type: String },
  host: { type: String, required: true },
  roomId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);
