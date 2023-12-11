import { createRequire } from "module";
const require = createRequire(import.meta.url);
const https = require("node:https");
const express = require("express");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");
const { verbose } = require("./Helper/Debug.cjs");
const { createAxiosInstance, sendResponse } = require("./Helper/ApiHelper.cjs");
const { setupOverviewApi } = require("./API/overview.cjs");
const { setupPowerControlApi } = require("./API/powerControl.cjs");
const { setupCrudApi } = require("./API/CRUD.cjs");
const { setupSseApi } = require("./API/SseApi.cjs");
const { startSseServer } = require("./EventService/SSE/sseClient.cjs");
const { setupPushEventApi } = require("./API/pushEventApi.cjs");
const {
  initPushStyleEvent,
} = require("./EventService/PushEvent/PushEvent.cjs");

const frontendUrl = "https://127.0.0.1:3006";
const port = 6001;
const options = {
  rejectUnauthorized: false,
  key: fs.readFileSync("./https_auth/server-key.pem"),
  ca: [fs.readFileSync("./https_auth/cert.pem")],
  cert: fs.readFileSync("./https_auth//server-cert.pem"),
};

const app = express();
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

setupOverviewApi(app);
setupPowerControlApi(app);
setupCrudApi(app);

// Event Service - SSE:
setupSseApi(app);
startSseServer();

// Push Style Event:
setupPushEventApi(app);
initPushStyleEvent();

app.post("/login", async (req, res) => {
  const { username, password, ip } = req.body;
  const api = `login`;
  const axiosInstance = axios.create({
    withCredentials: true,
    baseURL: "https://" + ip,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  });

  let responseMsg = "";
  let statusCode;

  await axiosInstance
    .post(api, { username, password })
    .then((response) => {
      statusCode = response.status;
      responseMsg = JSON.stringify({ token: response.data.token });
    })
    .catch((error) => {
      console.log(
        `\n\n Login error. Status: ${error?.response?.status}. User: ${username}, IP: ${ip}. Message: ${error?.message}`,
      );
      statusCode = error?.response?.status || 400;
      responseMsg = error?.message || "Unknown reason";
    })
    .finally(() => {
      res.writeHead(statusCode, { "Content-type": "application/json" });
      res.write(responseMsg);
      res.end();
    });
});

app.post("/getserverstatus", async (req, res) => {
  let statusCode;
  let apiResult;
  let serverStatus;

  apiResult = await getServerStatus({
    token: req.body.token,
    ip: req.body.ip,
  });

  if (apiResult && apiResult.status) {
    statusCode = apiResult.status;
    if (
      apiResult.data.Status.State === "Quiesced" ||
      apiResult.data.Status.State === "InTest"
    ) {
      serverStatus = apiResult.data.Status.State;
    } else {
      serverStatus = apiResult.data.PowerState;
    }
  } else {
    statusCode = 400;
  }
  res.writeHead(statusCode, { "Content-type": "application/json" });
  if (statusCode === 200) {
    res.write(serverStatus);
  }

  res.end();
});

async function getServerStatus({ token, ip }) {
  const axiosInstance = createAxiosInstance(ip, token);
  axiosInstance.defaults.withCredentials = true;

  return await axiosInstance
    .get("/redfish/v1/Systems/system")
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return error;
    });
}
