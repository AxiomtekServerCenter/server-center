const EventSource = require("eventsource");
const { sseServer } = require("./sseServer.cjs");

/* * * * * * * * * * * * * * * * */
/*                               */
/*     OpenBMC: SSE server       */
/*     Node.js: SSE client       */
/*                               */
/* * * * * * * * * * * * * * * * */

let frontendClient = null;

const startSseServer = () => {
  sseServer((client) => {
    frontendClient = client;
  });
};

const subscribeSse = ({ token, ip }) => {
  const sseUrl = "https://" + ip + "/redfish/v1/EventService/Subscriptions/SSE";
  const es = new EventSource(sseUrl, {
    headers: {
      "X-Auth-Token": token,
      Accept: "text/event-stream",
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    },
    withCredentials: true,
    https: {
      rejectUnauthorized: false,
    },
  });

  es.onopen = es.onmessage = function (event) {
    frontendClient.send(event, ip);
  };

  es.onerror = function (event) {
    const errMsg = `SSE subscription ERROR: ${ip}. Type: ${event.type}. Data: ${event.data}`;

    console.log(errMsg);
    es.close();
  };
};

module.exports = { startSseServer, subscribeSse };
