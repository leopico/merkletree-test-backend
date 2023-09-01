const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const router = require("./routes/user.routes");
// console.log(process.env.REACT_URL);

app.use(
  cors({
    origin: process.env.REACT_URL,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", router);

const startServer = () => {
  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
};

startServer();
