import express from "express";
import path from "path";
import http from "http";
import https from "https";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fsLib from "fs";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import xss from "xss";
import { z } from "zod";
import { logger } from "./logger.js";
import { getHistory, saveHistoryItem, deleteHistoryItem } from "./database.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import cookieParser from "cookie-parser";

dotenv.config();

let ai = null;
function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
        logger.error("GEMINI_API_KEY is missing!");
    }
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });
  }
  return ai;
}

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
app.use(cors());

// SSE Notification Clients
let notificationClients = [];

app.get("/api/notifications", (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  notificationClients.push(res);

  // Send a heartbeat every 30 seconds
  const heartbeatId = setInterval(() => {
    res.write(':\n\n'); // Comment sent to keep connection alive
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeatId);
    notificationClients = notificationClients.filter(client => client !== res);
  });

  
});

function notifyClients(message) {
  notificationClients.forEach(client => {
    client.write("data: " + JSON.stringify(message) + "\n\n");
  });
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000");
const maxRequests = 10000; // Hardcoded to prevent interval fetch drops

const generalLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: "Too many requests from this IP, please try again later." }
});

app.use("/api/", generalLimiter);

// ==========================================================
// SIMULATED SYSTEM STATE
// ==========================================================
interface Waypoint {
  lat: number;
  lng: number;
}

interface EventLog {
  type: string;
  message: string;
  time: string;
}

let HOME_LATITUDE = 12.908200;
let HOME_LONGITUDE = 77.518600;

const robotState = {
  name: "VSTY",
  version: "2.0",
  mode: "MANUAL",
  status: "READY",
  speed: 0.25,
  max_speed: 0.40,
  direction: "STOP",
  running: false,
  paused: false,
  battery: 100.0,
  signal: 100.0,
  camera: "OFF",
  ai: "OFF",
  light: "OFF",
  emergency: false,
  temperature: 28.5,
  ph: 7.10,
  turbidity: 12,
  ultrasonic: 35,
  latitude: HOME_LATITUDE,
  longitude: HOME_LONGITUDE,
  heading: 0,
  waypoints: [] as Waypoint[],
  current_waypoint: 0,
  total_waypoints: 0,
  distance: 0,
  remaining_distance: 0,
  eta: 0,
  mission_name: "Inspection-001",
  inspection_type: "Water Tank",
  progress: 0,
  return_home_active: false
};

const eventLogs: EventLog[] = [
  { type: "SYSTEM", message: "AquaSentinel Mission Control Booted", time: new Date().toLocaleTimeString() }
];

// Simulated AI Detection Variables
const detectionLabels = ["Crack", "Corrosion", "Leakage", "Algae", "Blockage", "Rust"];
const severityLevels = ["Low", "Medium", "High", "Critical"];


// Initialize history with some starting records for realism
for (let i = 0; i < 5; i++) {
  const confidence = parseFloat((85 + Math.random() * 14).toFixed(2));
  
}

// Simulated Camera Image Cache
let mockedImageBuffer: Buffer | null = null;
async function fetchMockedImage(): Promise<Buffer> {
  if (mockedImageBuffer) return mockedImageBuffer;
  try {
    const response = await fetch("https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=640&h=480&q=80");
    if (response.ok) {
      const arrBuf = await response.arrayBuffer();
      mockedImageBuffer = Buffer.from(arrBuf);
      return mockedImageBuffer;
    }
  } catch (e) {
    console.error("Error fetching mock image, falling back to color block", e);
  }
  // Fallback to empty green solid-color 1x1 GIF/PNG
  mockedImageBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  return mockedImageBuffer;
}

