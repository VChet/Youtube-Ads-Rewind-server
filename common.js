module.exports = {
  addExpressMiddleware,
};

const mongoose = require("mongoose");
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");

const config = require("./config");

const multer = require("multer");
const upload = multer();

mongoose.connect(config.mongoUrl, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false
});

mongoose.connection.on("error", console.error.bind(console, "MongoDB connection error:"));

function addExpressMiddleware(app) {
  if (app.get("env") !== "test") app.use(morgan("dev"));
  app.use(helmet());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(upload.any());
}
