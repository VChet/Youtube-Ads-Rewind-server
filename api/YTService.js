module.exports = {
  getChannelFromVideo
};

const axios = require("axios");
const { youtube } = require("../config");

async function getChannelFromVideo(videoId) {
  const channelId = await axios.get(`${youtube.api}/videos`, {
    params: {
      part: "snippet",
      id: videoId,
      key: youtube.key
    }
  }).then(response => {
    return response.data.items[0].snippet.channelId;
  }).catch(error => {
    console.log(error.response.data);
  });
  return channelId;
}
