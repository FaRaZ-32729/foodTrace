// const fs = require("fs");
// const path = require("path");
// const otaModel = require("../models/otaModel");
// const { connectedDevices, broadcastToDashboards, sendOTAUpdate } = require("../utils/espOtaSocket");
// const cloudinary = require("../config/cloudinaryConfig");

// // Upload OTA file admin only


// // const uploadOTA = async (req, res) => {
// //     try {
// //         const { versionId } = req.body;
// //         if (!versionId) {
// //             if (req.file) fs.unlinkSync(req.file.path);
// //             res.status(400).json({ message: "Version Id Required " });
// //         }

// //         if (!req.file) return res.status(400).json({ message: "OTA .bin file required" });

// //         // Check uniqueness
// //         const existing = await otaModel.findOne({ versionId });
// //         if (existing) {
// //             // Delete uploaded file to avoid orphaned files
// //             fs.unlinkSync(req.file.path);
// //             return res.status(409).json({ message: "versionId already exists" });
// //         }

// //         const filePath = req.file.path;
// //         const fileSize = fs.statSync(filePath).size;

// //         const record = await otaModel.create({
// //             versionId,
// //             fileName: req.file.filename,
// //             filePath,
// //             fileSize,
// //         });

// //         res.status(201).json({
// //             message: "OTA file uploaded and saved to DB",
// //             data: record,
// //         });

// //     } catch (error) {
// //         console.error("OTA Upload Error:", error);

// //         // Delete file if it exists
// //         if (req.file && fs.existsSync(req.file.path)) {
// //             fs.unlinkSync(req.file.path);
// //         }

// //         res.status(500).json({ message: "Server error while uploading OTA" });
// //     }
// // };

// const uploadOTA = async (req, res) => {
//     try {
//         const { versionId } = req.body;
//         if (!versionId) {
//             return res.status(400).json({ message: "Version Id Required" });
//         }

//         if (!req.file) return res.status(400).json({ message: "OTA .bin file required" });

//         // Check uniqueness
//         const existing = await otaModel.findOne({ versionId });
//         if (existing) {
//             return res.status(409).json({ message: "versionId already exists" });
//         }

//         // Cloudinary URL & public_id
//         const fileUrl = req.file.path || req.file.url || req.file.secure_url;
//         const publicId = req.file.filename || req.file.public_id;


//         const record = await otaModel.create({
//             versionId,
//             fileName: req.file.originalname,
//             filePath: fileUrl,   // Cloudinary URL
//             publicId: publicId,  // Cloudinary public_id
//             fileSize: req.file.size
//         });

//         res.status(201).json({
//             message: "OTA file uploaded and saved to DB",
//             data: record,
//         });

//     } catch (error) {
//         console.error("OTA Upload Error:", error);
//         res.status(500).json({ message: "Server error while uploading OTA" });
//     }
// };


// // Get all OTA files admin only
// const getAllOTAFiles = async (req, res) => {
//     try {
//         const files = await otaModel.find({}, { versionId: 1 }).sort({ uploadDate: -1 });
//         if (!files) return res.status(404).json({ message: "Files Not Found" });

//         res.status(200).json(files);
//     } catch (error) {
//         console.error("Error fetching OTA files:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// };

// // Delete OTA file from DB and folder admin only


// // const deleteOTAFile = async (req, res) => {
// //     try {
// //         const { id } = req.params;

// //         const record = await otaModel.findById(id);
// //         if (!record) return res.status(404).json({ message: "OTA file not found" });

// //         // Delete file from folder
// //         if (fs.existsSync(record.filePath)) fs.unlinkSync(record.filePath);

// //         // Delete from DB
// //         await otaModel.findByIdAndDelete(id);

// //         res.status(200).json({ message: "OTA file deleted successfully" });
// //     } catch (error) {
// //         console.error("Error deleting OTA file:", error);
// //         res.status(500).json({ message: "Server error" });
// //     }
// // };



// const   deleteOTAFile = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const record = await otaModel.findById(id);
//         if (!record) return res.status(404).json({ message: "OTA file not found" });

//         // Delete from Cloudinary
//         if (record.public_id) {
//             await cloudinary.uploader.destroy(record.public_id, { resource_type: "raw" });
//         }

//         // Delete from DB
//         await otaModel.findByIdAndDelete(id);

//         res.status(200).json({ message: "OTA file deleted successfully from Cloudinary & DB" });
//     } catch (error) {
//         console.error("Error deleting OTA file:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// };


// //Start OTA Admin Only


// // const startOTA = async (req, res) => {
// //     try {
// //         const { versionId, devices } = req.body;

// //         if (!versionId || !Array.isArray(devices) || devices.length === 0) {
// //             return res.status(400).json({ message: "versionId and devices[] required" });
// //         }

// //         const version = await otaModel.findOne({ versionId });
// //         if (!version) return res.status(404).json({ message: "version not found" });

// //         const { filePath } = version;
// //         const results = [];

