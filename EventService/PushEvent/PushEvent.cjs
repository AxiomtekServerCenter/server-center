"use strict";
const https = require("https");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const express = require("express");
const socket = require("socket.io");
const circularJSON = require("circular-json");
const websocketPort = 5502;
const pushEventPort = 5501;
const bodyParser = require("body-parser");
const querystring = require("querystring");
const cors = require("cors");
const { getLocalIPAddress } = require("../../Helper/NetworkHelper.cjs");
const { verbose, lineVerbose } = require("../../Helper/Debug.cjs");
const { exec } = require("child_process");
const { createAxiosInstance } = require("../../Helper/ApiHelper.cjs");
const {
  handleFile,
  RESULT_SUCCESS,
  TYPE_LINE_NOTIFY,
} = require("../../Helper/FileHelper.cjs");
const NO_DATA = "NO_DATA";

let server;
let io;
require("request").debug = true;

const app = express();
// app.use(cors({ origin: "https://127.0.0.1:3006" }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Connection", "close");
  res.removeHeader("Transfer-Encoding");
  next();
});

const keyPath = path.resolve(__dirname, "../../https_auth/server-key.pem");
const caPath = path.resolve(__dirname, "../../https_auth/cert.pem");
const certPath = path.resolve(__dirname, "../../https_auth/server-cert.pem");

const options = {
  agent: false,
  key: fs.readFileSync(keyPath),
  ca: [fs.readFileSync(caPath)],
  cert: fs.readFileSync(certPath),
};

const initPushStyleEvent = () => {
  app.get("/", async (req, res) => {
    res.status(200);
    res.header("Content-Type", "text/html");
    res.end();
  });

  app.post("/Events", async (req, res) => {
    try {
      let json = circularJSON.stringify(req);
      let jsonObject = JSON.parse(json);
      const address =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      const ip = address?.replace(/^.*:/, "");

      io.emit("pushEvent", { data: jsonObject, ip: ip });

      console.log("\n\n First message: ", jsonObject.body?.Events?.[0].Message);
      let msg = "";
      msg += jsonObject.body?.Events?.[0]?.Message;
      // notifyLine(msg); // TODO: Line Notify
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end();
    } catch (error) {
      console.log("\n\n Push event error:", error);
      res.writeHead(500, { "Content-type": "application/json" });
      res.end();
    }
  });

  https.createServer(options, app).listen(pushEventPort, () => {
    if (verbose) {
      console.log(
        "\n\n Push style event server listening at port " + pushEventPort,
      );
    }
  });

  // server = https.Server(options, app);
  server = https.Server(options);

  server.listen(websocketPort, () => {
    if (verbose) {
      console.log("\n\n Websocket server listening at port " + websocketPort);
    }
  });

  io = socket(server, {
    cors: {
      origin: "https://127.0.0.1:3006",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("\n\n Websocket successfully connected");
    // setLineNotifyWebSocket(socket); // TODO: Line Notify
    socket.on("getMessage", (message) => {
      socket.emit("getMessage", message);
    });
  });
};

const subscribePushEvent = async ({ ip, token }) => {
  const ipResponse = await getLocalIPAddress()
    .then(async (ip) => {
      console.log("\n\n Local IP Address with Non-empty Gateway:", ip);
      return {
        status: 200,
        data: ip,
      };
    })
    .catch((error) => {
      return {
        status: 500,
        error: error.message,
      };
    });

  const localIPAddress = ipResponse.data;

  if (!localIPAddress) {
    return ipResponse;
  }

  const data = {
    Destination: "https://" + localIPAddress + ":" + pushEventPort + "/Events",
    Context: "Test_Context",
    Protocol: "Redfish",
    EventFormatType: "Event",
    SubscriptionType: "RedfishEvent",
    RegistryPrefixes: ["OpenBMC", "TaskEvent"],
    ResourceTypes: ["Task"],
  };

  return await createAxiosInstance(ip, token)
    .post("/redfish/v1/EventService/Subscriptions", data)
    .then((res) => {
      let location = res?.headers?.location;
      if (!location) {
        return {
          status: 400,
          error: "Failed to parse subscription ID.",
        };
      }

      const api = "/redfish/v1/EventService/Subscriptions/";
      const subscriptionId = location.replace(api, "");

      return {
        status: res.status,
        data: {
          subscriptionId: subscriptionId,
        },
      };
    })
    .catch((error) => {
      printPushEventErrMsg(ip, error);
      const errorDetail = getSubscribeErrDetail(error?.response?.data);
      const err = errorDetail === NO_DATA ? error : errorDetail;

      return {
        status: error?.response?.status || 400,
        error: err,
      };
    });
};

// TODO: Line Notify: notifyLine()

const getSubscribeSuccessMsg = (response, ip) => {
  return (
    "\n\n Successfully subscribed push event: " +
    ip +
    ". Location: " +
    response?.headers?.location
  );
};

const printPushEventErrMsg = (ip, error) => {
  console.log(
    `\n\n Failed to subscribe push event: ${ip}. Error code: ${error?.response?.status}`,
  );
};

const getSubscribeErrDetail = (responseData) => {
  if (responseData) {
    const msg = responseData["Destination@Message.ExtendedInfo"];
    if (msg?.[0]) {
      return "\n\n Push event subscription error detail: " + msg[0].Message;
    }
  }

  return NO_DATA;
};

module.exports = { initPushStyleEvent, subscribePushEvent };
