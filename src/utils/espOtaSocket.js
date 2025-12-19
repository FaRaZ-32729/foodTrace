const WebSocket = require("ws");
const axios = require("axios");
const deviceModel = require("../models/deviceModel");

const connectedDevices = new Map();
const dashboardClients = new Set();

// ---------------- BROADCAST ----------------
function broadcastToDashboards(payload) {
    const data = JSON.stringify(payload);
    for (const ws of dashboardClients) {
        if (ws.readyState === WebSocket.OPEN) ws.send(data);
    }
}

// ---------------- SEND OTA UPDATE ----------------
async function sendOTAUpdate(ws, deviceId, firmwareUrl) {
    try {
        console.log(`OTA started for device: ${deviceId}`);
        console.log(`Fetching firmware from: ${firmwareUrl}`);

        const response = await axios.get(firmwareUrl, {
            responseType: "arraybuffer",
            transformResponse: [(d) => d],
            headers: { Accept: "application/octet-stream" }
        });

        const firmwareBuffer = Buffer.from(response.data);

        // Firmware validation
        if (firmwareBuffer[0] !== 0xE9) {
            throw new Error("Invalid ESP32 firmware (missing 0xE9 header)");
        }

        const chunkSize = 512;
        let offset = 0;

        ws.send(JSON.stringify({
            type: "ota_start",
            size: firmwareBuffer.length,
            chunks: Math.ceil(firmwareBuffer.length / chunkSize),
        }));

        const sendChunk = () => {
            if (offset >= firmwareBuffer.length) {
                console.log(`OTA transfer complete for ${deviceId}`);
                ws.send(JSON.stringify({ type: "ota_end" }));
                return;
            }

            const chunk = firmwareBuffer.slice(offset, offset + chunkSize);

            ws.send(JSON.stringify({
                type: "ota_chunk",
                offset,
                data: chunk.toString("base64"),
                totalSize: firmwareBuffer.length,
            }));

            offset += chunkSize;
            // setTimeout(sendChunk, 5);
            setTimeout(sendChunk, 20);
        };

        setTimeout(sendChunk, 100);

    } catch (err) {
        console.error(`OTA error for ${deviceId}:`, err.message);
        ws.send(JSON.stringify({
            type: "ota_error",
            message: err.message,
        }));
    }
}

// ---------------- ESP OTA SOCKET ----------------
function initEspOtaSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });
    console.log("ESP OTA WebSocket initialized");

    wss.on("connection", (ws, req) => {
        let deviceId = null;
        console.log("🔌 New OTA WebSocket connection");

        ws.on("message", async (message) => {
            try {
                const data = JSON.parse(message.toString());

                // -------- DEVICE REGISTRATION --------
                if (data.type === "register") {
                    deviceId = data.deviceId;

                    connectedDevices.set(deviceId, {
                        ws,
                        connectedAt: new Date(),
                        status: "connected",
                    });

                    console.log(`Device registered: ${deviceId}`);

                    broadcastToDashboards({
                        type: "device_connected",
                        deviceId,
                        time: new Date(),
                    });

                    ws.send(JSON.stringify({
                        type: "registered",
                        status: "success",
                    }));
                }

                // -------- OTA REQUEST --------
                else if (data.type === "ota_request") {
                    console.log(`OTA request received from ${deviceId}`);
                    if (data.firmwareUrl) {
                        await sendOTAUpdate(ws, deviceId, data.firmwareUrl);
                    }
                }

                // -------- OTA PROGRESS --------
                else if (data.type === "ota_progress") {
                    console.log(`OTA progress ${deviceId}: ${data.progress}%`);

                    broadcastToDashboards({
                        type: "ota_progress",
                        deviceId,
                        progress: data.progress,
                    });
                }

                // -------- OTA COMPLETE --------
                else if (data.type === "ota_complete") {
                    console.log(`OTA completed successfully for ${deviceId}`);

                    broadcastToDashboards({
                        type: "ota_result",
                        deviceId,
                        status: "success",
                    });
                }

                // -------- OTA ERROR --------
                else if (data.type === "ota_error") {
                    console.error(`OTA failed for ${deviceId}: ${data.message}`);

                    broadcastToDashboards({
                        type: "ota_result",
                        deviceId,
                        status: "fail",
                        message: data.message,
                    });
                }

                // -------- HEARTBEAT --------
                else if (data.type === "heartbeat") {
                    ws.send(JSON.stringify({ type: "heartbeat_ack" }));
                }

            } catch (err) {
                console.error("OTA WebSocket message error:", err);
            }
        });

        ws.on("close", () => {
            if (deviceId) {
                console.log(`Device disconnected: ${deviceId}`);
                connectedDevices.delete(deviceId);

                broadcastToDashboards({
                    type: "device_disconnected",
                    deviceId,
                });
            }
        });

        ws.on("error", (err) => {
            console.error("OTA WebSocket error:", err);
        });
    });

    return wss;
}

module.exports = {
    connectedDevices,
    dashboardClients,
    broadcastToDashboards,
    sendOTAUpdate,
    initEspOtaSocket,
};
