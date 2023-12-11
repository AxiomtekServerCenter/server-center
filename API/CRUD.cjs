const fs = require("fs");
const path = require("path");

const {
  handleFile,
  TYPE_SERVER_DATA,
  FILE_RESULT_SUCCESS,
} = require("../Helper/FileHelper.cjs");
const { sendResponse } = require("../Helper/ApiHelper.cjs");
const jsonFilePath = path.resolve(__dirname, "../models/data.json");

const setupCrudApi = (app) => {
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

  app.post("/addServer", (req, res) => {
    console.log("addServer, request: ", req.body);
    let responseMessage = "";
    let error;
    let data;
    const { ip, serverName, username, password } = req.body;

    if (!ip || !username || !password) {
      responseMessage = "Missing parameters.";
      error = responseMessage;
      sendResponse(res, error, responseMessage, data);
      return;
    }

    const handleFileResult = handleFile(TYPE_SERVER_DATA);
    if (handleFileResult.message !== FILE_RESULT_SUCCESS) {
      responseMessage = handleFileResult.message;
      error = "Cannot process file.";
    } else {
      try {
        data = JSON.parse(handleFileResult.data);
        data.unshift({
          ip: ip,
          serverName: serverName,
          username: username,
          password: password,
          checked: true,
          apiResult: "",
        });
        let str = JSON.stringify(data);
        fs.writeFileSync(jsonFilePath, str);
      } catch (e) {
        responseMessage = "Failed to parse JSON file.";
        error = e;
      }
    }
    sendResponse(res, error, responseMessage, data);
  });

  app.post("/updateserver", (req, res) => {
    const { ip, serverName, username, password, checked } = req.body;
    console.log(
      "Update Server - request: ",
      ip,
      serverName,
      username,
      password,
      checked,
    );

    const handleFileResult = handleFile(TYPE_SERVER_DATA);
    let responseMessage = "";
    let error;
    let data;
    if (handleFileResult.message !== FILE_RESULT_SUCCESS) {
      responseMessage = handleFileResult.message;
      error = "Cannot process file.";
    } else {
      try {
        let data = JSON.parse(handleFileResult.data);
        let index = data.findIndex((server) => server.ip === ip);
        data[index].serverName = serverName;
        data[index].username = username;
        data[index].password = password;
        data[index].checked = checked;

        let str = JSON.stringify(data);
        fs.writeFileSync(jsonFilePath, str);
      } catch (e) {
        responseMessage = "Failed to parse JSON file.";
        error = e;
      }
    }
    sendResponse(res, error, responseMessage, data);
  });

  app.post("/deleteserver", (req, res) => {
    const { ip } = req.body;

    const handleFileResult = handleFile(TYPE_SERVER_DATA);
    let responseMessage = "";
    let error;
    let data;
    if (handleFileResult.message !== FILE_RESULT_SUCCESS) {
      responseMessage = handleFileResult.message;
      error = "Cannot process file.";
    } else {
      try {
        let data = JSON.parse(handleFileResult.data);
        let index = data.findIndex((server) => server.ip === ip);
        data.splice(index, 1);
        let str = JSON.stringify(data);
        fs.writeFileSync(jsonFilePath, str);
      } catch (e) {
        responseMessage = "Failed to parse JSON file.";
        console.log("\n\n Deleting file: ", responseMessage, jsonFilePath);
        error = e;
      }
    }
    sendResponse(res, error, responseMessage, data);
  });
};

module.exports = { setupCrudApi };
