import "../styles/SensorCard.css";

function SensorCard({
  title,
  value,
  status = "OK",
  unit = "",
  error,
  solution
}) {
  const getColor = () => {
    switch (status) {
      case "OK":
        return "#22c55e";
      case "WARNING":
        return "#ffb703";
      case "ERROR":
        return "#ff4d6d";
      default:
        return "#22d3ee";
    }
  };

  return (
    <div className="sensor-card" style={{ 
      border: status === "ERROR" ? "1px solid #ff4d6d" : (status === "WARNING" ? "1px solid #ffb703" : "1px solid rgba(18,211,224,0.2)"),
      backgroundColor: status === "ERROR" ? "rgba(255, 77, 109, 0.15)" : "#16203a"
    }}>
      <div className="sensor-header">
        <span className="sensor-title">
          {title}
        </span>
        <span
          className="sensor-indicator"
          style={{
            background: getColor()
          }}
        />
      </div>
      <div className="sensor-value" style={{ color: status === "ERROR" ? "#ff4d6d" : "white" }}>
        {value}
        <span className="sensor-unit">
          {unit}
        </span>
      </div>
      <div className="sensor-footer">
        <div
          className="sensor-progress"
          style={{
            width: value === "ERR" ? "10%" : "80%",
            background: getColor()
          }}
        />
      </div>
      
      {error && (
        <div style={{ marginTop: "15px", fontSize: "14px", color: "#ff4d6d" }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {solution && (
        <div style={{ marginTop: "8px", fontSize: "14px", color: "#22d3ee" }}>
          <strong>Fix:</strong> {solution}
        </div>
      )}
    </div>
  );
}

export default SensorCard;
