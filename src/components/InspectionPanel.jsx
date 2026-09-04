import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Activity, Target, Shield, Clock } from "lucide-react";
import { safeFetchJson } from "../services/api";

function InspectionPanel() {
  const [latestItem, setLatestItem] = useState(null);
  
  useEffect(() => {
      async function fetchLatest() {
          try {
              const data = await safeFetchJson("/api/analysis-history");
              if (data && Array.isArray(data) && data.length > 0) {
                  setLatestItem(data[0]);
              }
          } catch(e) {
              console.error("InspectionPanel fetch error:", e);
          }
      }
      fetchLatest();
      const interval = setInterval(fetchLatest, 10000);
      return () => clearInterval(interval);
  }, []);

  const condition = latestItem?.overallCondition || "GOOD";
  const isGood = condition === "GOOD";
  
  return (
    <div style={{
      background: "#0e1524",
      borderRadius: "22px",
      padding: "25px",
      boxShadow: "0 0 25px rgba(18,211,224,.2)",
      border: "1px solid rgba(18,211,224,.3)",
      margin: "0",
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
         <h2 style={{ color: "#22d3ee", fontSize: "24px", display: 'flex', alignItems: 'center', gap: '10px' }}>
           <Target size={26} /> AI Inspection Hub
         </h2>
         <div style={{ 
            padding: '5px 15px', 
            borderRadius: '20px', 
            background: latestItem ? (isGood ? 'rgba(34,197,94,0.2)' : 'rgba(18,211,224,0.2)') : 'rgba(18,211,224, 0.2)',
            color: latestItem ? (isGood ? '#22c55e' : '#22d3ee') : '#22d3ee',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
         }}>
            {latestItem ? (isGood ? <CheckCircle size={18} /> : <AlertTriangle size={18} />) : <Activity size={18} />}
            {latestItem ? condition : "MONITORING"}
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: latestItem ? '1fr 1.2fr' : '1fr', gap: '25px', alignItems: 'stretch' }}>
        {latestItem ? (
           <>
              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: `2px solid ${isGood ? '#22c55e' : '#22d3ee'}` }}>
                 <img src={latestItem.image} alt="Latest Inspection" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '180px' }} />
                 <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '10px', backdropFilter: 'blur(4px)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px'}}>
                        <Clock size={14} color="#22d3ee" /> 
                        {new Date(latestItem.timestamp).toLocaleTimeString()}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Acc: {latestItem.accuracy}%</div>
                 </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {latestItem.detections && latestItem.detections.length > 0 ? (
                     latestItem.detections.slice(0, 3).map((det, idx) => (
                         <div key={idx} style={{ background: '#16203a', borderRadius: '12px', padding: '12px', borderLeft: `4px solid ${det.color}` }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                 <strong style={{ color: det.color, fontSize: '16px' }}>{det.type}</strong>
                                 <span style={{ background: det.color, color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{det.severity}</span>
                             </div>
                             <p style={{ color: '#93a1bc', fontSize: '13px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                 {det.solutionEnglish}
                             </p>
                         </div>
                     ))
                 ) : (
                     <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.1)', borderRadius: '16px', color: '#22c55e', gap: '10px' }}>
                         <Shield size={40} />
                         <strong style={{ fontSize: '18px' }}>No Defects Detected</strong>
                         <p style={{ fontSize: '14px', color: '#93a1bc' }}>Structural integrity intact</p>
                     </div>
                 )}
              </div>
           </>
        ) : (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(18,211,224,0.05)', borderRadius: '16px', padding: '40px', color: '#22d3ee', gap: '15px' }}>
              <Activity size={50} style={{ animation: 'pulse 2s infinite' }} />
              <h3 style={{ fontSize: '20px' }}>Waiting for AI Analysis</h3>
              <p style={{ color: '#93a1bc' }}>Capture an image or upload one in the AI system to see latest results here.</p>
           </div>
        )}
      </div>
      <style>
          {`
              @keyframes pulse {
                  0% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.1); opacity: 0.7; }
                  100% { transform: scale(1); opacity: 1; }
              }
          `}
      </style>
    </div>
  );
}
export default InspectionPanel;
