const express = require("express");
const router = express.Router();

const {
  getList,
  addTiming
} = require("../api/videos");

router.get("/videos", getList);
router.post("/video/timing/add", addTiming);

module.exports = router;
