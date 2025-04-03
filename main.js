const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const os = require("os")

let mainWindow;
let serverProcess;
let miniBrowser;

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

app.whenReady().then(() => {

    mainWindow = new BrowserWindow({
        width: 800,
        height: 500,
        title: "NLFS Logs",
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        },
        autoHideMenuBar: true
    });

    mainWindow.loadFile(path.join(__dirname, "public", "logs.html"));

    miniBrowser = new BrowserWindow({
        width: 1024,
        height: 768,
        title: "NLFS Mini-Browser",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true
    });


    serverProcess = spawn("node", [path.join(__dirname, "src", "server.js")]);

    miniBrowser.loadURL(SERVER_URL);

    serverProcess.stdout.on("data", (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("log", data.toString());
        }
    });

    serverProcess.stderr.on("data", (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("log", `[ERROR] ${data.toString()}`);
        }
    });

    serverProcess.on("close", (code) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("log", `Server stopped with code ${code}`);
        }
    });
});


app.on("window-all-closed", () => {
    if (serverProcess) {
        serverProcess.kill();
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.destroy();
        miniBrowser.destroy();
    }
    if (miniBrowser && !miniBrowser.isDestroyed()) {
        miniBrowser.destroy();
    }
    app.quit();
});
