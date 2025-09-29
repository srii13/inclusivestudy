const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true }, // ✅ main ID
  subject: String,
  name: String,
  host: String,
  participants: [String],
});

module.exports = mongoose.model("Room", roomSchema);
