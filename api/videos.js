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

function collisionCheck(timingStart, timingEnd, DBStart, DBEnd) {
  // Find near values
  // For example:
  //   DBStart = 10, timingDifference = 3
  //   Collision if 7 <= timingStart <= 13

  const startCollision = (
    timingStart >= DBStart - config.timingDifference &&
    timingStart <= DBStart + config.timingDifference
  );
  const endCollision = (
    timingEnd >= DBEnd - config.timingDifference &&
    timingEnd <= DBEnd + config.timingDifference
  );
  return startCollision && endCollision;
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
  // 2. Find this timing in main collection
  const mainVideo = await Video.findOne({ id }).lean();
  if (mainVideo) {
    let collision = false;
    mainVideo.timings.map(async (existingTiming) => {
      if (collisionCheck(
        timings.starts,
        timings.ends,
        parseInt(existingTiming.starts),
        parseInt(existingTiming.ends)
      )) {
        console.log("Collision with existing record");
        return collision = true;
      }
    });
    if (collision) return res.status(409).json({ error: "This timing is already tracked" });
  }

  // 3. Find this video in storage collection
  const storageVideo = await Storage.findOne({ id }).lean();
  // 3.1. If not found - add new record and return
  if (!storageVideo) {
    const newTiming = new Storage({ id, timings });
    newTiming.save(timingError => {
      if (timingError) console.log("Error adding new timing", timingError);
      console.log("[Storage] New timing", { id, timings });
      res.status(201).json({ response: "New timing has been added to the storage" });
    });
    return;
  }
  // 3.2. Otherwise, push to the existing storage
  await Storage.findOneAndUpdate({ id }, { $push: { timings }});
  // 4. Count timings for this video
  const pipeline = [
    { $match: { id } },
    { $project: {
      size: { $size: "$timings" }
    }}
  ];
  const storageTimings = await Storage.aggregate(pipeline);
  const timingsCounter = storageTimings[0].size;
  console.log({ timingsCounter });
  // 5. If storage limit is not exceeded - return message
  if (timingsCounter < config.storageLimit) {
    console.log("[Storage] Push timing", timings);
    return res.status(201).json({ response: "Timing has been pushed to the existing storage" });
  }
  // 6. Otherwise, find majority timings for this video in the storage
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
  // console.log({ startTimings, endTimings });
  // console.log({ majorityStart, majorityEnd });

  // 7. Check if this video is already stored
  if (mainVideo) {
    // 7.1 If video exists in main collection - push to this record
    Video.findByIdAndUpdate(
      mainVideo._id,
      { $push: {
        timings: {
          starts: majorityStart,
          ends: majorityEnd
        }
      }},
      (error, response) => {
        if (error) console.error("Error updating main collection", error);
        console.log("[Main] Push timing", {
          id: mainVideo.id,
          timings: {
            starts: majorityStart,
            ends: majorityEnd
          }
        });
        res.status(200).json({ response: "New timing has been pushed to the main collection" });
      }
    );
  } else {
    // 7.2 Otherwise — create new record
    const newTiming = new Video({
      id,
      timings: {
        starts: majorityStart,
        ends: majorityEnd
      }
    });
    newTiming.save(timingError => {
      if (timingError) console.log("Error adding new timing", timingError);
      console.log("[Main] New timing", { id: newTiming.id, timing: newTiming.timings.toObject() });
      res.status(201).json({ response: "New video has been added to the main collection" });
    });
  }
  // 8. Remove added timings from the storage
  Storage.findOne({ id }).exec((err, storage) => {
    if (err) console.error("Error finding storage by id", err);
    const timingsToPull = [];
    storage.timings.map(timing => {
      if (collisionCheck(
        timing.starts,
        timing.ends,
        parseInt(majorityStart),
        parseInt(majorityEnd)
      )) {
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