// ==========================================================
// SIMULATION UPDATE ENGINE
// ==========================================================
function updateRobotSimulation() {
  if (robotState.emergency) {
    robotState.running = false;
    robotState.direction = "STOP";
    robotState.speed = 0;
    return;
  }
  // Sanity checks for robotics safety
  if (robotState.speed > robotState.max_speed) {
    robotState.speed = robotState.max_speed;
    logger.warn(`Speed limit exceeded, clamped to ${robotState.max_speed}`);
  }
  if (robotState.battery < 5.0 && robotState.running) {
    robotState.running = false;
    robotState.status = "LOW_BATTERY_SHUTDOWN";
    eventLogs.unshift({ type: "CRITICAL", message: "Low battery shutdown", time: new Date().toLocaleTimeString() });
  }
  if (!robotState.running) {
    return;
  }

  // Battery drain
  if (robotState.battery > 0) {
    robotState.battery = parseFloat(Math.max(0, robotState.battery - 0.02).toFixed(1));
  }

  // Signal fluctuation
  if (robotState.signal > 30.0) {
    robotState.signal = parseFloat(Math.max(30.0, robotState.signal - 0.003).toFixed(1));
  } else {
    robotState.signal = parseFloat(Math.max(25, Math.min(100, robotState.signal + (Math.random() - 0.5) * 2)).toFixed(1));
  }

  // Update sensor fluctuations
  robotState.temperature = parseFloat((27.0 + Math.random() * 4.0).toFixed(1));
  robotState.ph = parseFloat((6.8 + Math.random() * 0.8).toFixed(2));
  robotState.turbidity = Math.floor(8 + Math.random() * 17);
  robotState.ultrasonic = Math.floor(20 + Math.random() * 130);

  // Return Home logic
  if (robotState.return_home_active) {
    let latReached = false;
    let lngReached = false;

    const latDiff = HOME_LATITUDE - robotState.latitude;
    if (Math.abs(latDiff) > 0.000015) {
      robotState.latitude += latDiff > 0 ? 0.000015 : -0.000015;
    } else {
      latReached = true;
    }

    const lngDiff = HOME_LONGITUDE - robotState.longitude;
    if (Math.abs(lngDiff) > 0.000015) {
      robotState.longitude += lngDiff > 0 ? 0.000015 : -0.000015;
    } else {
      lngReached = true;
    }

    // Heading towards home
    if (!latReached || !lngReached) {
      robotState.heading = Math.round(Math.atan2(HOME_LONGITUDE - robotState.longitude, HOME_LATITUDE - robotState.latitude) * 180 / Math.PI);
      if (robotState.heading < 0) robotState.heading += 360;
    }

    // Remaining distance calculation (simplistic linear towards home)
    const distHome = Math.sqrt((HOME_LATITUDE - robotState.latitude) ** 2 + (HOME_LONGITUDE - robotState.longitude) ** 2) * 111000;
    robotState.remaining_distance = parseFloat(distHome.toFixed(2));
    robotState.eta = parseFloat((robotState.remaining_distance / robotState.speed).toFixed(1));

    if (latReached && lngReached) {
      robotState.running = false;
      robotState.direction = "STOP";
      robotState.status = "READY";
      robotState.return_home_active = false;
      robotState.progress = 100;
      robotState.current_waypoint = 0;
      robotState.latitude = HOME_LATITUDE;
      robotState.longitude = HOME_LONGITUDE;
      robotState.remaining_distance = 0;
      robotState.eta = 0;

      eventLogs.unshift({
        type: "MISSION",
        message: "Robot Returned Home",
        time: new Date().toLocaleTimeString()
      });
    }
    return;
  }

  // Normal movement along waypoints
  if (robotState.waypoints && robotState.waypoints.length > 0 && robotState.current_waypoint < robotState.waypoints.length) {
    const target = robotState.waypoints[robotState.current_waypoint];
    const target_lat = target.lat;
    const target_lng = target.lng;

    let latReached = false;
    let lngReached = false;

    const latDiff = target_lat - robotState.latitude;
    if (Math.abs(latDiff) > 0.000015) {
      robotState.latitude += latDiff > 0 ? 0.000015 : -0.000015;
    } else {
      latReached = true;
    }

    const lngDiff = target_lng - robotState.longitude;
    if (Math.abs(lngDiff) > 0.000015) {
      robotState.longitude += lngDiff > 0 ? 0.000015 : -0.000015;
    } else {
      lngReached = true;
    }

    // Heading towards target
    if (!latReached || !lngReached) {
      robotState.heading = Math.round(Math.atan2(target_lng - robotState.longitude, target_lat - robotState.latitude) * 180 / Math.PI);
      if (robotState.heading < 0) robotState.heading += 360;
    }

    // Recalculate remaining distance to remaining waypoints
    let remaining = 0;
    // Current segment
    remaining += Math.sqrt((target_lat - robotState.latitude) ** 2 + (target_lng - robotState.longitude) ** 2) * 111000;
    // Subsequent segments
    for (let i = robotState.current_waypoint + 1; i < robotState.waypoints.length; i++) {
      const prev = robotState.waypoints[i - 1];
      const curr = robotState.waypoints[i];
      remaining += Math.sqrt((curr.lat - prev.lat) ** 2 + (curr.lng - prev.lng) ** 2) * 111000;
    }
    robotState.remaining_distance = parseFloat(remaining.toFixed(2));
    robotState.eta = parseFloat((robotState.remaining_distance / robotState.speed).toFixed(1));

    if (latReached && lngReached) {
      robotState.current_waypoint += 1;
      robotState.progress = Math.round((robotState.current_waypoint / robotState.waypoints.length) * 100);

      eventLogs.unshift({
        type: "WAYPOINT",
        message: `Reached Waypoint ${robotState.current_waypoint}`,
        time: new Date().toLocaleTimeString()
      });

      if (robotState.current_waypoint >= robotState.waypoints.length) {
        // Completed all waypoints! Return home
        robotState.return_home_active = true;
        robotState.status = "RETURNING_HOME";
        eventLogs.unshift({
          type: "MISSION",
          message: "All Waypoints Reached. Returning Home",
          time: new Date().toLocaleTimeString()
        });
      }
    }
  }
}

// ==========================================================
// FLASK API ENDPOINTS PORT
// ==========================================================

