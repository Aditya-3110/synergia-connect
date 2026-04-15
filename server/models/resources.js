const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: String,
  link: String,
  subject: String,
});

module.exports = mongoose.model("Resource", resourceSchema);
