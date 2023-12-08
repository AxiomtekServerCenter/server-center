const {
  createAxiosInstance,
  sendSuccessResponse,
  sendErrorResponse,
} = require("../Helper/ApiHelper.cjs");

const setupOverviewApi = (app) => {
  app.post("/getoverview", async (req, res) => {
    const { ip, token } = req.body;

    response = await getSystemInfo(ip, token);

    if (response.data) {
      let responseData = {};
      responseData[response.name] = response.data;
      sendSuccessResponse(res, responseData);
    } else {
      const status = response.error?.response?.status || 400;
      sendErrorResponse(res, response.error, status);
    }
  });

  const getSystemInfo = (ip, token) => {
    const axiosInstance = createAxiosInstance(ip, token);
    return axiosInstance
      .get("/redfish/v1")
      .then((response) => {
        return axiosInstance.get(
          `${response.data.Systems["@odata.id"]}/system`,
        );
      })
      .then(({ data }) => {
        return {
          name: "SystemInfo",
          data: {
            manufacturer: data.Manufacturer,
            model: data.Model,
            serialNumber: data.SerialNumber,
          },
        };
      })
      .catch((error) => {
        console.log("\n\n System info error: ", error);
        return {
          name: "SystemInfo",
          error: error,
        };
      });
  };
};

module.exports = { setupOverviewApi };