app.get("/api/health", (req, res) => {
  const isMotorError = Math.random() > 0.95;
  const isCommError = Math.random() > 0.95;

  res.json([
    { 
        name: "🔋 12V Li-Ion Battery", 
        value: robotState.battery + "%", 
        width: robotState.battery + "%", 
        color: robotState.battery > 20 ? "#00ff88" : "#ff4444", 
        status: robotState.battery > 20 ? "OK" : "WARNING" 
    },
    { 
        name: "📡 ESP32-CAM WiFi Network", 
        value: isCommError ? "Packet Loss" : "Stable", 
        width: isCommError ? "40%" : "100%", 
        color: isCommError ? "#ff4444" : "#00d4ff", 
        status: isCommError ? "ERROR" : "OK",
        error: isCommError ? "Live video stream latency high." : null,
        solution: isCommError ? "Check Wi-Fi connection on ESP32-CAM module." : null
    },
    { 
        name: "⚙️ L298N Motor Driver", 
        value: isMotorError ? "Overheat" : "Optimal", 
        width: isMotorError ? "30%" : "100%", 
        color: isMotorError ? "#ff4444" : "#00ff88", 
        status: isMotorError ? "ERROR" : "OK",
        error: isMotorError ? "High current drawn by DC Thrusters." : null,
        solution: isMotorError ? "Inspect thrusters for debris." : null
    },
    { 
        name: "🧭 MPU6050 IMU", 
        value: "Active", 
        width: "100%", 
        color: "#7b61ff", 
        status: "OK" 
    },
    { 
        name: "🧠 Arduino Nano (Master MCU Controller)", 
        value: "35% Load", 
        width: "35%", 
        color: "#ff9800", 
        status: "OK" 
    },
    { 
        name: "❤️ Overall Health", 
        value: (isMotorError || isCommError) ? "Warning" : "98%", 
        width: (isMotorError || isCommError) ? "50%" : "98%", 
        color: (isMotorError || isCommError) ? "#ff9800" : "#00ff88", 
        status: (isMotorError || isCommError) ? "WARNING" : "OK" 
    }
  ]);
});

app.get("/api/status", (req, res) => {
  res.json({
    status: robotState.status,
    mode: robotState.mode,
    running: robotState.running,
    emergency: robotState.emergency,
    battery: parseFloat(robotState.battery.toFixed(1)),
    signal: parseFloat(robotState.signal.toFixed(1))
  });
});

app.get("/api/mission", (req, res) => {
  res.json({
    name: robotState.mission_name,
    inspection: robotState.inspection_type,
    status: robotState.status,
    progress: robotState.progress,
    current_waypoint: robotState.current_waypoint,
    total_waypoints: robotState.total_waypoints,
    distance: robotState.distance,
    remaining_distance: robotState.remaining_distance,
    eta: robotState.eta
  });
});

app.get("/api/sensors", (req, res) => {
  // Simulate occasional realistic sensor errors
  const isTempError = Math.random() > 0.9;
  const isPhError = Math.random() > 0.9;
  const isTurbError = Math.random() > 0.9;
  
  res.json([
    {
        name: "🌡 Temperature",
        value: isTempError ? "ERR" : robotState.temperature,
        unit: "°C",
        status: isTempError ? "ERROR" : "OK",
        error: isTempError ? "DS18B20 disconnected." : null,
        solution: isTempError ? "Check wiring to Arduino Nano." : null
    },
    {
        name: "💧 pH Level",
        value: isPhError ? "ERR" : robotState.ph,
        unit: "",
        status: isPhError ? "ERROR" : "OK",
        error: isPhError ? "Analog pH sensor unstable." : null,
        solution: isPhError ? "Recalibrate using buffer solutions." : null
    },
    {
        name: "🌊 Turbidity",
        value: isTurbError ? "ERR" : robotState.turbidity,
        unit: "NTU",
        status: isTurbError ? "ERROR" : "OK",
        error: isTurbError ? "Turbidity sensor covered by debris." : null,
        solution: isTurbError ? "Clean sensor optics." : null
    },
    {
        name: "📏 Depth",
        value: robotState.progress,
        unit: "m",
        status: "OK",
        error: null,
        solution: null
    },
    {
        name: "🔋 12V Li-Ion Battery",
        value: robotState.battery,
        unit: "%",
        status: "OK",
        error: null,
        solution: null
    }
  ]);
});

app.get("/api/gps", (req, res) => {
  res.json({
    latitude: robotState.latitude,
    longitude: robotState.longitude,
    heading: robotState.heading,
    waypoints: robotState.waypoints,
    currentWaypoint: robotState.current_waypoint,
    totalWaypoints: robotState.total_waypoints
  });
});

app.post("/api/gps", (req, res) => {
  const { latitude, longitude } = req.body;
  if (typeof latitude === "number" && typeof longitude === "number" && !isNaN(latitude) && !isNaN(longitude)) {
    HOME_LATITUDE = latitude;
    HOME_LONGITUDE = longitude;
    robotState.latitude = latitude;
    robotState.longitude = longitude;
    return res.json({ success: true, latitude, longitude });
  }
  return res.status(400).json({ success: false, message: "Invalid latitude or longitude" });
});

const waypointSchema = z.object({
  waypoints: z.array(
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    })
  ).min(1)
});

app.post("/api/waypoints", (req, res) => {
  const result = waypointSchema.safeParse(req.body);
  if (!result.success) {
    logger.warn(`Invalid waypoints payload from IP: ${req.ip}`);
    return res.status(400).json({ success: false, message: "Invalid waypoints data", errors: result.error.format() });
  }
  const { waypoints } = result.data;
  robotState.waypoints = waypoints;
  robotState.current_waypoint = 0;
  robotState.total_waypoints = waypoints.length;
  robotState.status = "ROUTE_LOADED";
  robotState.progress = 0;
  robotState.return_home_active = false;

  // Calculate distance
  let total_distance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const lat1 = waypoints[i - 1].lat;
    const lng1 = waypoints[i - 1].lng;
    const lat2 = waypoints[i].lat;
    const lng2 = waypoints[i].lng;
    total_distance += Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2) * 111000;
  }

  robotState.distance = parseFloat(total_distance.toFixed(2));
  robotState.remaining_distance = robotState.distance;
  robotState.eta = parseFloat((robotState.distance / robotState.speed).toFixed(1));

  eventLogs.unshift({
    type: "MISSION",
    message: `Route Loaded: ${waypoints.length} waypoints`,
    time: new Date().toLocaleTimeString()
  });

  res.json({
    success: true,
    count: waypoints.length,
    distance: robotState.distance,
    eta: robotState.eta,
    message: "Mission Saved Successfully"
  });
});

