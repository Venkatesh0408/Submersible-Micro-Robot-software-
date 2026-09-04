import "../styles/RobotStatus.css";

export default function RobotStatus() {

  const status = [
    { name: "Robot", value: "ONLINE", color: "#22c55e" },
    { name: "Battery", value: "92%", color: "#22d3ee" },
    { name: "Signal", value: "98%", color: "#22d3ee" },
    { name: "GPS", value: "LOCKED", color: "#22c55e" },
    { name: "Camera", value: "CONNECTED", color: "#22c55e" },
    { name: "Motors", value: "HEALTHY", color: "#22c55e" },
    { name: "IMU", value: "ACTIVE", color: "#22c55e" },
    { name: "AI", value: "READY", color: "#22d3ee" }
  ];

  return (

    <div className="robot-card">

      <h2>🤖 Robot Status</h2>

      <div className="robot-grid">

        {status.map((item) => (

          <div className="robot-item" key={item.name}>

            <div className="robot-name">

              {item.name}

            </div>

            <div
              className="robot-value"
              style={{ color: item.color }}
            >

              {item.value}

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}