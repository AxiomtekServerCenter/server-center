const axios = require("axios");
const https = require("node:https");

const createAxiosInstance = (ip, token) => {
  return axios.create({
    withCredentials: true,
    baseURL: "https://" + ip,
    headers: {
      "X-Auth-Token": token,
    },
    httpsAgent: new https.Agent({
      keepAlive: true,
      rejectUnauthorized: false,
    }),
  });
};

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

function sendSuccessResponse(res, data) {
  res.status(200);
  res.json(data);
  res.end();
}

function sendErrorResponse(res, error, status) {
  res.status(status || 400);
  res.json(error);
  res.end();
}

module.exports = {
  createAxiosInstance,
  sendResponse,
  sendSuccessResponse,
  sendErrorResponse,
};
