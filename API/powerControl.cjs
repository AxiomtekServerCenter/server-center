const { createAxiosInstance } = require("../Helper/ApiHelper.cjs");

const setupPowerControlApi = (app) => {
  app.post("/powercontrol", async (req, res) => {
    let statusCode;
    let responseMsg = "";
    const rebootResult = await reboot({
      token: req.body.token,
      ip: req.body.ip,
      resetType: req.body.resetType,
    });

    if (rebootResult && rebootResult.status) {
      statusCode = rebootResult.status;
      responseMsg = req.body.token;
    } else {
      statusCode = rebootResult?.response?.status || 400;
      const operation = req.body.resetType === "On" ? "on" : "off";
      responseMsg = "Failed to turn " + operation;
    }

    res.writeHead(statusCode, { "Content-type": "application/json" });
    res.write(responseMsg);
    res.end();
  });
};

async function reboot({ token, ip, resetType }) {
  const data = { ResetType: resetType };
  console.log(
    `\n\n Reboot - request: ${resetType}. (${token}, ${ip})  <${new Date()}>`,
  );
  const axiosInstance = createAxiosInstance(ip, token);

  return await axiosInstance
    .post("/redfish/v1/Systems/system/Actions/ComputerSystem.Reset", data)
    .catch((error) => {
      console.log("\n Reboot error: ", error);
      return error;
    });
}

module.exports = { setupPowerControlApi };
