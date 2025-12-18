// const WebSocket = require("ws");
// const fs = require("fs");
// const path = require("path");
// const deviceModel = require("../models/deviceModel");
// const axios = require("axios");

// const connectedDevices = new Map();
// const dashboardClients = new Set();

// let FIRMWARE_PATH = path.join(__dirname, "..", "..", "uploads", "ota");

// function initEspOtaSocket(server) {
//     const wss = new WebSocket.Server({ noServer: true });
//     console.log("ESP32 OTA WebSocket Server initialized");

//     wss.on("connection", (ws, req) => {
//         const isDashboard = req.url.includes("admin=true");

//         if (isDashboard) {
//             dashboardClients.add(ws);
//             console.log("Admin dashboard connected");

//             ws.send(JSON.stringify({
//                 type: "device_list",
//                 devices: Array.from(connectedDevices.entries()).map(([id, d]) => ({
//                     deviceId: id,
//                     ip: d.ip,
//                     status: d.status,
//                     connectedAt: d.connectedAt,
//                 })),
//             }));

//             ws.on("close", () => dashboardClients.delete(ws));
//             return;
//         }

//         // DEVICE CONNECTION
//         let deviceId = null;
//         const deviceIP = req.socket.remoteAddress;
//         console.log(`New ESP32 connection from ${deviceIP}`);

//         ws.on("message", async (message) => {
//             try {
//                 const data = JSON.parse(message.toString());

//                 // DEVICE REGISTRATION -------------------------
//                 if (data.type === "register") {
//                     deviceId = data.deviceId;
//                     connectedDevices.set(deviceId, {
//                         ws,
//                         ip: deviceIP,
//                         connectedAt: new Date(),
//                         status: "connected",
//                     });

//                     console.log(`Device registered: ${deviceId}`);

//                     broadcastToDashboards({
//                         type: "device_connected",
//                         deviceId,
//                         ip: deviceIP,
//                         time: new Date(),
//                     });

//                     ws.send(JSON.stringify({ type: "registered", status: "success" }));
//                 }

//                 // OTA REQUEST ---------------------------------
//                 else if (data.type === "ota_request") {
//                     console.log(`OTA request from ${deviceId}`);
//                     sendOTAUpdate(ws, deviceId);
//                 }

//                 // OTA PROGRESS --------------------------------
//                 else if (data.type === "ota_progress") {
//                     console.log(`OTA progress ${deviceId}: ${data.progress}%`);

//                     broadcastToDashboards({
//                         type: "ota_progress",
//                         deviceId,
//                         progress: data.progress,
//                     });
//                 }

//                 // OTA COMPLETED SUCCESSFULLY -------------------
//                 else if (data.type === "ota_complete") {
//                     console.log(`OTA complete for ${deviceId}`);

//                     // UPDATE VERSION IN DB
//                     if (connectedDevices.has(deviceId) && connectedDevices.get(deviceId).currentVersionId) {
//                         const newVersion = connectedDevices.get(deviceId).currentVersionId;

//                         await deviceModel.findOneAndUpdate(
//                             { deviceId },
//                             { versionId: newVersion },
//                             { new: true }
//                         );

//                         console.log(`Updated versionId for ${deviceId} → ${newVersion}`);
//                     }

//                     broadcastToDashboards({
//                         type: "ota_result",
//                         deviceId,
//                         status: "pass",
//                     });

//                     ws.send(JSON.stringify({ type: "ota_ack", status: "success" }));
//                 }

//                 // OTA ERROR -----------------------------------
//                 else if (data.type === "ota_error") {
//                     console.error(`OTA error for ${deviceId}: ${data.message}`);

//                     // DO NOT update version in DB

//                     broadcastToDashboards({
//                         type: "ota_result",
//                         deviceId,
//                         status: "fail",
//                         message: data.message,
//                     });
//                 }

//                 // HEARTBEAT -----------------------------------
//                 else if (data.type === "heartbeat") {
//                     if (deviceId && connectedDevices.has(deviceId)) {
//                         connectedDevices.get(deviceId).lastHeartbeat = new Date();
//                     }
//                     ws.send(JSON.stringify({ type: "heartbeat_ack" }));
//                 }

//             } catch (err) {
//                 console.error("Message error:", err);
//             }
//         });

//         ws.on("close", () => {
//             if (deviceId) {
//                 console.log(`Device disconnected: ${deviceId}`);
//                 connectedDevices.delete(deviceId);
//                 broadcastToDashboards({ type: "device_disconnected", deviceId });
//             }
//         });

