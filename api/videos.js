module.exports = {
  getList,
  addTiming
};

const axios = require("axios");
const { youtube } = require("../config");
const { Video } = require("../models/video");
const { Channel } = require("../models/channel");

function getList(req, res) {
  Video.find({}, (err, videos) => {
    if (err) return res.status(500).json({err});
    return res.status(200).json({ response: videos});
  });
}

function addTiming(req, res) {
  const { id, timings } = req.body;
  console.log({ ip: req.ip, id, timings});
  axios.get(`${youtube.api}/videos`, {
    params: {
      part: "snippet",
      id,
      key: youtube.key
    }
  }).then(response => {
    const channelId = response.data.items[0].snippet.channelId;
    console.log({channelId});
    Channel.findOne({channelId}, (channelError, channel) => {
      if (channelError) return res.status(500).json({ channelError });
      if (!channel) return res.status(400).json({ response: "This channel is unavailable" });

      const newTiming = new Video({ id, timings });
      newTiming.save(timingError => {
        if (timingError) return res.status(500).json({ timingError });
        return res.status(201).json({ response: newTiming });
      });
    });
  }).catch(error => {
    console.log(error.response.data);
  });
}
