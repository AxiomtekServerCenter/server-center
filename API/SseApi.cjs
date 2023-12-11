const { subscribeSse } = require("../EventService/SSE/sseClient.cjs");

const setupSseApi = (app) => {
  app.post("/subscribesse", async (req, res) => {
    console.log("\n\n router: /subscribesse", req.body);
    if (req?.body?.server) {
      subscribeSse(req.body.server);
      res.writeHead(200, { "Content-type": "application/json" });
      res.end();
    } else {
      res.writeHead(400, { "Content-type": "application/json" });
      res.end();
    }
  });
};

module.exports = { setupSseApi };