//         ws.on("error", (err) => {
//             console.error("WebSocket error:", err);
//             if (deviceId) connectedDevices.delete(deviceId);
//         });
//     });

//     return wss;
// }

// // BROADCAST -----------------------------------------
// function broadcastToDashboards(payload) {
//     const data = JSON.stringify(payload);
//     for (const ws of dashboardClients) {
//         if (ws.readyState === WebSocket.OPEN) {
//             ws.send(data);
//         }
//     }
// }

// // SEND OTA UPDATE ------------------------------------
// // function sendOTAUpdate(ws, deviceId, customFirmwarePath) {
// //     const firmwarePath = customFirmwarePath || FIRMWARE_PATH;

// //     if (!fs.existsSync(firmwarePath)) {
// //         ws.send(JSON.stringify({
// //             type: "ota_error",
// //             message: `Firmware file not found: ${firmwarePath}`,
// //         }));
// //         return;
// //     }

// //     const firmwareBuffer = fs.readFileSync(firmwarePath);
// //     const firmwareSize = firmwareBuffer.length;

// //     ws.send(JSON.stringify({
// //         type: "ota_start",
// //         size: firmwareSize,
// //         chunks: Math.ceil(firmwareSize / 2048),
// //     }));

// //     const chunkSize = 2048;
// //     let offset = 0;

// //     const sendChunk = () => {
// //         if (offset < firmwareSize) {
// //             const chunk = firmwareBuffer.slice(offset, offset + chunkSize);
// //             const chunkData = {
// //                 type: "ota_chunk",
// //                 offset,
// //                 data: chunk.toString("base64"),
// //                 totalSize: firmwareSize,
// //             };

// //             if (ws.readyState === WebSocket.OPEN) {
// //                 ws.send(JSON.stringify(chunkData));
// //                 offset += chunkSize;
// //                 setTimeout(sendChunk, 50);
// //             }
// //         } else {
// //             ws.send(JSON.stringify({ type: "ota_end", status: "complete" }));
// //         }
// //     };

// //     setTimeout(sendChunk, 100);
// // }

// async function sendOTAUpdate(ws, deviceId, firmwareUrl) {
//     try {
//         const response = await axios.get(firmwareUrl, { responseType: 'arraybuffer' });
//         const firmwareBuffer = Buffer.from(response.data);

//         const chunkSize = 2048;
//         let offset = 0;

//         const sendChunk = () => {
//             if (offset < firmwareBuffer.length) {
//                 const chunk = firmwareBuffer.slice(offset, offset + chunkSize);
//                 const chunkData = {
//                     type: "ota_chunk",
//                     offset,
//                     data: chunk.toString("base64"),
//                     totalSize: firmwareBuffer.length,
//                 };

//                 if (ws.readyState === WebSocket.OPEN) {
//                     ws.send(JSON.stringify(chunkData));
//                     offset += chunkSize;
//                     setTimeout(sendChunk, 50);
//                 }
//             } else {
//                 ws.send(JSON.stringify({ type: "ota_end", status: "complete" }));
//             }
//         };

//         ws.send(JSON.stringify({
//             type: "ota_start",
//             size: firmwareBuffer.length,
//             chunks: Math.ceil(firmwareBuffer.length / chunkSize),
//         }));

//         setTimeout(sendChunk, 100);
//     } catch (err) {
//         console.error("OTA fetch error:", err);
//         ws.send(JSON.stringify({ type: "ota_error", message: err.message }));
//     }
// }

// module.exports = { initEspOtaSocket, connectedDevices, sendOTAUpdate, broadcastToDashboards };


// const WebSocket = require("ws");
// const axios = require("axios");
// const deviceModel = require("../models/deviceModel");

// const connectedDevices = new Map();
// const dashboardClients = new Set();

// // BROADCAST
// function broadcastToDashboards(payload) {
//     const data = JSON.stringify(payload);
//     for (const ws of dashboardClients) {
//         if (ws.readyState === WebSocket.OPEN) ws.send(data);
//     }
// }

// // SEND OTA UPDATE
// async function sendOTAUpdate(ws, deviceId, firmwareUrl) {
//     try {
//         const response = await axios.get(firmwareUrl, { responseType: "arraybuffer" });
//         const firmwareBuffer = Buffer.from(response.data);
//         const chunkSize = 1024; // 1 KB chunks
//         let offset = 0;

//         ws.send(JSON.stringify({
//             type: "ota_start",
//             size: firmwareBuffer.length,
//             chunks: Math.ceil(firmwareBuffer.length / chunkSize),
//         }));

