const express = require("express");
const router = express.Router();

const {
  checkVideo,
  addTiming
} = require("../api/videos");

router.get("/video/check", checkVideo);
router.post("/video/report", addTiming);

module.exports = router;
