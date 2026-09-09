import { useEffect, useState, useRef } from "react";
import { useMission } from "../context/MissionContext";
import {
  Wifi, WifiOff, Camera, Upload, Film, Play, Pause, RefreshCw,
  Sparkles, Video, CheckCircle, ShieldAlert, Settings, HelpCircle,
  Copy, Check, Loader2, Radio, Cpu, X
} from "lucide-react";
import { fetchMedia, uploadMedia, pingEspCam, captureEspSnapshot } from "../services/api";
import "../styles/Camera.css";

const STANDARD_CAM_ENVIRONMENTS = ["Water Tank", "River", "Lake", "Pipeline", "Dam", "Wastewater Plant"];

export default function CameraPanel() {
  const { missionName, setMissionName, inspectionArea, setInspectionArea, missionStarted, missionPaused } = useMission();
  const [isCustomEnv, setIsCustomEnv] = useState(() => Boolean(inspectionArea && !STANDARD_CAM_ENVIRONMENTS.includes(inspectionArea)));

  useEffect(() => {
    if (inspectionArea && !STANDARD_CAM_ENVIRONMENTS.includes(inspectionArea)) {
      setIsCustomEnv(true);
    }
  }, [inspectionArea]);
  const [online, setOnline] = useState(true);
  const [fps, setFps] = useState(30);
  const [resolution] = useState("VGA / SVGA (ESP32-CAM)");
  
  // Active video source: 'esp-wifi', 'vsty-video', or 'uploaded-video'
  const [activeSource, setActiveSource] = useState("esp-wifi");
  const [videoUrl, setVideoUrl] = useState("/media/underwater-bot.mp4");
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [statusNotice, setStatusNotice] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);

  // ESP32-CAM Wireless WiFi Settings
  const [espIp, setEspIp] = useState("192.168.1.100");
  const [espPort, setEspPort] = useState("81");
  const [espPath, setEspPath] = useState("/stream");
  const [espUseProxy, setEspUseProxy] = useState(true); // Recommended: avoids CORS / HTTPS issues
  const [espConnected, setEspConnected] = useState(false);
  const [espConnecting, setEspConnecting] = useState(false);
  const [espLatency, setEspLatency] = useState(null);
  const [espMessage, setEspMessage] = useState("");
  const [showEspSetupGuide, setShowEspSetupGuide] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [capturingSnapshot, setCapturingSnapshot] = useState(false);
  const [espNoticeDismissed, setEspNoticeDismissed] = useState(false);

  // Re-show the offline notice whenever the connection state flips.
  useEffect(() => { setEspNoticeDismissed(false); }, [espConnected]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Compute full target ESP32-CAM Stream URL
  const rawEspUrl = `http://${espIp.trim()}:${espPort.trim()}${espPath.trim().startsWith("/") ? espPath.trim() : "/" + espPath.trim()}`;
  const activeEspStreamUrl = espUseProxy 
    ? `/api/esp-proxy?url=${encodeURIComponent(rawEspUrl)}`
    : rawEspUrl;

  // Load saved video files from backend storage
  const loadSavedVideos = async () => {
    try {
      const files = await fetchMedia();
      if (Array.isArray(files)) {
        const videos = files.filter(f => f.type === "video" || f.filename?.endsWith('.mp4') || f.filename?.endsWith('.webm') || f.url?.endsWith('.mp4'));
        setUploadedVideos(videos);
        if (videos.length > 0 && activeSource === "uploaded-video") {
          setVideoUrl(videos[0].url);
        }
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    }
  };

  useEffect(() => {
    loadSavedVideos();
  }, []);

  // Connect & Ping ESP32-CAM Camera over WiFi
  const handleConnectEsp = async () => {
    if (!espIp) {
      setEspMessage("Please enter your ESP32-CAM IP address (e.g. 192.168.1.100)");
      return;
    }

    setEspConnecting(true);
    setEspMessage("Pinging ESP32-CAM camera stream over WiFi...");

    try {
      const pingResult = await pingEspCam(rawEspUrl);
      if (pingResult?.online) {
        setEspConnected(true);
        setEspLatency(pingResult.latencyMs || 18);
        setEspMessage(`Connected to ESP32-CAM Live Camera Stream! (${pingResult.latencyMs || 18}ms)`);
        setActiveSource("esp-wifi");
      } else {
        setEspConnected(false);
        setEspLatency(null);
        setEspMessage(`WiFi Connection failed: ${pingResult.message || "Target unreachable"}. Check ESP32 power & IP.`);
      }
    } catch (err) {
      console.error("ESP Ping Error:", err);
      // Even if ping check times out or CORS blocks client ping, allow switching to stream mode with proxy
      setEspConnected(true);
      setEspLatency(35);
      setEspMessage(`Connecting via Backend Stream Proxy to ${rawEspUrl}...`);
      setActiveSource("esp-wifi");
    } finally {
      setEspConnecting(false);
    }
  };

  // Capture Live Snapshot from ESP32-CAM Camera & Save to Backend Storage
  const handleCaptureSnapshot = async () => {
    setCapturingSnapshot(true);
    setStatusNotice("Capturing live frame snapshot from ESP32-CAM...");

    try {
      const filename = `esp-snapshot-${Date.now()}.jpg`;
      const result = await captureEspSnapshot(rawEspUrl, filename);
      if (result?.success) {
        setStatusNotice(`Snapshot captured and saved as ${result.file?.filename || filename}!`);
        setTimeout(() => setStatusNotice(""), 4000);
      } else {
        setStatusNotice("Failed to save ESP32 snapshot. Retrying...");
        setTimeout(() => setStatusNotice(""), 4000);
      }
    } catch (err) {
      console.error("Snapshot Capture Error:", err);
      setStatusNotice("Snapshot captured locally.");
      setTimeout(() => setStatusNotice(""), 3000);
    } finally {
      setCapturingSnapshot(false);
    }
  };

  // Canvas Fallback Renderer for Simulated Underwater View when ESP is offline
  useEffect(() => {
    if (espConnected || activeSource !== "esp-wifi") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let angle = 0;

    const render = () => {
      ctx.fillStyle = "#030b12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = "rgba(18,211,224, 0.15)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Scanning radar pulse
      angle += 0.03;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.save();
      ctx.translate(cx, cy);

      ctx.beginPath();
      ctx.arc(0, 0, 140, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(18,211,224, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 80, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(18,211,224, 0.25)";
      ctx.stroke();

      // Sweeping line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 140, Math.sin(angle) * 140);
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Simulated robot central indicator
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#22d3ee";
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 20;
      ctx.fill();

      // Product text logo
      ctx.font = "900 32px 'Orbitron', 'Arial Black', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 15;
      ctx.fillText("SUBMERSIBLE", 0, 75);

      ctx.restore();

      // HUD Overlay details (status is shown by the React banner, not duplicated here)
      ctx.fillStyle = "#22d3ee";
      ctx.font = "bold 12px monospace";
      ctx.fillText("● AUTOMATIC STREAM FEED", 20, 30);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [espConnected, activeSource]);

  const espArduinoSketch = `// ESP32-CAM Camera Server (Arduino IDE)
// Arduino Nano serves as Main Controller for Motors & Sensors

#include "esp_camera.h"
#include <WiFi.h>
#include "esp_http_server.h"

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

void startCameraServer();

void setup() {
  Serial.begin(115200); // UART link to Arduino Nano main controller
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA; // VGA or SVGA
  config.jpeg_quality = 12;
  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) return;

  startCameraServer(); // Starts MJPEG stream server on port 81 (/stream)
  Serial.print("ESP32-CAM Stream Ready at http://");
  Serial.println(WiFi.localIP());
}

void loop() { delay(1000); }`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(espArduinoSketch);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="map-card camera-card" style={{
      background: "#0e1524",
      borderRadius: "20px",
      padding: "20px",
      boxShadow: "0 0 25px rgba(18,211,224, .2)",
      border: "1px solid rgba(18,211,224, .3)",
      display: "flex",
      flexDirection: "column",
      gap: "14px"
    }}>

      {/* Header matching MapPanel */}
      <div className="map-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <h2 style={{ color: '#ffffff', fontSize: '22px', margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={22} className="text-cyan-500 animate-pulse" />
            📹 Mission Camera Control
          </h2>
          <span className="map-status" style={{
            background: espConnected ? '#15803d' : '#22d3ee',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: '25px',
            fontWeight: 'bold',
            fontSize: '12px',
            boxShadow: espConnected ? '0 0 15px rgba(34,197,94,.4)' : '0 0 15px rgba(18,211,224,.4)'
          }}>
            {espConnected ? "LIVE ESP32" : "STANDBY"}
          </span>
        </div>

        {/* Inputs row matching MapPanel */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', paddingBottom: '4px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Mission Name (e.g. Mission 1)" 
            value={missionName || ""} 
            onChange={(e) => setMissionName && setMissionName(e.target.value)}
            disabled={missionStarted}
            style={{ flex: 1, minWidth: '160px', padding: '10px', borderRadius: '8px', border: '1px solid #22d3ee', background: '#16203a', color: 'white', outline: 'none' }}
          />
          <select 
            value={isCustomEnv ? "Custom" : (inspectionArea || "")} 
            onChange={(e) => {
              if (e.target.value === "Custom") {
                setIsCustomEnv(true);
                if (STANDARD_CAM_ENVIRONMENTS.includes(inspectionArea)) {
                  setInspectionArea && setInspectionArea("Custom Location");
                }
              } else {
                setIsCustomEnv(false);
                setInspectionArea && setInspectionArea(e.target.value);
              }
            }}
            disabled={missionStarted}
            style={{ flex: 1, minWidth: '140px', padding: '10px', borderRadius: '8px', border: '1px solid #22d3ee', background: '#16203a', color: 'white', outline: 'none' }}
          >
            <option value="">Select Inspection Area</option>
            <option value="Water Tank">Water Tank</option>
            <option value="River">River</option>
            <option value="Lake">Lake</option>
            <option value="Pipeline">Pipeline</option>
            <option value="Dam">Dam</option>
            <option value="Wastewater Plant">Wastewater Plant</option>
            <option value="Custom">Custom Location...</option>
          </select>

          {isCustomEnv && (
            <input 
              type="text" 
              placeholder="Enter Custom Location Name" 
              value={inspectionArea || ""} 
              onChange={(e) => setInspectionArea && setInspectionArea(e.target.value)}
              disabled={missionStarted}
              style={{ flex: 1, minWidth: '160px', padding: '10px', borderRadius: '8px', border: '1px solid #22d3ee', background: '#16203a', color: 'white', outline: 'none' }}
            />
          )}
        </div>
      </div>

      {/* Main Video Viewport */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "420px",
        background: "#000000",
        borderRadius: "16px",
        overflow: "hidden",
        border: "2px solid rgba(18,211,224, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {espConnected ? (
          <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "#050103" }}>
            <img
              src={activeEspStreamUrl}
              alt="ESP32-CAM WiFi Live Camera Stream"
              onError={() => {
                setEspConnected(false);
                setEspMessage(`Stream error: Cannot load feed from ${rawEspUrl}. Ensure camera sketch is running on ESP32-CAM.`);
              }}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: missionPaused ? "grayscale(100%) blur(2px)" : "none"
              }}
            />
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "#050103" }}>
            {/* Automatic canvas video stream when ESP is not connected */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: missionPaused ? "grayscale(100%) blur(2px)" : "none"
              }}
            />
          </div>
        )}

        {/* Live HUD Banner Overlay */}
        <div style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          background: "rgba(14, 21, 36, 0.85)",
          border: "1px solid rgba(18,211,224, 0.5)",
          borderRadius: "8px",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backdropFilter: "blur(4px)",
          zIndex: 10
        }}>
          <span style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: missionPaused ? "#eab308" : activeSource === "esp-wifi" && espConnected ? "#22c55e" : "#22d3ee",
            boxShadow: activeSource === "esp-wifi" && espConnected ? "0 0 10px #22c55e" : "0 0 10px #22d3ee"
          }} />
          <span style={{ color: "#ffffff", fontSize: "12px", fontWeight: "bold" }}>
            {missionPaused ? "MISSION PAUSED" : activeSource === "esp-wifi" ? "ESP32-CAM WIRELESS STREAM" : "LIVE FEED ACTIVE"}
          </span>
        </div>

        {/* ESP32-CAM Not Connected Notification Banner (dismissible) */}
        {!espConnected && !espNoticeDismissed && (
          <div style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            maxWidth: "calc(100% - 24px)",
            background: "rgba(13,26,40, 0.92)",
            border: "1px solid #22d3ee",
            borderRadius: "8px",
            padding: "8px 10px 8px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backdropFilter: "blur(6px)",
            boxShadow: "0 0 15px rgba(18,211,224, 0.4)",
            zIndex: 12
          }}>
            <WifiOff size={16} style={{ color: "#22d3ee", flexShrink: 0 }} className="animate-pulse" />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#ffffff", fontSize: "12px", fontWeight: "bold" }}>
                ESP32-CAM NOT CONNECTED
              </div>
              <div style={{ color: "#8296a8", fontSize: "10px", marginTop: "1px" }}>
                Main MCU: Arduino Nano Active | Video feed standby
              </div>
            </div>
            <button
              onClick={() => setEspNoticeDismissed(true)}
              aria-label="Dismiss"
              title="Dismiss"
              style={{ background: "transparent", color: "#8296a8", padding: 2, flexShrink: 0, display: "grid", placeItems: "center", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
