const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
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
});

exports.Storage = mongoose.model("Storage", schema);
