const express = require("express");
const router = express.Router();

const { getList } = require("../api/videos");

router.get("/videos", getList);

module.exports = router;
