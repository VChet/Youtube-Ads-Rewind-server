module.exports = {
  checkVideo,
  addTiming
};

const axios = require("axios");
const config = require("../config");

const { Video } = require("../models/video");
const { Channel } = require("../models/channel");
const { Storage } = require("../models/storage");

function checkVideo(req, res) {
  const { videoId } = req.query;
  Video.findOne({ id: videoId }, (err, video) => {
    if (err) return res.status(500).json({ err });
    if (!video) return res.status(404).json({ error: "No advertisement data" });
    return res.status(200).json({ response: video });
  });
}

async function addTiming(req, res) {
  const { id, timings } = req.body;
  console.log({ ip: req.ip, id, timings});
  // 1. Check if we are ok to store videos from this channel
  const channelId = await axios.get(`${config.youtube.api}/videos`, {
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
  await Storage.findOneAndUpdate({ id }, { $push: { timings }});
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
  // 5. Otherwise, find majority timings for this video in the storage
  function findMajority(array) {
    let counter = 0;
    let majorityElement;
    for (let i = 0; i < array.length; i++) {
      if (counter === 0) {
        majorityElement = array[i];
        counter = 1;
      } else if (array[i] === majorityElement) {
        counter++;
      } else {
        counter--;
      }
    }
    return majorityElement;
  }

  const startTimings = storageVideo.timings.map(t => t.starts);
  const endTimings = storageVideo.timings.map(t => t.ends);
  const majorityStart = findMajority(startTimings);
  const majorityEnd = findMajority(endTimings);
  console.log({ startTimings, endTimings });
  console.log({ majorityStart, majorityEnd });
  // 6. Push majority timing to the main collection
  const newTiming = new Video({
    id,
    timings: {
      starts: majorityStart,
      ends: majorityEnd
    }
  });
  newTiming.save(timingError => {
    if (timingError) console.log("Error adding new timing", timingError);
    console.log("New timing has been added to the main collection!", { id: newTiming.id, timing: newTiming.timings });
    res.status(201).json({ response: "New timing has been added to the main collection" });
  });
  // 7. Remove these values from the storage
  Storage.findOne({ id }).exec((err, storage) => {
    if (err) console.error("Error finding storage by id", err);
    // Find near values. For example 7 < timing < 13
    const timingsToPull = [];
    storage.timings.map(timing => {
      const startCollision = timing.starts >= parseInt(majorityStart) - parseInt(config.timingDifference) && timing.starts <= parseInt(majorityStart) + parseInt(config.timingDifference);
      const endCollision = timing.ends >= parseInt(majorityEnd) - parseInt(config.timingDifference) && timing.ends <= parseInt(majorityEnd) + parseInt(config.timingDifference);
      if (startCollision && endCollision) {
        timingsToPull.push(timing._id);
      }
    });

    // Remove near values
    Storage.findOneAndUpdate(
      { id },
      { $pull: {
        timings: {
          _id: { $in: timingsToPull }
        }
      }},
      err => {
        if (err) console.log({ err });
      }
    );
  });
}
