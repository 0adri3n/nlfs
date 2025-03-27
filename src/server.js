const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const winston = require("winston");
const { v4: uuidv4 } = require("uuid");

const app = express();
const UPLOAD_DIR = path.join(__dirname, "../uploads");
const PUBLIC_DIR = path.join(__dirname, "../public");
const LOGS_DIR = path.join(__dirname, "../logs");
const FILES_DB = path.join(__dirname, "files.json");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR);

const { combine, timestamp, printf, colorize } = winston.format;

const logFormatConsole = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

const logFormatFile = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

const logger = winston.createLogger({
    level: "info",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" })),
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), logFormatConsole),
        }),
        new winston.transports.File({
            filename: path.join(LOGS_DIR, "app.log"),
            format: logFormatFile,
        }),
    ],
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const safeFilename = file.originalname.replace(/\s+/g, "_");
        cb(null, safeFilename);
    },
});

const upload = multer({ storage: storage });

app.use(express.static(PUBLIC_DIR));
app.use(express.static(UPLOAD_DIR));
app.use(express.json());

const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const details of iface) {
            if (
                details.family === "IPv4" &&
                !details.internal &&
                (details.address.startsWith("192.") ||
                    details.address.startsWith("10.") ||
                    details.address.startsWith("172."))
            ) {
                return details.address;
            }
        }
    }
    return "localhost";
};

const LOCAL_IP = getLocalIP();
const PORT = 3000;
const SERVER_URL = `http://${LOCAL_IP}:${PORT}`;

let files = [];

if (fs.existsSync(FILES_DB)) {
    files = JSON.parse(fs.readFileSync(FILES_DB, "utf8"));
}

const saveFilesDB = () => {
    fs.writeFileSync(FILES_DB, JSON.stringify(files, null, 2));
};

app.post("/upload", upload.array("files"), (req, res) => {
    const uploadedFiles = req.files.map((file) => {
        const fileUuid = uuidv4();
        const fileData = {
            uuid: fileUuid,
            originalname: file.originalname,
            filename: file.filename,
            path: `/${file.filename}`,
            size: file.size,
        };
        files.push(fileData);
        return fileData;
    });

    saveFilesDB();
    res.json({ success: true, files: uploadedFiles });
});

app.delete("/delete", async (req, res) => {
    const { fileUuid } = req.query;
    if (!fileUuid) {
        return res.status(400).send({ message: "File UUID is required" });
    }

    try {
        const fileIndex = files.findIndex((f) => f.uuid === fileUuid);
        if (fileIndex === -1) {
            return res.status(404).send({ message: "File not found" });
        }

        const filePath = path.join(UPLOAD_DIR, files[fileIndex].filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            files.splice(fileIndex, 1);
            saveFilesDB();
            res.status(200).send({ message: "File deleted successfully" });
        } else {
            res.status(404).send({ message: "File not found" });
        }
    } catch (error) {
        logger.error("Error deleting file:", error);
        res.status(500).send({ message: "Error deleting file" });
    }
});

app.get("/files", (req, res) => {
    res.json(files);
});

app.listen(PORT, LOCAL_IP, () => {
    logger.info(`Server running at ${SERVER_URL}`);
});
