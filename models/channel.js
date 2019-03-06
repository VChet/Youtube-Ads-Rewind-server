const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  channelId: {
    type: String,
    required: true,
    unique: true
  }
});

exports.Channel = mongoose.model("Channel", schema);
