const WebSocket = require("ws");
const deviceModel = require("../models/deviceModel");
const moment = require("moment-timezone");

const espAlertSocket = (server) => {
    const wSocket = new WebSocket.Server({ noServer: true });
    console.log("web-socket initialized");

    wSocket.on("connection", (ws, req) => {
        const serverIp = req.socket.remoteAddress;
        console.log(`esp32 connected from ${serverIp}`);


        ws.on("message", async (message) => {
            console.log(message.toString());

            try {

                let data;

                try {
                    data = JSON.parse(message);
                    console.log("parsed json data => ", data);
                } catch {
                    console.log("non-JSON message:", message.toString());
                    return;
                }

                await deviceModel.findOneAndUpdate(
                    { deviceId: data.deviceId },
                    {
                        AmbientData: data.ambient,
                        FreezerData: data.freezer,
                        batteryAlert: data.batteryAlert === "LOW",
                        refrigeratorAlert: data.refrigeratorAlert === "ALERT",
                        lastUpdateTime: moment().tz("Asia/Karachi").format()
                    },
                    { new: true }
                );
            } catch (error) {
                console.log("trouble while getting data or updating Mongodb");
                console.error("error: ", error.message)
            }

        });

        ws.on("close", (code, reason) => {
            console.log(`esp32 disconnected (code: ${code} , reason: ${reason} )`);
        });

        ws.on("error", (error) => {
            console.error("Web-Socket Error", error.message);
        });

        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send('{"serverMsg : Hellow ESP32}');
                console.log("Confirmation Message Send to ESP32");
            }
        }, 1000);
    });


    return wSocket;
}

module.exports = { espAlertSocket };