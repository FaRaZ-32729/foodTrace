// const deviceModel = require("../models/deviceModel");
// const venueModel = require("../models/venueModal");

// // Returns alerts for all venues under an organization
// const getAlerts = async (req, res) => {
//     try {
//         const { organizationId } = req.params;

//         // Get all venues under this organization
//         const venues = await venueModel.find({ organization: organizationId }).lean();
//         if (!venues.length) return res.status(404).json({ message: "No venues found" });

//         const venueIds = venues.map((v) => v._id);

//         // Get all devices inside those venues
//         const devices = await deviceModel.find({ venue: { $in: venueIds } })
//             .populate("venue", "name")
//             .lean();

//         // Aggregate alerts per venue
//         const result = venues.map((venue) => {
//             const venueDevices = devices.filter(
//                 (d) => d.venue._id.toString() === venue._id.toString()
//             );

//             // NEW ALERT LOGIC
//             const devicesWithAlerts = venueDevices.filter(
//                 (d) => d.temperatureAlert || d.humidityAlert || d.odourAlert
//             );

//             const temperatureAlerts = venueDevices
//                 .filter((d) => d.temperatureAlert)
//                 .map((d) => ({
//                     deviceId: d.deviceId,
//                     temperature: d.espTemprature,
//                     humidity: d.espHumidity
//                 }));

//             const humidityAlerts = venueDevices
//                 .filter((d) => d.humidityAlert)
//                 .map((d) => ({
//                     deviceId: d.deviceId,
//                     temperature: d.espTemprature,
//                     humidity: d.espHumidity
//                 }));

//             const odourAlerts = venueDevices
//                 .filter((d) => d.odourAlert)
//                 .map((d) => ({
//                     deviceId: d.deviceId,
//                     temperature: d.espTemprature,
//                     humidity: d.espHumidity
//                 }));

//             return {
//                 venueId: venue._id,
//                 venueName: venue.name,
//                 totalDevices: venueDevices.length,

//                 // Total active alerts in this venue
//                 totalAlerts: devicesWithAlerts.length,

//                 // Temperature alerts
//                 temperatureAlertCount: temperatureAlerts.length,
//                 temperatureAlertDevices: temperatureAlerts,

//                 // Humidity alerts
//                 humidityAlertCount: humidityAlerts.length,
//                 humidityAlertDevices: humidityAlerts,

//                 // Odour alerts
//                 odourAlertCount: odourAlerts.length,
//                 odourAlertDevices: odourAlerts,
//             };
//         });

//         res.json({ organizationId, venues: result });

//     } catch (err) {
//         console.error("Error fetching alerts:", err.message);
//         res.status(500).json({ message: "Server error" });
//     }
// };


// module.exports = { getAlerts };


const deviceModel = require("../models/deviceModel");
const venueModel = require("../models/venueModal");

// Returns alerts for all venues under an organization
const getAlerts = async (req, res) => {
    try {
        const { organizationId } = req.params;

        // Get venues
        const venues = await venueModel.find({ organization: organizationId }).lean();
        if (!venues.length) {
            return res.status(404).json({ message: "No venues found" });
        }

        const venueIds = venues.map(v => v._id);

        // Get devices
        const devices = await deviceModel
            .find({ venue: { $in: venueIds } })
            .populate("venue", "name")
            .lean();

        const result = venues.map((venue) => {
            const venueDevices = devices.filter(
                d => d.venue._id.toString() === venue._id.toString()
            );

            // Devices having any alert
            const devicesWithAlerts = venueDevices.filter(
                d => d.batteryAlert || d.refrigeratorAlert
            );

            // Battery alerts
            const batteryAlerts = venueDevices
                .filter(d => d.batteryAlert)
                .map(d => ({
                    deviceId: d.deviceId,
                    ambient: d.espAmbient,
                    freezer: d.espFreezer,
                }));

            // Refrigerator alerts
            const refrigeratorAlerts = venueDevices
                .filter(d => d.refrigeratorAlert)
                .map(d => ({
                    deviceId: d.deviceId,
                    ambient: d.espAmbient,
                    freezer: d.espFreezer,
                }));

            return {
                venueId: venue._id,
                venueName: venue.name,
                totalDevices: venueDevices.length,

                // total alerts in this venue
                totalAlerts: devicesWithAlerts.length,

                // Battery alerts
                batteryAlertCount: batteryAlerts.length,
                batteryAlertDevices: batteryAlerts,

                // Refrigerator alerts
                refrigeratorAlertCount: refrigeratorAlerts.length,
                refrigeratorAlertDevices: refrigeratorAlerts,
            };
        });

        res.status(200).json({
            organizationId,
            venues: result,
        });

    } catch (err) {
        console.error("Error fetching alerts:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getAlerts };

