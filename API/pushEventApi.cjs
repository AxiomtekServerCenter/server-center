const {
  createAxiosInstance,
  sendResponse,
} = require("../Helper/ApiHelper.cjs");
const {
  subscribePushEvent,
} = require("../EventService/PushEvent/PushEvent.cjs");

const setupPushEventApi = (app) => {
  app.post("/subscribepushevent", async (req, res) => {
    console.log("\n\n Front-end subscribing push event: ", req.body);

    const response = await subscribePushEvent({
      ip: req.body.ip,
      token: req.body.token,
    });

    if (response?.status === 200 || response?.status === 201) {
      res.writeHead(200, { "Content-type": "application/json" });
      res.write(JSON.stringify(response.data));
      res.end();
    } else {
      res.status(response?.status || 400);
      res.json({ error: response.error });
      res.end();
    }
  });

  app.post("/unsubscribepushevent", async (req, res) => {
    console.log("\n\n Front-end unsubscribing push event: ", req.body);
    const { ip, token, subscriptionId } = req.body;
    const axiosInstance = createAxiosInstance(ip, token);

    const response = await axiosInstance
      .delete("/redfish/v1/EventService/Subscriptions/" + subscriptionId)
      .catch((error) => {
        console.log("\n\n Unsubscribe push event error: ", error);
      });

    if (response?.status === 200) {
      res.writeHead(200, { "Content-type": "application/json" });
      res.end();
    } else {
      res.writeHead(400, { "Content-type": "application/json" });
      res.end();
    }
  });
};

module.exports = { setupPushEventApi };