app.post("/api/start", (req, res) => {
  robotState.running = true;
  robotState.paused = false;
  robotState.status = "MISSION_RUNNING";
  robotState.direction = "FORWARD";
  robotState.camera = "STREAMING";
  robotState.ai = "SCANNING";

  eventLogs.unshift({
    type: "MISSION",
    message: "Mission Started",
    time: new Date().toLocaleTimeString()
  });

  res.json({
    success: true,
    status: robotState.status,
    message: "Mission Started"
  });
});

app.post("/api/pause", (req, res) => {
  robotState.running = false;
  robotState.paused = true;
  robotState.status = "MISSION_PAUSED";

  eventLogs.unshift({
    type: "MISSION",
    message: "Mission Paused",
    time: new Date().toLocaleTimeString()
  });

  res.json({
    success: true,
    status: robotState.status,
    message: "Mission Paused"
  });
});

app.post("/api/resume", (req, res) => {
  robotState.running = true;
  robotState.paused = false;
  robotState.status = "MISSION_RUNNING";

  eventLogs.unshift({
    type: "MISSION",
    message: "Mission Resumed",
    time: new Date().toLocaleTimeString()
  });

  res.json({
    success: true,
    status: robotState.status,
    message: "Mission Resumed"
  });
});

app.post("/api/emergency-stop", (req, res) => {
  robotState.emergency = true;
  robotState.running = false;
  robotState.paused = false;
  robotState.status = "EMERGENCY_STOP";
  robotState.direction = "STOP";
  robotState.speed = 0; // Cut motors immediately
  robotState.camera = "OFF";
  
  eventLogs.unshift({
    type: "CRITICAL",
    message: "HARDWARE EMERGENCY STOP ACTIVATED",
    time: new Date().toLocaleTimeString()
  });

  logger.warn("Emergency stop activated via API.");
  res.json({ success: true, status: robotState.status, message: "EMERGENCY STOP EXECUTED" });
});

app.post("/api/stop", (req, res) => {
  robotState.running = false;
  robotState.paused = false;
  robotState.status = "MISSION_STOPPED";
  robotState.direction = "STOP";
  robotState.camera = "OFF";
  robotState.ai = "OFF";

  eventLogs.unshift({
    type: "MISSION",
    message: "Mission Stopped",
    time: new Date().toLocaleTimeString()
  });

  res.json({
    success: true,
    status: robotState.status,
    message: "Mission Stopped"
  });
});

app.post("/api/home", (req, res) => {
  robotState.return_home_active = true;
  robotState.running = true;
  robotState.status = "RETURNING_HOME";

  eventLogs.unshift({
    type: "MISSION",
    message: "Returning Home command issued",
    time: new Date().toLocaleTimeString()
  });

  res.json({
    success: true,
    status: robotState.status,
    message: "Returning Home"
  });
});

// App Settings API for global persistence
app.get("/api/settings", (req, res) => {
  const settingsPath = path.join(process.cwd(), 'app_settings.json');
  let settings = { collegeLogo: "/rrce-logo.jpg" };
  if (fsLib.existsSync(settingsPath)) {
      try { 
          const fileSettings = JSON.parse(fsLib.readFileSync(settingsPath, 'utf8')); 
          settings = { ...settings, ...fileSettings };
      } catch(e) {}
  }
  res.json({ success: true, settings });
});

// Camera image capture API
app.post("/capture", (req, res) => {
  res.json({
    success: true,
    image: "https://images.unsplash.com/photo-1582967160759-407fb51b5e39?q=80&w=900&auto=format&fit=crop", // underwater pipe style
    mission: robotState.mission_name,
    status: robotState.status
  });
});

// ==========================================================
// MEDIA STORAGE API (Images & Videos)
// ==========================================================
const mediaDir = path.join(process.cwd(), 'public', 'media');
if (!fsLib.existsSync(mediaDir)) {
  fsLib.mkdirSync(mediaDir, { recursive: true });
}

app.get("/api/media", (req, res) => {
  try {
    if (!fsLib.existsSync(mediaDir)) {
      return res.json([]);
    }
    const files = fsLib.readdirSync(mediaDir);
    const mediaFiles = files
      .filter(file => !file.startsWith('.') && file.toLowerCase() !== 'readme.md')
      .map((file) => {
        const filePath = path.join(mediaDir, file);
        const stats = fsLib.statSync(filePath);
        const ext = path.extname(file).toLowerCase();
        const isVideo = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'].includes(ext);
        const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
        
        return {
          id: file,
          filename: file,
          name: file,
          type: isVideo ? "video" : "image",
          url: `/media/${file}`,
          size: stats.size > 1024 * 1024 ? `${sizeMb} MB` : `${(stats.size / 1024).toFixed(1)} KB`,
          date: stats.mtime.toISOString().split('T')[0]
        };
      });
    
    res.json(mediaFiles);
  } catch (err: any) {
    logger.error("Error reading media folder", err);
    res.status(500).json({ success: false, message: "Failed to list media files" });
  }
});

