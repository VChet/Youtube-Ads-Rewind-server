const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  timings: [{
    _id: false,
    starts: {
      type: Number,
      required: true
    },
    ends: {
      type: Number,
      required: true
    }
  }]
});

exports.Video = mongoose.model("Video", schema);
