import { useState, useEffect } from "react";
import { useMission } from "../context/MissionContext";
import { generateInspectionReport } from "../utils/pdfGenerator";
import { 
  FileText, 
  MapPin, 
  Globe, 
  Wifi, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Save, 
  Camera, 
  Upload, 
  ShieldAlert, 
  Wrench, 
  Droplet, 
  Layers, 
  RefreshCw,
  Sparkles,
  Eye,
  X
} from "lucide-react";

// Preset sample defect images and details for quick selection/testing
const SAMPLE_DEFECTS = [
  {
    title: "High Pressure Pipe Leakage & Fissure",
    type: "Pipe Leakage",
    environment: "Water Tank",
    severity: "CRITICAL",
    address: "Sector 4 Water Tank Subsurface Wall, Outer Ring Road, Bengaluru, Karnataka 560060",
    ipAddress: "192.168.1.100:81",
    image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800",
    errorDetail: "High-pressure underwater fracture & concrete joint degradation detected. AI computer vision identified a severe 3.5mm aperture crack with continuous water seepage (1.4 L/min flow rate) and high risk of internal steel rebar oxidation.",
    solutionDetail: "1. Isolate local sector pressure intake valve.\n2. Inject hydrophobic polyurethane expansion resin under 15 bar pressure.\n3. Apply anti-corrosive carbon-fiber epoxy reinforcement wrap over fissure line.\n4. Conduct secondary acoustic echo scan & re-inspect after 24 hours."
  },
  {
    title: "Structural Concrete Wall Fracture",
    type: "Structural Crack",
    environment: "Dam",
    severity: "HIGH",
    address: "Hydroelectric Dam Spillway Gate 3, Kaveri Basin, Karnataka 571607",
    ipAddress: "192.168.1.102:81",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800",
    errorDetail: "Vertical structural fatigue crack extending 1.2 meters along eastern dam bulkhead. Caused by hydrostatic head pressure fluctuations. Seepage rate monitored at 0.8 L/min with localized concrete spalling.",
    solutionDetail: "1. Install diverter pressure relief channel.\n2. Pressure-inject high-tensile structural epoxy resin into the crack core.\n3. Anchor stainless steel surface clamping brackets.\n4. Perform automated ultrasonic thickness audit."
  },
  {
    title: "Heavy Rebar Corrosion & Rusting",
    type: "Corrosion",
    environment: "Pipeline",
    severity: "HIGH",
    address: "Main Water Aqueduct Conduit, Sector B-12, Subsurface Intake Pipeline",
    ipAddress: "192.168.1.105:81",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
    errorDetail: "Extensive electrochemical surface oxidation on reinforced steel internal piping. Wall thickness reduced by 18% due to prolonged exposure to low-pH stagnant water.",
    solutionDetail: "1. High-pressure water jet abrasive blasting to clear rust scaling.\n2. Apply dual-coat cathodic zinc-rich protective epoxy barrier.\n3. Install sacrificial zinc anodes along pipeline flange joints.\n4. Monitor dissolved oxygen levels."
  },
  {
    title: "Microbial Algae & Biofouling Accumulation",
    type: "Algae / Biofouling",
    environment: "Lake",
    severity: "MEDIUM",
    address: "Kengeri Lake Intake Chamber, Subsurface Intake Sector 2",
    ipAddress: "192.168.1.110:81",
    image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
    errorDetail: "Thick bio-film and filamentous algae growth obstructing optical turbidity sensors and reducing intake flow efficiency by 14%.",
    solutionDetail: "1. Deploy automated ultrasonic algae disruption transducers.\n2. Mechanical scrub cleaning using motorized submersible brushes.\n3. Recalibrate optical turbidity and pH sensors.\n4. Flush intake manifold."
  }
];

const STANDARD_ENVIRONMENTS = ["Water Tank", "Dam", "Lake", "River", "Pipeline", "Wastewater Plant"];