//         const sendChunk = () => {
//             if (offset >= firmwareBuffer.length) {
//                 ws.send(JSON.stringify({ type: "ota_end", status: "complete" }));
//                 return;
//             }

//             const chunk = firmwareBuffer.slice(offset, offset + chunkSize);
//             ws.send(JSON.stringify({
//                 type: "ota_chunk",
//                 offset,
//                 data: chunk.toString("base64"),
//                 totalSize: firmwareBuffer.length,
//             }));

//             offset += chunkSize;
//             setTimeout(sendChunk, 20);
//         };

//         setTimeout(sendChunk, 50);

//     } catch (err) {
//         console.error("OTA fetch error:", err);
//         ws.send(JSON.stringify({ type: "ota_error", message: err.message }));
//     }
// }

// // ---------------- ESP OTA SOCKET ----------------
// function initEspOtaSocket(server) {
//     const wss = new WebSocket.Server({ noServer: true });
//     console.log("ESP OTA WebSocket initialized");

//     wss.on("connection", (ws, req) => {
//         let deviceId = null;

//         ws.on("message", async (message) => {
//             try {
//                 const data = JSON.parse(message.toString());

//                 if (data.type === "register") {
//                     deviceId = data.deviceId;
//                     connectedDevices.set(deviceId, {
//                         ws,
//                         connectedAt: new Date(),
//                         status: "connected",
//                     });
//                     broadcastToDashboards({ type: "device_connected", deviceId });
//                     ws.send(JSON.stringify({ type: "registered", status: "success" }));
//                 }
//                 else if (data.type === "ota_request") {
//                     if (data.firmwareUrl) await sendOTAUpdate(ws, deviceId, data.firmwareUrl);
//                 }
//             } catch (err) {
//                 console.error("OTA WebSocket message error:", err);
//             }
//         });

//         ws.on("close", () => {
//             if (deviceId) {
//                 connectedDevices.delete(deviceId);
//                 broadcastToDashboards({ type: "device_disconnected", deviceId });
//             }
//         });

//         ws.on("error", (err) => console.error("OTA WebSocket error:", err));
//     });

//     return wss;
// }

// module.exports = {
//     connectedDevices,
//     dashboardClients,
//     broadcastToDashboards,
//     sendOTAUpdate,
//     initEspOtaSocket,  // <-- make sure to export this
// };



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
        console.log(`🚀 OTA started for device: ${deviceId}`);
        console.log(`📦 Fetching firmware from: ${firmwareUrl}`);

        const response = await axios.get(firmwareUrl, {
            responseType: "arraybuffer",
            transformResponse: [(d) => d],
            headers: { Accept: "application/octet-stream" }
        });

        const firmwareBuffer = Buffer.from(response.data);

        // 🔴 Firmware validation
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
                console.log(`✅ OTA transfer complete for ${deviceId}`);
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
        console.error(`❌ OTA error for ${deviceId}:`, err.message);
        ws.send(JSON.stringify({
            type: "ota_error",
            message: err.message,
        }));
    }
}

// ---------------- ESP OTA SOCKET ----------------
function initEspOtaSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });
    console.log("🧠 ESP OTA WebSocket initialized");

    wss.on("connection", (ws, req) => {
        let deviceId = null;
        console.log("🔌 New OTA WebSocket connection");

        ws.on("close", () => clearInterval(pingInterval));

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

                    console.log(`✅ Device registered: ${deviceId}`);

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
                    console.log(`📡 OTA request received from ${deviceId}`);
                    if (data.firmwareUrl) {
                        await sendOTAUpdate(ws, deviceId, data.firmwareUrl);
                    }
                }

                // -------- OTA PROGRESS --------
                else if (data.type === "ota_progress") {
                    console.log(`📊 OTA progress ${deviceId}: ${data.progress}%`);

                    broadcastToDashboards({
                        type: "ota_progress",
                        deviceId,
                        progress: data.progress,
                    });
                }

                // -------- OTA COMPLETE --------
                else if (data.type === "ota_complete") {
                    console.log(`🎉 OTA completed successfully for ${deviceId}`);

                    broadcastToDashboards({
                        type: "ota_result",
                        deviceId,
                        status: "success",
                    });
                }

                // -------- OTA ERROR --------
                else if (data.type === "ota_error") {
                    console.error(`🔥 OTA failed for ${deviceId}: ${data.message}`);

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
                console.log(`🔴 Device disconnected: ${deviceId}`);
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
