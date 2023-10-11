const fs = require("fs");
const FILE_RESULT_SUCCESS = "FILE_RESULT_SUCCESS";
const FILE_RESULT_ERROR = "FILE_RESULT_ERROR";
const TYPE_SERVER_DATA = "TYPE_SERVER_DATA";
const path = require("path");

function handleFile(type) {
  let resultMsg = "";
  let data;
  let jsonFilePath;

  switch (type) {
    case TYPE_SERVER_DATA:
      jsonFilePath = path.resolve(__dirname, "../models/data.json");
      break;
    default:
      break;
  }

  if (fs.existsSync(jsonFilePath)) {
    try {
      data = fs.readFileSync(jsonFilePath);
      resultMsg = FILE_RESULT_SUCCESS;
    //  TODO: if (type === TYPE_LINE_NOTIFY_GET) {
    //     data = data.toString("utf8");
    //   }
    } catch (e) {
      resultMsg = "Failed to read JSON file.";
      console.log("\n\n Failed to parse JSON of: ", jsonFilePath, e);
    }
  } else {
    resultMsg = "File " + jsonFilePath + " does not exist";
    console.log("\n\n ", resultMsg);
  }

  return { message: resultMsg, data: data };
}

module.exports = {
  handleFile,
  FILE_RESULT_SUCCESS,
  FILE_RESULT_ERROR,
  TYPE_SERVER_DATA,
};
