const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Server runnning.");
});

app.get("/test", (req, res) => {
  res.send("this is a test route.");
});

app.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);
});
