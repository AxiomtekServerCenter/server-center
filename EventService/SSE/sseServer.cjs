"use strict";
const querystring = require("querystring");
const axios = require("axios");
const http = _interopDefault(require("http"));
const { verbose } = require("../../Helper/Debug.cjs");
const {
  handleFile,
  RESULT_SUCCESS,
  TYPE_LINE_NOTIFY,
} = require("../../Helper/FileHelper.cjs");

/* * * * * * * * * * * * * * * * */
/*                               */
/*     Node.js: SSE server       */
/*     React.js: SSE client      */
/*                               */
/* * * * * * * * * * * * * * * * */

function _interopDefault(ex) {
  return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
}

const itAlive = null;

const frontendSender = (req, res) => {
  req.socket.setNoDelay(true);

  res.writeHead(200, {
    "Access-Control-Allow-Origin": "127.0.0.1:3006",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  return {
    send: function send(data, ip) {
      if (data?.data) {
        const jsonObj = JSON.parse(data.data);
        jsonObj.ip = ip;
        let jsonStr = JSON.stringify(jsonObj);
        res.write("data: " + jsonStr + "\n\n");
        console.log("\n\n extract SSE message ", jsonObj?.Events?.[0].Message);
        // notifyLine("SSE: " + jsonObj?.Events?.[0].Message); // TODO: Line Notify
      }
    },
    close: function close(callback) {
      res.on("close", function () {
        if (itAlive) clearInterval(itAlive);
        if (callback) callback();
      });
    },
  };
};

const sseServer = function sseServer(cb, port) {
  const PORT = 5555;
  const server = http.createServer(function (req, res) {
    if (req.url !== "/stream") {
      console.log("\nThe request is not stream");
      return res.end();
    }

    const clientSender = frontendSender(req, res);
    cb(clientSender);
  });

  server
    .listen(PORT, function () {
      if (verbose)
        console.log("\n\n SSE Server running, listening at port " + PORT + ".");
    })
    .once("error", function (err) {
      if (err.code != "EADDRINUSE") return fn(err);
      console.log("\n\n SSE error: port " + PORT + " is in use ");
    });
};

// TODO: Line Notify
// const notifyLine = async (msg) => {
//   const handleFileResult = handleFile(TYPE_LINE_NOTIFY);
//   let responseMessage = "";
//   let data;

//   if (handleFileResult.message !== RESULT_SUCCESS) {
//     responseMessage = handleFileResult.message;
//     console.log(
//       "\n\n SSE error: Cannot process LINE Notify file. ",
//       responseMessage,
//     );
//   } else {
//     try {
//       data = JSON.parse(handleFileResult.data);
//     } catch (err) {
//       console.log("\n\n SSE error: Faild to parse LINE Notify file. ", err);
//     }
//   }

//   data.forEach((item) => {
//     console.log(
//       "\n\n SSE: posting LINE Notify message: ",
//       item.lineToken,
//       " : ",
//       msg,
//     );
//     // const queryData = querystring.stringify({message: msg, imageThumbnail: logoUrl, imageFullsize: logoUrl});
//     const queryData = querystring.stringify({ message: msg });
//     axios
//       .post("https://notify-api.line.me/api/notify", queryData, {
//         headers: {
//           Authorization: `Bearer ${item.lineToken}`,
//         },
//       })
//       .catch((err) => {
//         console.log("\n\n SSE: Faild to post Line Notify message", err);
//       });
//   });
// };

module.exports = { sseServer, frontendSender };