// //         for (const deviceId of devices) {
// //             const entry = connectedDevices.get(deviceId);
// //             if (entry && entry.ws.readyState === 1) {
// //                 entry.currentVersionId = versionId;
// //                 sendOTAUpdate(entry.ws, deviceId, filePath);
// //                 results.push({ deviceId, status: "started" });
// //             } else {
// //                 results.push({ deviceId, status: "offline" });
// //             }
// //         }

// //         broadcastToDashboards({
// //             type: "ota_batch_start",
// //             versionId,
// //             targets: results,
// //         });

// //         // console.log(results, "ota result");

// //         res.status(200).json({
// //             message: "OTA triggered for selected devices",
// //             versionId,
// //             results,
// //         });
// //     } catch (err) {
// //         console.error("startOTA error:", err);
// //         res.status(500).json({ message: "Failed to start OTA" });
// //     }
// // };


// const startOTA = async (req, res) => {
//     try {
//         const { versionId, devices } = req.body;

//         if (!versionId || !Array.isArray(devices) || devices.length === 0) {
//             return res.status(400).json({ message: "versionId and devices[] required" });
//         }

//         const version = await otaModel.findOne({ versionId });
//         if (!version) return res.status(404).json({ message: "version not found" });

//         const firmwareUrl = version.filePath; // Cloudinary URL
//         const results = [];

//         for (const deviceId of devices) {
//             const entry = connectedDevices.get(deviceId);
//             if (entry && entry.ws.readyState === 1) {
//                 entry.currentVersionId = versionId;
//                 await sendOTAUpdate(entry.ws, deviceId, firmwareUrl);
//                 results.push({ deviceId, status: "started" });
//             } else {
//                 results.push({ deviceId, status: "offline" });
//             }
//         }

//         broadcastToDashboards({
//             type: "ota_batch_start",
//             versionId,
//             targets: results,
//         });

//         res.status(200).json({
//             message: "OTA triggered for selected devices",
//             versionId,
//             results,
//         });
//     } catch (err) {
//         console.error("startOTA error:", err);
//         res.status(500).json({ message: "Failed to start OTA" });
//     }
// };


// module.exports = {
//     uploadOTA,
//     getAllOTAFiles,
//     deleteOTAFile,
//     startOTA
// };



const otaModel = require("../models/otaModel");
const { connectedDevices, broadcastToDashboards, sendOTAUpdate } = require("../utils/espOtaSocket");
const bucket = require("../config/firebaseAdmin");

// Upload OTA file admin only
const uploadOTA = async (req, res) => {
    try {
        const { versionId } = req.body;
        if (!versionId) return res.status(400).json({ message: "Version Id required" });
        if (!req.file) return res.status(400).json({ message: "OTA .bin file required" });

        // File path in bucket
        const fileName = `ota/${Date.now()}-${req.file.originalname}`;
        const file = bucket.file(fileName);

        // Upload to Firebase Storage
        await file.save(req.file.buffer, {
            contentType: "application/octet-stream",
            resumable: false,
        });

        // Generate signed URL (expires far in future)
        const [url] = await file.getSignedUrl({
            action: "read",
            expires: "03-01-2030",
        });

        // Save metadata to MongoDB
        const record = await otaModel.create({
            versionId,
            fileName,
            filePath: url,
            fileSize: req.file.size,
        });

        res.status(201).json({ message: "OTA uploaded", data: record });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


// Get all OTA files admin only
const getAllOTAFiles = async (req, res) => {
    try {
        const files = await otaModel.find({}, { versionId: 1 }).sort({ uploadDate: -1 });
        if (!files) return res.status(404).json({ message: "Files Not Found" });

        res.status(200).json(files);
    } catch (error) {
        console.error("Error fetching OTA files:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete OTA file from DB and folder admin only
const deleteOTAFile = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await otaModel.findById(id);
        if (!record) return res.status(404).json({ message: "OTA not found" });

        await bucket.file(record.fileName).delete();
        await otaModel.findByIdAndDelete(id);

        res.json({ message: "OTA deleted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


//Start OTA Admin Only
const startOTA = async (req, res) => {
    try {
        const { versionId, devices } = req.body;

        if (!versionId || !Array.isArray(devices) || devices.length === 0) {
            return res.status(400).json({ message: "versionId and devices[] required" });
        }

        const version = await otaModel.findOne({ versionId });
        if (!version) return res.status(404).json({ message: "version not found" });

        const firmwareUrl = version.filePath; // Cloudinary URL
        const results = [];

        for (const deviceId of devices) {
            const entry = connectedDevices.get(deviceId);
            if (entry && entry.ws.readyState === 1) {
                entry.currentVersionId = versionId;
                await sendOTAUpdate(entry.ws, deviceId, firmwareUrl);
                results.push({ deviceId, status: "started" });
            } else {
                results.push({ deviceId, status: "offline" });
            }
        }

        broadcastToDashboards({
            type: "ota_batch_start",
            versionId,
            targets: results,
        });

        res.status(200).json({
            message: "OTA triggered for selected devices",
            versionId,
            results,
        });
    } catch (err) {
        console.error("startOTA error:", err);
        res.status(500).json({ message: "Failed to start OTA" });
    }
};


module.exports = {
    uploadOTA,
    getAllOTAFiles,
    deleteOTAFile,
    startOTA
};

