const express = require("express");

const config = require("./config");
const { addExpressMiddleware } = require("./common");
const api = require("./routes/api");

const app = express();
const PORT = process.env.PORT || config.appPort;

addExpressMiddleware(app);

app.use("/api", api);

app.set("port", PORT);
app.listen(app.get("port"), () => {
  console.log(`Server is up and running on port ${PORT}`);
});

module.exports = app;