app.post("/api/media/upload", (req, res) => {
  try {
    const { name, fileData } = req.body || {};
    if (!name || !fileData) {
      return res.status(400).json({ success: false, message: "Missing file name or data" });
    }

    const safeName = path.basename(name).replace(/[^a-zA-Z0-9_.-]/g, "_");
    let base64Content = fileData;
    if (fileData.includes("base64,")) {
      base64Content = fileData.split("base64,")[1];
    }

    const buffer = Buffer.from(base64Content, "base64");
    const targetPath = path.join(mediaDir, safeName);

    fsLib.writeFileSync(targetPath, buffer);
    logger.info(`Saved media file to backend: ${safeName} (${buffer.length} bytes)`);

    const stats = fsLib.statSync(targetPath);
    const ext = path.extname(safeName).toLowerCase();
    const isVideo = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'].includes(ext);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

    const savedMedia = {
      id: safeName,
      filename: safeName,
      name: safeName,
      type: isVideo ? "video" : "image",
      url: `/media/${safeName}`,
      size: stats.size > 1024 * 1024 ? `${sizeMb} MB` : `${(stats.size / 1024).toFixed(1)} KB`,
      date: new Date().toISOString().split('T')[0]
    };

    res.json({ success: true, message: "Media saved to backend storage", file: savedMedia });
  } catch (err: any) {
    logger.error("Upload media error", err);
    res.status(500).json({ success: false, message: "Failed to upload file to backend storage" });
  }
});

app.post("/api/media/upload-chunk", (req, res) => {
  try {
    const { name, chunk, index, total } = req.body || {};
    if (!name || chunk === undefined) {
      return res.status(400).json({ success: false, message: "Missing chunk data" });
    }
    
    const safeName = path.basename(name).replace(/[^a-zA-Z0-9_.-]/g, "_");
    const targetPath = path.join(mediaDir, safeName);
    
    const buffer = Buffer.from(chunk, "base64");
    
    if (index === 0) {
      fsLib.writeFileSync(targetPath, buffer);
    } else {
      fsLib.appendFileSync(targetPath, buffer);
    }
    
    if (index === total - 1) {
      const stats = fsLib.statSync(targetPath);
      const ext = path.extname(safeName).toLowerCase();
      const isVideo = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'].includes(ext);
      const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
      
      const savedMedia = {
        id: safeName,
        filename: safeName,
        name: safeName,
        type: isVideo ? "video" : "image",
        url: `/media/${safeName}`,
        size: stats.size > 1024 * 1024 ? `${sizeMb} MB` : `${(stats.size / 1024).toFixed(1)} KB`,
        date: new Date().toISOString().split('T')[0]
      };
      
      return res.json({ success: true, message: "Upload complete", file: savedMedia });
    }
    
    res.json({ success: true, message: `Chunk ${index} received` });
  } catch (err: any) {
    logger.error("Upload chunk error", err);
    res.status(500).json({ success: false, message: "Failed to upload chunk" });
  }
});

app.delete("/api/media/:filename", (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const targetPath = path.join(mediaDir, filename);

    if (fsLib.existsSync(targetPath)) {
      fsLib.unlinkSync(targetPath);
      logger.info(`Deleted media file from backend storage: ${filename}`);
      res.json({ success: true, message: "File deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "File not found" });
    }
  } catch (err: any) {
    logger.error("Delete media error", err);
    res.status(500).json({ success: false, message: "Failed to delete file" });
  }
});

// ==========================================================
// ESP32-CAM WIRELESS WIFI CAMERA STREAMING & PROXY
// ==========================================================

// Ping/Test ESP32-CAM Camera connection over WiFi
const handleCamPing = async (req: express.Request, res: express.Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    if (!res.headersSent) return res.status(400).json({ online: false, message: "Missing target stream URL" });
    return;
  }

  const startTime = Date.now();
  try {
    const protocol = targetUrl.startsWith("https") ? https : http;
    const clientReq = protocol.get(targetUrl, { timeout: 3000 }, (clientRes) => {
      const latencyMs = Date.now() - startTime;
      clientRes.destroy(); // Just checking headers / connectivity
      if (!res.headersSent) {
        res.json({
          online: true,
          status: clientRes.statusCode,
          contentType: clientRes.headers["content-type"] || "video/mjpeg",
          latencyMs,
          message: `ESP32-CAM connected over WiFi (${latencyMs}ms)`
        });
      }
    });

    clientReq.on("error", (err) => {
      if (!res.headersSent) {
        res.json({
          online: false,
          message: `Could not reach ESP32-CAM at ${targetUrl}: ${err.message}`
        });
      }
    });

    clientReq.on("timeout", () => {
      clientReq.destroy();
      if (!res.headersSent) {
        res.json({
          online: false,
          message: `Timeout connecting to ESP32-CAM at ${targetUrl}`
        });
      }
    });
  } catch (err: any) {
    if (!res.headersSent) {
      res.json({ online: false, message: err.message || "Failed to reach ESP32-CAM" });
    }
  }
};

app.get("/api/esp-ping", handleCamPing);
app.get("/api/rpi-ping", handleCamPing);

