import "../styles/Detection.css";

export default function DetectionPanel({ data }) {
  const detections = data?.detections || [];
  
  return (
    <div className="detect-card">
      <div className="detect-header">
        <h2>🤖 AI Detection Center</h2>
        <span>{detections.length > 0 ? "ANALYSIS COMPLETE" : "WAITING"}</span>
      </div>

      {/* Statistics */}
      <div className="detect-stats">
        <div className="stat-box">
          <h3>{data?.objects || 0}</h3>
          <p>Anomalies</p>
        </div>
        <div className="stat-box">
          <h3>{data?.accuracy || 0}%</h3>
          <p>Accuracy</p>
        </div>
        <div className="stat-box">
          <h3 style={{
            color: data?.condition === 'GOOD' ? '#00e676' : 
                   data?.condition === 'CRITICAL' ? '#ff1744' : '#ff9800',
            fontSize: '18px'
          }}>
             {data?.condition || "N/A"}
          </h3>
          <p>Condition</p>
        </div>
      </div>

      <div className="detect-scroll-list">
      {detections.length === 0 && (
         <div style={{textAlign: 'center', padding: '40px', color: '#c7ddff'}}>
            No anomalies detected yet. Upload an image and run AI analysis.
         </div>
      )}
      {detections.map((item,index)=>(
        <div className="detect-item" key={index}>
          <div className="detect-top">
            <h3>{item.type}</h3>
            <div className="severity" style={{background:item.color}}>
              {item.severity}
            </div>
          </div>
          <div className="confidence-row">
            <span>Confidence</span>
            <span>{item.confidence}%</span>
          </div>
          <div className="progress">
            <div
              className="fill"
              style={{
                width: `${item.confidence}%`,
                background:item.color
              }}
            />
          </div>
        </div>
      ))}
      </div>

      {detections.length > 0 && (
          <div className="summary-card">
            <h3>📊 Detection Summary</h3>
            {detections.map((item, idx) => (
                <div className="summary-row" key={idx}>
                  <span>{item.type}</span>
                  <strong style={{color: item.color}}>{item.severity}</strong>
                </div>
            ))}
          </div>
      )}
    </div>
  );
}
