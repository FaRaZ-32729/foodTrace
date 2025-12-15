const deviceModel = require("../models/deviceModel");
const venueModel = require("../models/venueModal");

// Returns alertss for all venues under an organization
const getAlerts = async (req, res) => {
    try {
        const { organizationId } = req.params;

        // Get all venues of this organization
        const venues = await venueModel.find({ organization: organizationId }).lean();
        if (!venues.length) return res.status(404).json({ message: "No venues found" });

        const venueIds = venues.map((v) => v._id);

        // Get all devices in these venues
        const devices = await deviceModel.find({ venue: { $in: venueIds } })
            .populate("venue", "name")
            .lean();

        // Aggregate alerts per venue
        const result = venues.map((venue) => {
            const venueDevices = devices.filter((d) => d.venue._id.toString() === venue._id.toString());

            const devicesWithAlerts = venueDevices.filter(
                (d) => d.batteryAlert || d.refrigeratorAlert
            );

            const refrigeratorAlerts = venueDevices
                .filter((d) => d.refrigeratorAlert)
                .map((d) => ({
                    deviceId: d.deviceId,
                    ambient: d.AmbientData?.temperature || null,
                    freezer: d.FreezerData?.temperature || null,
                }));

            const batteryAlerts = venueDevices
                .filter((d) => d.batteryAlert)
                .map((d) => ({
                    deviceId: d.deviceId,
                    ambient: d.AmbientData?.temperature || null,
                    freezer: d.FreezerData?.temperature || null,
                }));

            return {
                venueId: venue._id,
                venueName: venue.name,
                totalDevices: venueDevices.length,
                totalAlerts: devicesWithAlerts.length,
                refrigeratorAlertCount: refrigeratorAlerts.length,
                refrigeratorAlertDevices: refrigeratorAlerts,
                batteryAlertCount: batteryAlerts.length,
                batteryAlertDevices: batteryAlerts,
            };
        });

        res.json({ organizationId, venues: result });
    } catch (err) {
        console.error("Error fetching alerts:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getAlerts };
