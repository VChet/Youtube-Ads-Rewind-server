console.log(`process.env.NODE_ENV: ${process.env.NODE_ENV}`);

let overwriteConfig;

if (process.env.NODE_ENV === "production") {
  overwriteConfig = require("./config.prod");
}

module.exports = {
  appPort: "7542",
  mongoUrl: "mongodb://localhost/youtube_ads",
  storageLimit: 10,
  timingDifference: 3,  // in seconds
  youtube: {
    api: "https://www.googleapis.com/youtube/v3",
    key: "YOUR_KEY"
  },
  ...overwriteConfig
};
