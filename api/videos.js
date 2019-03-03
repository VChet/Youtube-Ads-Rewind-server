module.exports = {
  getList
};

const { Video } = require("../models/video");

function getList(req, res) {
  Video.find({}, (err, videos) => {
    if (err) return res.status(500).json({err});
    return res.status(200).json({ response: videos});
  });
}
