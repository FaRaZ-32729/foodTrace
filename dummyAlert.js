// const deviceModel = require("./src/models/deviceModel");
// const venueModel = require("./src/models/venueModal");

// // Returns alertss for all venues under an organization
// const getAlerts = async (req, res) => {
//     try {
//         const { organizationId } = req.params;

//         // Get all venues of this organization
//         const venues = await venueModel.find({ organization: organizationId }).lean();
//         if (!venues.length) return res.status(404).json({ message: "No venues found" });

//         const venueIds = venues.map((v) => v._id);

//         // Get all devices in these venues
//         const devices = await deviceModel.find({ venue: { $in: venueIds } })
//             .populate("venue", "name")
//             .lean();

//         // Aggregate alerts per venue
//         const result = venues.map((venue) => {
//             const venueDevices = devices.filter((d) => d.venue._id.toString() === venue._id.toString());

//             const devicesWithAlerts = venueDevices.filter(
//                 (d) => d.batteryAlert || d.refrigeratorAlert
//             );

//             const refrigeratorAlerts = venueDevices
//                 .filter((d) => d.refrigeratorAlert)
//                 .map((d) => ({
//                     deviceId: d.deviceId,
//                     ambient: d.AmbientData?.temperature || null,
//                     freezer: d.FreezerData?.temperature || null,
//                 }));

//             const batteryAlerts = venueDevices
//                 .filter((d) => d.batteryAlert)
//                 .map((d) => ({
//                     deviceId: d.deviceId,
//                     ambient: d.AmbientData?.temperature || null,
//                     freezer: d.FreezerData?.temperature || null,
//                 }));

//             return {
//                 venueId: venue._id,
//                 venueName: venue.name,
//                 totalDevices: venueDevices.length,
//                 totalAlerts: devicesWithAlerts.length,
//                 refrigeratorAlertCount: refrigeratorAlerts.length,
//                 refrigeratorAlertDevices: refrigeratorAlerts,
//                 batteryAlertCount: batteryAlerts.length,
//                 batteryAlertDevices: batteryAlerts,
//             };
//         });

//         res.json({ organizationId, venues: result });
//     } catch (err) {
//         console.error("Error fetching alerts:", err.message);
//         res.status(500).json({ message: "Server error" });
//     }
// };

// module.exports = { getAlerts };



const WebSocket = require("ws");

// Replace with your backend WS URL
const SERVER_URL = "ws://localhost:5050/ws/alerts";

// List of dummy devices
const DEVICES = [
    "device-001",
    "device-003",
    "device-005",
    "device-006",
    "device-007",
];

// Generate random numbers
function getRandomValue(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Simulate one device
function simulateDevice(deviceId) {
    const ws = new WebSocket(SERVER_URL);

    ws.on("open", () => {
        console.log(`[${deviceId}] Connected to server`);

        // Heartbeat every 5 seconds
        // const heartbeatInterval = setInterval(() => {
        //     if (ws.readyState === WebSocket.OPEN) {
        //         ws.send(JSON.stringify({ type: "heartbeat", deviceId }));
        //         console.log(`[${deviceId}] Sent heartbeat`);
        //     }
        // }, 5000);

        // Send dummy alert/data every 10 seconds
        const dataInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                const payload = {
                    deviceId,
                    ambient: getRandomValue(20, 40),   // Ambient temperature
                    freezer: getRandomValue(-10, 5),   // Freezer temperature
                    batteryAlert: Math.random() > 0.5 ? "LOW" : "NORMAL",
                    refrigeratorAlert: Math.random() > 0.7 ? "ALERT" : "NORMAL",
                };

                ws.send(JSON.stringify(payload));
                console.log(`[${deviceId}] Sent data:`, payload);
            }
        }, 10000);

        ws.on("message", (msg) => {
            console.log(`[${deviceId}] Server says: ${msg.toString()}`);
        });

        ws.on("close", () => {
            console.log(`[${deviceId}] Disconnected from server`);
            clearInterval(heartbeatInterval);
            clearInterval(dataInterval);
        });

        ws.on("error", (err) => {
            console.error(`[${deviceId}] WS Error:`, err.message);
            clearInterval(heartbeatInterval);
            clearInterval(dataInterval);
        });
    });
}

// Start simulation for all devices
DEVICES.forEach(simulateDevice);