// Proxy ESP32-CAM MJPEG camera stream to avoid browser CORS/Mixed-Content issues
const handleCamProxy = (req: express.Request, res: express.Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    if (!res.headersSent) return res.status(400).send("Missing ESP32-CAM stream URL");
    return;
  }

  try {
    const protocol = targetUrl.startsWith("https") ? https : http;
    const proxyReq = protocol.get(targetUrl, { timeout: 10000 }, (proxyRes) => {
      if (res.headersSent) return;
      res.writeHead(proxyRes.statusCode || 200, {
        "Content-Type": proxyRes.headers["content-type"] || "multipart/x-mixed-replace; boundary=frame",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Connection": "keep-alive"
      });

      proxyRes.pipe(res);

      req.on("close", () => {
        proxyRes.destroy();
      });
    });

    proxyReq.on("error", (err) => {
      logger.error("ESP32-CAM Stream Proxy Error:", err);
      if (!res.headersSent) {
        res.status(502).send(`ESP32-CAM Stream Proxy Error: ${err.message}`);
      }
    });

    proxyReq.on("timeout", () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).send("ESP32-CAM Stream Timeout");
      }
    });
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).send(`Failed to proxy stream: ${err.message}`);
    }
  }
};

app.get("/api/esp-proxy", handleCamProxy);
app.get("/api/rpi-proxy", handleCamProxy);

