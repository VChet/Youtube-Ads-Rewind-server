module.exports = {
  getList,
  addTiming
};

const axios = require("axios");
const config = require("../config");

const { Video } = require("../models/video");
const { Channel } = require("../models/channel");
const { Storage } = require("../models/storage");

function getList(req, res) {
  Video.find({}, (err, videos) => {
    if (err) return res.status(500).json({err});
    return res.status(200).json({ response: videos});
  });
}

async function addTiming(req, res) {
  const { id, timings } = req.body;
  console.log({ ip: req.ip, id, timings});
  // 1. Check if we are ok to store videos from this channel
  let channelId = await axios.get(`${config.youtube.api}/videos`, {
    params: {
      part: "snippet",
      id,
      key: config.youtube.key
    }
  }).then(response => {
    return response.data.items[0].snippet.channelId;
  }).catch(error => {
    console.log(error.response.data);
  });

  const channel = await Channel.findOne({channelId}).lean();
  if (!channel) return res.status(400).json({ response: "This channel is unavailable" });
  // 2. Check if this video is already stored in the storage
  const storageVideo = await Storage.findOne({ id }).lean();
  // 2.1. If not - add new record and return
  if (!storageVideo) {
    const newTiming = new Storage({ id, timings });
    newTiming.save(timingError => {
      if (timingError) console.log("Error adding new timing", timingError);
      console.log("New timing has been added", { id, timings });
      res.status(201).json({ response: "New timing has been added to the storage" });
    });
    return;
  }
  // 2.2. Otherwise, push to the existing storage
  const pushTiming = await Storage.findOneAndUpdate({ id }, { $push: { timings }});
  console.log("Timing has been pushed to the existing storage", timings);
  // 3. Count timings for this video
  const pipeline = [
    { $match: { id } },
    { $project: {
      size: { $size: "$timings" }
    }}
  ];
  const storageTimings = await Storage.aggregate(pipeline);
  const timingsCounter = storageTimings[0].size;
  console.log({ timingsCounter });
  // 4. If storage limit is not exceeded - return message
  if (timingsCounter < config.storageLimit) return res.status(201).json({
    response: "Timing has been pushed to the existing storage",
    timings
  });
  // 5. Otherwise, check existing storage to find duplicates
  // TODO: Find duplicates and update main collection
  console.log({ timings: storageVideo.timings });
}
