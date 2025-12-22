const express = require("express");
const dotenv = require("dotenv");
const dbConnection = require("./src/config/dbConnection");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");

// Routers
const userRouter = require("./src/routes/userRouter");
const orgRouter = require("./src/routes/organizationRouter");
const authRouter = require("./src/routes/authRouter");
const venueRouter = require("./src/routes/venueRouter");
const deviceRouter = require("./src/routes/deviceRouter");
const alertsRouter = require("./src/routes/alertsRouter");
const authenticate = require("./src/middlewere/authMiddleware");
const otaRouter = require("./src/routes/otaRoutes");


// Utilities
const { espAlertSocket } = require("./src/utils/espAlertSocket");
const { initEspOtaSocket } = require("./src/utils/espOtaSocket");


dotenv.config();
dbConnection();
const port = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173"
];

// app.use(cors({
//     origin: function (origin, callback) {
//         if (!origin) return callback(null, true); // allow mobile/postman
//         if (allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error("Not allowed by CORS"));
//         }
//     },
//     credentials: true
// }));

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // Postman, ESP, mobile
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));



// Routes
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/organization", authenticate, orgRouter);
app.use("/venue", authenticate, venueRouter);
app.use("/device", authenticate, deviceRouter);
app.use("/alert", authenticate, alertsRouter);
app.use("/ota", otaRouter);

const alertWss = espAlertSocket(server);
const otaWss = initEspOtaSocket(server);

// alerts ws://ip/localhost:5000/ws/alerts
// alerts ws://ip/localhost:5000/ws/ota
server.on("upgrade", (req, socket, head) => {
    if (req.url.startsWith("/ws/alerts")) {
        alertWss.handleUpgrade(req, socket, head, (ws) => {
            alertWss.emit("connection", ws, req);
        });
    } else if (req.url.startsWith("/ws/ota")) {
        otaWss.handleUpgrade(req, socket, head, (ws) => {
            otaWss.emit("connection", ws, req);
        });
    } else {
        socket.destroy(); // reject unknown paths
    }
});
// server.on("upgrade", (req, socket, head) => {
//     if (req.url === "/ws/alerts") {
//         alertWss.handleUpgrade(req, socket, head, (ws) => {
//             alertWss.emit("connection", ws, req);
//         });
//     } else if (req.url === "/ws/ota") {
//         otaWss.handleUpgrade(req, socket, head, (ws) => {
//             otaWss.emit("connection", ws, req);
//         });
//     } else {
//         socket.destroy(); // reject unknown paths
//     }
// });

app.get("/", (req, res) => { res.send("HELLOW FARAZ") });

// Start server
server.listen(port, () => {
    console.log(`Express & WebSocket is running on port : ${port}`);
})