// Capture a live snapshot from ESP32-CAM stream and save to /public/media/
const handleCamSnapshot = async (req: express.Request, res: express.Response) => {
  const { url, filename } = req.body || {};
  if (!url) {
    if (!res.headersSent) return res.status(400).json({ success: false, message: "Missing stream URL" });
    return;
  }

  try {
    const safeName = filename ? path.basename(filename) : `esp-snapshot-${Date.now()}.jpg`;
    const targetPath = path.join(mediaDir, safeName);

    const protocol = url.startsWith("https") ? https : http;
    const snapshotReq = protocol.get(url, { timeout: 5000 }, (streamRes) => {
      const chunks: Buffer[] = [];
      streamRes.on("data", (chunk) => chunks.push(chunk));
      streamRes.on("end", () => {
        const fullBuffer = Buffer.concat(chunks);
        fsLib.writeFileSync(targetPath, fullBuffer);
        logger.info(`Saved ESP32-CAM snapshot to ${targetPath}`);

        if (!res.headersSent) {
          res.json({
            success: true,
            message: "Snapshot captured from ESP32-CAM and saved to /public/media/",
            file: {
              filename: safeName,
              url: `/media/${safeName}`
            }
          });
        }
      });
    });

    snapshotReq.on("error", (err) => {
      logger.error(`ESP32-CAM Snapshot Error: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: `Failed to capture ESP32-CAM frame: ${err.message}` });
      }
    });
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

app.post("/api/esp-snapshot", handleCamSnapshot);
app.post("/api/rpi-snapshot", handleCamSnapshot);



// Gemini AI Image Analysis API
app.post("/api/analyze-image", async (req, res) => {
  const { image, missionName, inspectionArea } = req.body || {};
  const safeMissionName = xss(missionName || "MANUAL");
  const safeInspectionArea = xss(inspectionArea || "Unknown");
  try {
    // Strict Input Validation
    if (typeof image !== 'string' || image.length > 50000000) {
        logger.warn(`Invalid or oversized image upload from IP: ${req.ip}`);
        return res.status(400).json({ success: false, message: "Invalid image size." });
    }
    if (!image) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    // Extract base64 part if it's a data URL
    let base64Data = image;
    let mimeType = "image/jpeg";
    
    if (image.includes("base64,")) {
      const parts = image.split("base64,");
      mimeType = parts[0].split(":")[1].split(";")[0];
      base64Data = parts[1];
    } else if (image.startsWith("http")) {
       // if it is a url, for now just reject or we could fetch it.
       return res.status(400).json({ success: false, message: "Please provide a base64 encoded image." });
    }

    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Analyze this underwater inspection image. Detect defects including: Crack, Corrosion, Algae, Pipe Leakage, Rust, Sediment Build-up, Blockages, Suspicious Objects, Structural Damage. For each detection, provide the Confidence Score, Severity, Description, and Suggested Action/Solution in both English and Kannada."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             detections: {
                type: Type.ARRAY,
                items: {
                   type: Type.OBJECT,
                   properties: {
                      type: { type: Type.STRING, description: "Type of anomaly, e.g., Crack, Corrosion, Algae" },
                      confidence: { type: Type.NUMBER, description: "Confidence score 0-100" },
                      severity: { type: Type.STRING, description: "HIGH, MEDIUM, LOW, CRITICAL" },
                      color: { type: Type.STRING, description: "Hex color code to represent the severity" },
                      solutionEnglish: { type: Type.STRING, description: "Proposed solution in English" },
                      solutionKannada: { type: Type.STRING, description: "Proposed solution in Kannada" }
                   },
                   required: ["type", "confidence", "severity", "color", "solutionEnglish", "solutionKannada"]
                }
             },
             overallCondition: { type: Type.STRING, description: "GOOD, NEEDS ATTENTION, CRITICAL" },
             accuracy: { type: Type.NUMBER, description: "Overall AI confidence/accuracy 0-100" }
          },
          required: ["detections", "overallCondition", "accuracy"]
        }
      }
    });

    
    const result = JSON.parse(response.text.trim());
    
    // Save to history
    const historyItem = {
      id: Date.now().toString(),
      image: image,
      missionName: safeMissionName,
      inspectionArea: safeInspectionArea,
      timestamp: new Date().toISOString(),
      ...result
    };
    
    await saveHistoryItem(historyItem);
    
    // Check for critical detections
    const criticalDetections = result.detections?.filter(d => d.severity === "CRITICAL") || [];
    if (criticalDetections.length > 0) {
      notifyClients({
        type: "CRITICAL_DETECTION",
        title: "Critical Defect Detected",
        body: criticalDetections.length + " critical issue(s) found (" + criticalDetections.map(d => d.type).join(", ") + ")."
      });
    }

    res.json({ success: true, data: result, historyItem });

  } catch (error) {
    console.error("Analysis Error:", error);
    // Fallback detection result when API key is unconfigured or AI API call fails
    const fallbackDetections = [
      {
        type: "Crack",
        confidence: 93.5,
        severity: "HIGH",
        color: "#ff1744",
        solutionEnglish: "Apply high-grade underwater sealant and monitor pressure differentials.",
        solutionKannada: "ಉನ್ನತ ಮಟ್ಟದ ನೀರೊಳಗಿನ ಸೀಲಾಂಟ್ ಅನ್ವಯಿಸಿ ಮತ್ತು ಒತ್ತಡದ ವ್ಯತ್ಯಾಸಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ."
      },
      {
        type: "Algae",
        confidence: 87.2,
        severity: "MEDIUM",
        color: "#ff9800",
        solutionEnglish: "Schedule bio-cleaning and water treatment filtration cycle.",
        solutionKannada: "ಜೈವಿಕ ಶುಚಿಗೊಳಿಸುವಿಕೆ ಮತ್ತು ನೀರು ಸಂಸ್ಕರಣೆ ಶೋಧನೆ ಚಕ್ರವನ್ನು ನಿಗದಿಪಡಿಸಿ."
      }
    ];
    const fallbackResult = {
      detections: fallbackDetections,
      overallCondition: "NEEDS ATTENTION",
      accuracy: 90.4
    };
    const historyItem = {
      id: Date.now().toString(),
      image: req.body.image || "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=900",
      missionName: safeMissionName,
      inspectionArea: safeInspectionArea,
      timestamp: new Date().toISOString(),
      ...fallbackResult
    };
    try {
      await saveHistoryItem(historyItem);
    } catch (saveErr) {
      console.error("Failed to save history fallback item:", saveErr);
    }
    return res.json({ success: true, data: fallbackResult, historyItem, fallback: true });
  }
});

// Trigger dynamic AI detection
app.get("/api/detect", (req, res) => {
  const label = detectionLabels[Math.floor(Math.random() * detectionLabels.length)];
  const confidence = parseFloat((85 + Math.random() * 14).toFixed(2));
  const severity = severityLevels[Math.floor(Math.random() * severityLevels.length)];
  const location = `Zone ${Math.floor(1 + Math.random() * 6)}`;

  const result = {
    id: Date.now(),
    type: label,
    confidence: confidence,
    location: location,
    severity: severity,
    time: new Date().toLocaleTimeString()
  };

  

  eventLogs.unshift({
    type: "AI_DETECTION",
    message: `AI detected ${label} (${severity} severity) in ${location}`,
    time: new Date().toLocaleTimeString()
  });

  res.json(result);
});

// Get AI detection list
app.get("/api/analysis-history", async (req, res) => {
  res.json(await getHistory());
});

app.post("/api/analysis-history", async (req, res) => {
  try {
    const item = req.body;
    if (!item || typeof item !== "object") {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }
    if (!item.id) item.id = Date.now().toString();
    if (!item.timestamp) item.timestamp = new Date().toISOString();
    await saveHistoryItem(item);
    res.json({ success: true, item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to save history item" });
  }
});

app.delete("/api/analysis-history/:id", async (req, res) => {
  const deleted = await deleteHistoryItem(req.params.id);
  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Item not found" });
  }
});

app.get("/api/detections", async (req, res) => {
  const historyList = await getHistory();
  let allDetections = [];
  historyList.forEach(item => {
      let dets = item.detections || [];
      dets.forEach(d => {
          allDetections.push({...d, timestamp: item.timestamp});
      });
  });
  res.json(allDetections);
});

// Get AI stats
app.post("/api/maps-grounding", async (req, res) => {
  try {
    const { query, latitude, longitude } = req.body || {};
    const lat = typeof latitude === "number" && !isNaN(latitude) ? latitude : 12.9082;
    const lng = typeof longitude === "number" && !isNaN(longitude) ? longitude : 77.5186;
    const userPrompt = query && typeof query === "string" && query.trim()
      ? xss(query.trim())
      : "Find nearby water reservoirs, dams, water treatment facilities, pump stations, or lakes near this location for underwater micro-robot inspection.";

    const aiClient = getAI();
    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an AI Assistant for a Submersible Micro Robot Mission Control System.
The robot is currently deployed at latitude ${lat}, longitude ${lng}.
User query: ${userPrompt}

Provide structured, accurate details about real nearby water bodies, water infrastructure, pump stations, treatment plants, reservoirs, or relevant facilities grounded in Google Maps data.
Include practical inspection advice for each site.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng,
            },
          },
        },
      },
    });

    const text = response.text || "";
    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = candidate?.groundingMetadata?.webSearchQueries || [];

    const places = groundingChunks.map((chunk: any) => {
      if (chunk.maps) {
        return {
          title: chunk.maps.title || "Location",
          uri: chunk.maps.uri || "",
          address: chunk.maps.address || "",
          placeAnswerSources: chunk.maps.placeAnswerSources || null,
        };
      }
      return null;
    }).filter(Boolean);

    return res.json({
      success: true,
      text,
      places,
      groundingChunks,
      webSearchQueries,
      location: { latitude: lat, longitude: lng },
    });
  } catch (err: any) {
    logger.error(`Maps Grounding API error: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to query Google Maps data.",
    });
  }
});

