const { exec } = require("child_process");

async function getLocalIPAddress() {
  return await new Promise((resolve, reject) => {
    exec(
      'wmic nicconfig where "IPEnabled=true" get IPAddress,DefaultIPGateway /format:list',
      { encoding: "utf-8" },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
          return;
        }

        const lines = stdout.split("\r\n");
        // lines.forEach(line => {
        //   console.log("\n\n network info:  ", line);
        // })
        let currentIPAddress = null;

        for (const line of lines) {
          const [key, value] = line.trim().split("=");

          if (key === "IPAddress") {
            currentIPAddress = value;
            let firstIPAddress = currentIPAddress.split(",")[0];
            firstIPAddress = firstIPAddress.replaceAll('"', "");
            firstIPAddress = firstIPAddress.replace("{", "");

            resolve(firstIPAddress);

            return;
          } else if (key === "DefaultIPGateway" && currentIPAddress) {
            const gatewayIP = value.trim();

            if (gatewayIP !== "0.0.0.0") {
              let firstIPAddress = currentIPAddress.split(",")[0];
              firstIPAddress = firstIPAddress.replaceAll('"', "");
              firstIPAddress = firstIPAddress.replace("{", "");

              resolve(firstIPAddress);

              return;
            }
          }
        }

        reject(
          new Error(
            "Unable to determine local IP address with non-empty gateway.",
          ),
        );
      },
    );
  });
}

module.exports = { getLocalIPAddress };
