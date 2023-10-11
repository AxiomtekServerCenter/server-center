import { createRequire } from "module";
const require = createRequire(import.meta.url);
const https = require("node:https");
const express = require("express");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");
const { verbose } = require("./Helper/Debug.cjs");
const {
  handleFile,
  FILE_RESULT_SUCCESS,
  FILE_RESULT_ERROR,
  TYPE_SERVER_DATA,
} = require("./Helper/FileHelper.cjs");
const frontendUrl = "https://127.0.0.1:3006";

let port = 6001;


const app = express();

const options = {
  rejectUnauthorized: false,
  key: fs.readFileSync("./https_auth/server-key.pem"),
  ca: [fs.readFileSync("./https_auth/cert.pem")],
  cert: fs.readFileSync("./https_auth//server-cert.pem"),
};



app.use(express.json());
app.use(cors({ origin: frontendUrl }));
app.get("/", (req, res) => {
  res.send("Hello World!");
});

const server = https.createServer(options, app).listen(port, () => {
  if (verbose) {
    console.log(`\n\n Server starts listening at port:${port}`);
  }
});

app.get("/getservers", (req, res) => {
  const handleFileResult = handleFile(TYPE_SERVER_DATA);
  let responseMessage = "";
  let error;
  let data;
  if (handleFileResult.message !== FILE_RESULT_SUCCESS) {
    responseMessage = handleFileResult.message;
    error = "Cannot process file.";
  } else {
    try {
      data = JSON.parse(handleFileResult.data);
    } catch (e) {
      responseMessage = "Failed to parse JSON file.";
      error = e;
    }
  }
  sendResponse(res, error, responseMessage, data);
});



function sendResponse(res, error, responseMessage, data) {
  if (error) {
    res.status(400);
    res.json({ status: "fail", message: responseMessage });
    res.end();
  } else {
    res.status(200);
    res.json(data);
    res.end();
  }
}
