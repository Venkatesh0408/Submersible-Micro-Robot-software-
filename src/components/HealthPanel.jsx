import { useState, useEffect } from "react";
import { getHealth } from "../services/api";
import "../styles/Health.css";

export default function HealthPanel() {
  const [healthData, setHealthData] = useState([]);
  const [overallStatus, setOverallStatus] = useState("HEALTHY");

  useEffect(() => {
    async function loadHealth() {
      try {
        const data = await getHealth();
        if (Array.isArray(data)) {
          setHealthData(data);
          const hasError = data.some(d => d.status === "ERROR" || d.status === "WARNING");
          setOverallStatus(hasError ? "ATTENTION NEEDED" : "HEALTHY");
        }
      } catch (err) {
        console.warn("Health fetch warning (backend retrying):", err?.message || err);
      }
    }
    loadHealth();
    const timer = setInterval(loadHealth, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="health-card">
      <div className="health-header">
        <h2>❤️ Robot Health Monitor</h2>
        <span style={{ background: overallStatus === "HEALTHY" ? "#22c55e" : "#22d3ee", color: "#ffffff", fontWeight: "bold", padding: "4px 12px", borderRadius: "12px" }}>
          {overallStatus}
        </span>
      </div>
      
      <div className="health-grid">
        {healthData.length > 0 ? (
          healthData.map((item, index) => (
            <div
              className="health-item"
              key={index}
              style={{ 
                border: item.status === "ERROR" ? "1px solid #22d3ee" : "1px solid rgba(18,211,224,0.2)",
                backgroundColor: item.status === "ERROR" ? "rgba(18,211,224, 0.15)" : "#16203a"
              }}
            >
              <div className="health-top">
                <span style={{ fontWeight: "bold", color: "#ffffff" }}>{item.name}</span>
                <span style={{ color: item.color }}>{item.value}</span>
              </div>
              <div className="health-bar">
                <div
                  className="health-fill"
                  style={{
                    width: item.width || item.value,
                    background: item.color
                  }}
                />
              </div>
              {item.error && (
                <div style={{ marginTop: "12px", fontSize: "13px", color: "#ff4444" }}>
                  <strong>Error:</strong> {item.error}
                </div>
              )}
              {item.solution && (
                <div style={{ marginTop: "6px", fontSize: "13px", color: "#22d3ee" }}>
                  <strong>Fix:</strong> {item.solution}
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ color: "white" }}>Loading health data...</div>
        )}
      </div>
    </div>
  );
}
