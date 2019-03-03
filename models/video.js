const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  video: {
    id: {
      type: String,
      required: true,
      unique: true
    },
    timings: [{
      starts: {
        type: String,
        required: true
      },
      ends: {
        type: String,
        required: true
      }
    }]
  }
});

exports.Video = mongoose.model("Video", schema);