export default function MissionReportColumn() {
  const { 
    missionName, 
    inspectionArea, 
    robot, 
    missionCompleted, 
    missionStarted 
  } = useMission();

  // Report state fields
  const [reportMissionName, setReportMissionName] = useState(missionName || "Underwater Inspection Mission 01");
  const [environmentType, setEnvironmentType] = useState(inspectionArea || "Water Tank");
  const [isCustomEnv, setIsCustomEnv] = useState(!STANDARD_ENVIRONMENTS.includes(inspectionArea || "Water Tank"));
  const [address, setAddress] = useState("Sector 4 Water Tank Subsurface Wall, Outer Ring Road, Bengaluru, Karnataka 560060");
  const [ipAddress, setIpAddress] = useState("192.168.1.100:81");
  const [lat, setLat] = useState(robot.latitude || 12.908200);
  const [lng, setLng] = useState(robot.longitude || 77.518600);
  const [image, setImage] = useState(SAMPLE_DEFECTS[0].image);
  const [defectType, setDefectType] = useState("Structural Crack & Pipe Seepage");
  const [severity, setSeverity] = useState("HIGH");
  const [overallCondition, setOverallCondition] = useState("NEEDS ATTENTION");
  const [errorDetail, setErrorDetail] = useState(SAMPLE_DEFECTS[0].errorDetail);
  const [solutionDetail, setSolutionDetail] = useState(SAMPLE_DEFECTS[0].solutionDetail);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if context changes
  useEffect(() => {
    if (missionName) setReportMissionName(missionName);
    if (inspectionArea) {
      setEnvironmentType(inspectionArea);
      setIsCustomEnv(!STANDARD_ENVIRONMENTS.includes(inspectionArea));
    }
    if (robot.latitude) setLat(robot.latitude);
    if (robot.longitude) setLng(robot.longitude);
  }, [missionName, inspectionArea, robot.latitude, robot.longitude]);

  // Handle Preset selection
  const handleSelectPreset = (preset) => {
    setDefectType(preset.type);
    setEnvironmentType(preset.environment);
    setIsCustomEnv(!STANDARD_ENVIRONMENTS.includes(preset.environment));
    setSeverity(preset.severity);
    setOverallCondition(preset.severity === "CRITICAL" ? "CRITICAL" : "NEEDS ATTENTION");
    setAddress(preset.address);
    setIpAddress(preset.ipAddress);
    setImage(preset.image);
    setErrorDetail(preset.errorDetail);
    setSolutionDetail(preset.solutionDetail);
  };

  // Auto-sync GPS address
  const handleSyncGpsAddress = () => {
    const curLat = robot.latitude ? robot.latitude.toFixed(6) : "12.908200";
    const curLng = robot.longitude ? robot.longitude.toFixed(6) : "77.518600";
    setLat(robot.latitude);
    setLng(robot.longitude);
    setAddress(`${environmentType} Subsurface Inspection Sector, GPS Coords: ${curLat} N, ${curLng} E, Bengaluru, Karnataka 560060`);
  };

  // Image Upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Capture image from ESP32 camera endpoint
  const handleCaptureEspCam = async () => {
    try {
      const res = await fetch("/api/esp-snapshot", { method: "POST" });
      const data = await res.json();
      if (data.success && data.image) {
        setImage(data.image);
      } else {
        setImage("https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800");
      }
    } catch (e) {
      console.error("ESP Capture error:", e);
    }
  };

  // Save report to backend history
  const handleSaveReport = async () => {
    setSaving(true);
    setSaveSuccess(false);
    const reportData = {
      id: Date.now().toString(),
      missionName: reportMissionName,
      inspectionArea: environmentType,
      address,
      ipAddress,
      lat,
      lng,
      image,
      overallCondition,
      accuracy: 96.8,
      timestamp: new Date().toISOString(),
      defectType,
      errorDetail,
      solutionDetail,
      detections: [
        {
          type: defectType,
          severity,
          confidence: 96.8,
          color: severity === "CRITICAL" ? "#ef4444" : "#f59e0b",
          solutionEnglish: solutionDetail,
          errorDetail: errorDetail
        }
      ]
    };

    try {
      const res = await fetch("/api/analysis-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Save report error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Direct PDF download helper
  const handleDownloadPdf = () => {
    const reportItem = {
      id: Date.now().toString(),
      missionName: reportMissionName,
      inspectionArea: environmentType,
      address,
      ipAddress,
      lat,
      lng,
      image,
      overallCondition,
      accuracy: 96.8,
      timestamp: new Date().toISOString(),
      defectType,
      errorDetail,
      solutionDetail,
      detections: [
        {
          type: defectType,
          severity,
          confidence: 96.8,
          solutionEnglish: solutionDetail,
          errorDetail: errorDetail
        }
      ]
    };
    generateInspectionReport(reportItem);
  };

  return (
    <>
      {/* COMPACT FRONT PANEL (Compact Card matching AI Inspection / GPS block) */}
      <div className="mission-report-compact-card" style={{
        background: "#0e1524",
        borderRadius: "22px",
        padding: "20px",
        boxShadow: "0 0 25px rgba(18,211,224, .2)",
        border: "1px solid rgba(18,211,224, .3)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box"
      }}>
        {/* Header */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h2 style={{ color: "#22d3ee", fontSize: "20px", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={22} /> Mission Report
            </h2>
            <span style={{
              background: missionCompleted ? "rgba(34,197,94,0.18)" : "rgba(18,211,224,0.18)",
              color: missionCompleted ? "#4ade80" : "#22d3ee",
              border: `1px solid ${missionCompleted ? "#22c55e" : "#22d3ee"}`,
              padding: "3px 10px",
              borderRadius: "16px",
              fontSize: "10.5px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              {missionCompleted ? "COMPLETED" : "READY"}
            </span>
          </div>

          {/* Compact Info Summary Row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "100px 1fr",
            gap: "12px",
            background: "#16070a",
            padding: "12px",
            borderRadius: "14px",
            border: "1px solid rgba(18,211,224,0.2)",
            marginBottom: "14px"
          }}>
            {/* Image Thumbnail */}
            <div style={{
              width: "100%",
              height: "85px",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid #22d3ee",
              position: "relative"
            }}>
              <img src={image} alt="Defect Snapshot" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <span style={{
                position: "absolute",
                bottom: 2,
                left: 2,
                background: "rgba(0,0,0,0.8)",
                color: severity === "CRITICAL" ? "#ef4444" : "#f59e0b",
                fontSize: "8.5px",
                fontWeight: "900",
                padding: "1px 5px",
                borderRadius: "4px"
              }}>
                {severity}
              </span>
            </div>

            {/* Target & Telemetry Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", overflow: "hidden" }}>
              <div style={{ color: "#ffffff", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                <Droplet size={13} color="#22d3ee" />
                <span>Target: <strong>{environmentType}</strong></span>
              </div>
              <div style={{ color: "#93a1bc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={13} color="#22d3ee" />
                <span>{address}</span>
              </div>
              <div style={{ color: "#8296a8", display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px" }}>
                <span>IP: <strong style={{ color: "#ffffff" }}>{ipAddress}</strong></span>
                <span>GPS: <strong style={{ color: "#4ade80" }}>{lat ? lat.toFixed(3) : "12.908"}</strong></span>
              </div>
              <div style={{ color: "#93a1bc", fontWeight: "bold", fontSize: "10.5px", marginTop: "2px" }}>
                Defect: {defectType}
              </div>
            </div>
          </div>
        </div>

        {/* FRONT TWO ACTION BUTTONS (View Details & Direct Download) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
          
          {/* OPTION 1: View Details Modal */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "#1e090d",
              color: "#ffffff",
              border: "1px solid rgba(18,211,224,0.4)",
              padding: "10px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <Eye size={15} color="#22d3ee" /> View Details
          </button>

          {/* OPTION 2: Download PDF Directly */}
          <button
            onClick={handleDownloadPdf}
            style={{
              background: "#22d3ee",
              color: "#ffffff",
              border: "none",
              padding: "10px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "900",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: "0 0 12px rgba(18,211,224,0.35)",
              transition: "all 0.2s ease"
            }}
          >
            <Download size={15} /> Download PDF
          </button>

        </div>
      </div>

      {/* FULL DETAILS OVERLAY MODAL (Opened when clicking "View Details") */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          overflowY: "auto"
        }}>
          <div style={{
            background: "#0e1524",
            borderRadius: "24px",
            border: "1px solid #22d3ee",
            boxShadow: "0 0 35px rgba(18,211,224, 0.4)",
            width: "100%",
            maxWidth: "850px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            color: "#ffffff"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(18,211,224,0.3)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText size={24} color="#22d3ee" />
                <div>
                  <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#ffffff" }}>
                    📋 Full Mission Completion & Defect Report Details
                  </h3>
                  <p style={{ margin: "2px 0 0 0", color: "#8296a8", fontSize: "12px" }}>
                    Inspect location address, IP telemetry, target environment, defect image & error solution plan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "rgba(18,211,224,0.15)",
                  color: "#22d3ee",
                  border: "1px solid rgba(18,211,224,0.3)",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Presets */}
            <div style={{ background: "#18080c", padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(18,211,224,0.2)" }}>
              <div style={{ color: "#22d3ee", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Layers size={13} /> Defect Scenario Quick Presets:
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {SAMPLE_DEFECTS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      background: defectType === preset.type ? "#22d3ee" : "#0d0406",
                      color: "#ffffff",
                      border: defectType === preset.type ? "1px solid #22d3ee" : "1px solid rgba(18,211,224,0.3)",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 1 & 2: Environment & Location */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              
              {/* Target Environment */}
              <div style={{ background: "#0a1826", padding: "14px", borderRadius: "12px", border: "1px solid rgba(18,211,224,0.2)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ color: "#22d3ee", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Droplet size={15} /> 1. Mission Target Environment
                </div>

                <div>
                  <label style={{ color: "#8296a8", fontSize: "11px", display: "block", marginBottom: "4px" }}>Mission Name:</label>
                  <input
                    type="text"
                    value={reportMissionName}
                    onChange={(e) => setReportMissionName(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#07101a",
                      border: "1px solid rgba(18,211,224,0.4)",
                      color: "#ffffff",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: "#8296a8", fontSize: "11px", display: "block", marginBottom: "4px" }}>Where Mission is Conducted (Target Facility):</label>
                  <select
                    value={isCustomEnv ? "Custom" : environmentType}
                    onChange={(e) => {
                      if (e.target.value === "Custom") {
                        setIsCustomEnv(true);
                        if (STANDARD_ENVIRONMENTS.includes(environmentType)) {
                          setEnvironmentType("Custom Location");
                        }
                      } else {
                        setIsCustomEnv(false);
                        setEnvironmentType(e.target.value);
                      }
                    }}
                    style={{
                      width: "100%",
                      background: "#07101a",
                      border: "1px solid rgba(18,211,224,0.4)",
                      color: "#ffffff",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="Water Tank">💧 Water Tank / Storage Reservoir</option>
                    <option value="Dam">🏗️ Dam / Hydroelectric Bulkhead</option>
                    <option value="Lake">🌊 Natural Lake / Reservoir Body</option>
                    <option value="River">🌊 River / Aqueduct Pipeline</option>
                    <option value="Pipeline">🚰 Water Distribution Pipeline</option>
                    <option value="Wastewater Plant">🏭 Wastewater Treatment Facility</option>
                    <option value="Custom">⚙️ Custom Location...</option>
                  </select>

                  {isCustomEnv && (
                    <div style={{ marginTop: "8px" }}>
                      <label style={{ color: "#22d3ee", fontSize: "10.5px", fontWeight: "bold", display: "block", marginBottom: "3px" }}>
                        Enter Custom Target Location Name:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Industrial Chemical Tank 4"
                        value={environmentType}
                        onChange={(e) => setEnvironmentType(e.target.value)}
                        style={{
                          width: "100%",
                          background: "#07101a",
                          border: "1px solid #22d3ee",
                          color: "#ffffff",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Address & IP Telemetry */}
              <div style={{ background: "#0a1826", padding: "14px", borderRadius: "12px", border: "1px solid rgba(18,211,224,0.2)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ color: "#22d3ee", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={15} /> 2. Infected Area Address & IP</span>
                  <button
                    onClick={handleSyncGpsAddress}
                    style={{
                      background: "rgba(18,211,224,0.15)",
                      color: "#22d3ee",
                      border: "1px solid rgba(18,211,224,0.3)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    📍 Sync Robot GPS
                  </button>
                </div>

                <div>
                  <label style={{ color: "#8296a8", fontSize: "11px", display: "block", marginBottom: "4px" }}>Infected Location Address:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#07101a",
                      border: "1px solid rgba(18,211,224,0.4)",
                      color: "#ffffff",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ color: "#8296a8", fontSize: "11px", display: "block", marginBottom: "4px" }}>Robot IP Address:</label>
                    <input
                      type="text"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#07101a",
                        border: "1px solid rgba(18,211,224,0.4)",
                        color: "#ffffff",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: "#8296a8", fontSize: "11px", display: "block", marginBottom: "4px" }}>GPS Lat/Lng:</label>
                    <div style={{
                      background: "#07101a",
                      border: "1px solid rgba(18,211,224,0.2)",
                      color: "#4ade80",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: "bold"
                    }}>
                      {lat.toFixed(5)}, {lng.toFixed(5)}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Section 3: Image Snapshot */}
            <div style={{ background: "#0a1826", padding: "14px", borderRadius: "12px", border: "1px solid rgba(18,211,224,0.2)" }}>
              <div style={{ color: "#22d3ee", fontSize: "12px", fontWeight: "bold", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Camera size={15} /> 3. Infected Area Image Snapshot</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <label style={{
                    background: "#22d3ee",
                    color: "#ffffff",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <Upload size={12} /> Upload Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  </label>
                  <button
                    onClick={handleCaptureEspCam}
                    style={{
                      background: "#15803d",
                      color: "#ffffff",
                      border: "none",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Camera size={12} /> ESP32 Frame
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "14px", alignItems: "center" }}>
                <div style={{ width: "100%", height: "130px", borderRadius: "10px", overflow: "hidden", border: "2px solid #22d3ee" }}>
                  <img src={image} alt="Defect Snapshot" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ color: "#8296a8", fontSize: "11px", display: "block", marginBottom: "4px" }}>Defect Type:</label>
                    <input
                      type="text"
                      value={defectType}
                      onChange={(e) => setDefectType(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#07101a",
                        border: "1px solid rgba(18,211,224,0.4)",
                        color: "#ffffff",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: "#8296a8", fontSize: "11px", display: "block", marginBottom: "4px" }}>Severity Rating:</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#07101a",
                        border: "1px solid rgba(18,211,224,0.4)",
                        color: severity === "CRITICAL" ? "#ef4444" : "#f59e0b",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    >
                      <option value="CRITICAL">🔴 CRITICAL</option>
                      <option value="HIGH">🟠 HIGH</option>
                      <option value="MEDIUM">🟡 MEDIUM</option>
                      <option value="LOW">🟢 LOW</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 & 5: Error & Solution Detail Textareas */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              
              <div style={{ background: "rgba(239, 68, 68, 0.08)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ color: "#ef4444", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldAlert size={15} /> 4. Detailed Error / Anomaly Explanation
                </div>
                <textarea
                  rows={4}
                  value={errorDetail}
                  onChange={(e) => setErrorDetail(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#07101a",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    color: "#93a1bc",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    fontSize: "11.5px",
                    lineHeight: "1.4",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ background: "rgba(34, 197, 94, 0.08)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(34, 197, 94, 0.3)", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ color: "#22c55e", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Wrench size={15} /> 5. Detailed Solution & Engineering Plan
                </div>
                <textarea
                  rows={4}
                  value={solutionDetail}
                  onChange={(e) => setSolutionDetail(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#07101a",
                    border: "1px solid rgba(34, 197, 94, 0.4)",
                    color: "#86efac",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    fontSize: "11.5px",
                    lineHeight: "1.4",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box"
                  }}
                />
              </div>

            </div>

            {/* Modal Action Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(18,211,224,0.3)", paddingTop: "14px" }}>
              {saveSuccess ? (
                <span style={{ color: "#4ade80", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={16} /> Saved to History!
                </span>
              ) : <span></span>}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleSaveReport}
                  disabled={saving}
                  style={{
                    background: "#16203a",
                    color: "#ffffff",
                    border: "1px solid #22d3ee",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Saving..." : "Save to History"}
                </button>

                <button
                  onClick={() => {
                    handleDownloadPdf();
                    setShowModal(false);
                  }}
                  style={{
                    background: "#22d3ee",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: "900",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 0 15px rgba(18,211,224,0.4)"
                  }}
                >
                  <Download size={14} /> Download PDF Report
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