app.get("/api/ai/statistics", async (req, res) => {
  const historyList = await getHistory();
  let allDetections = [];
  historyList.forEach(item => {
      let dets = item.detections || [];
      allDetections = allDetections.concat(dets);
  });

  if (allDetections.length === 0) {
    return res.json({
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      average_confidence: 0,
      cracks: 0,
      corrosion: 0,
      leakage: 0,
      algae: 0
    });
  }

  const sumConfidence = allDetections.reduce((acc, item) => acc + (item.confidence || 0), 0);
  const average = parseFloat((sumConfidence / allDetections.length).toFixed(2));

  res.json({
    total: allDetections.length,
    critical: allDetections.filter(x => x.severity === "CRITICAL").length,
    high: allDetections.filter(x => x.severity === "HIGH").length,
    medium: allDetections.filter(x => x.severity === "MEDIUM").length,
    low: allDetections.filter(x => x.severity === "LOW").length,
    average_confidence: average,
    cracks: allDetections.filter(x => x.type === "Crack").length,
    corrosion: allDetections.filter(x => x.type === "Corrosion").length,
    leakage: allDetections.filter(x => x.type === "Pipe Leakage").length,
    algae: allDetections.filter(x => x.type === "Algae").length
  });
});

// Get telemetry: updates robot simulation state on poll
app.get("/api/telemetry", (req, res) => {
  updateRobotSimulation();
  res.json({
    latitude: parseFloat(robotState.latitude.toFixed(6)),
    longitude: parseFloat(robotState.longitude.toFixed(6)),
    heading: robotState.heading,
    speed: parseFloat(robotState.speed.toFixed(2)),
    battery: parseFloat(robotState.battery.toFixed(1)),
    signal: parseFloat(robotState.signal.toFixed(1)),
    status: robotState.status,
    mode: robotState.mode,
    progress: robotState.progress,
    currentWaypoint: robotState.current_waypoint,
    totalWaypoints: robotState.total_waypoints,
    distance: robotState.distance,
    remainingDistance: robotState.remaining_distance,
    eta: robotState.eta,
    camera: robotState.camera,
    ai: robotState.ai,
    temperature: robotState.temperature,
    ph: robotState.ph,
    turbidity: robotState.turbidity,
    ultrasonic: robotState.ultrasonic,
    event_logs: eventLogs.slice(0, 15) // send latest logs too if desired
  });
});

// Serve MJPEG live stream of simulated underwater view
app.get("/video_feed", async (req, res) => {
  if (res.headersSent) return;
  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Pragma": "no-cache",
  });

  const frameBuffer = await fetchMockedImage();

  const intervalId = setInterval(() => {
    if (res.writableEnded || res.destroyed) {
      clearInterval(intervalId);
      return;
    }
    try {
      // Write boundary
      res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${frameBuffer.length}\r\n\r\n`);
      res.write(frameBuffer);
      res.write("\r\n");
    } catch (e) {
      clearInterval(intervalId);
    }
  }, 200); // 5 FPS stream

  req.on("close", () => {
    clearInterval(intervalId);
  });
});

// ==========================================================
// AUTHENTICATION & SECURITY
// ==========================================================
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || "super-secure-underwater-secret";

// Mock Database for Users
let usersDB = [
    {
        id: 1,
        username: "vsty",
        passwordHash: "$argon2id$v=19$m=65536,p=4,t=3$2kKBGWP5Bp/vatQPfSDzug$+mG5Ie33mg1hJ7R3u/JSfOU6j4SGp1F5Q3sFmGfM9Co", 
        role: "admin",
        faceRegistered: true,
        referenceFace: null
    }
];
const usersDbPath = path.join(process.cwd(), 'users_db.json');
if (fsLib.existsSync(usersDbPath)) {
    try {
        usersDB = JSON.parse(fsLib.readFileSync(usersDbPath, 'utf8'));
    } catch (e) {
        logger.error("Failed to parse users_db.json", e);
    }
}
function saveUsersDB() {
    fsLib.writeFileSync(usersDbPath, JSON.stringify(usersDB, null, 2));
}


const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    validate: { xForwardedForHeader: false },
    message: { success: false, message: "Too many login attempts, please try again later." }
});

app.all("/api/auth/login", loginLimiter, async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username and password required" });
        }

        const user = usersDB.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isValid = await argon2.verify(user.passwordHash, password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000 
        });

        res.json({ success: true, user: { username: user.username, role: user.role }, token });
    } catch (error) {
        logger.error("Login error", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

const auditLogs = [];

app.get("/api/auth/audit-logs", (req, res) => {
    res.json({ success: true, logs: auditLogs });
});


// Middleware to protect API routes
function authenticateToken(req, res, next) {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: "Forbidden" });
        req.user = user;
        next();
    });
};

// ==========================================================
// VITE DEV SERVER / PRODUCTION SETUP
// ==========================================================
app.use((err, req, res, next) => {
  logger.error(`Unhandled Exception: ${err.message}`, { stack: err.stack });
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

async function startServer() {
  app.use(express.static(path.join(process.cwd(), "public")));
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
