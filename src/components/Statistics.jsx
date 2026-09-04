import { useEffect, useState } from "react";
import { BrainCircuit, Image as ImageIcon, AlertTriangle, Target, Zap, Activity } from "lucide-react";
import "../styles/Statistics.css";

export default function Statistics() {
  const [statsData, setStatsData] = useState({
     totalImages: 0,
     totalAnomalies: 0,
     avgAccuracy: 0,
     criticalIssues: 0,
     goodConditions: 0,
     needsAttention: 0
  });

  useEffect(() => {
     async function fetchHistory() {
         try {
             const res = await fetch("/api/analysis-history");
             if (!res.ok) return;
             const contentType = res.headers.get("content-type") || "";
             if (!contentType.includes("application/json")) return;
             const text = await res.text();
             if (!text || text.trim().startsWith("<")) return;
             const data = JSON.parse(text);
             
             if (data && Array.isArray(data) && data.length > 0) {
                 const totalImages = data.length;
                 const totalAnomalies = data.reduce((acc, curr) => acc + (curr.detections?.length || 0), 0);
                 const avgAcc = data.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / totalImages;
                 
                 const critical = data.filter(d => d.overallCondition === 'CRITICAL').length;
                 const good = data.filter(d => d.overallCondition === 'GOOD').length;
                 const attention = data.filter(d => d.overallCondition === 'NEEDS ATTENTION').length;

                 setStatsData({
                    totalImages,
                    totalAnomalies,
                    avgAccuracy: avgAcc.toFixed(1),
                    criticalIssues: critical,
                    goodConditions: good,
                    needsAttention: attention
                 });
             }
         } catch(e) {
             console.warn("AI stats fetch warning:", e?.message || e);
         }
     }
     
     fetchHistory();
     const interval = setInterval(fetchHistory, 15000);
     return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      title: "Images Analyzed",
      value: statsData.totalImages,
      icon: <ImageIcon size={26} />,
      color: "#22d3ee",
      bg: "rgba(18,211,224, 0.15)"
    },
    {
      title: "Anomalies Detected",
      value: statsData.totalAnomalies,
      icon: <BrainCircuit size={26} />,
      color: "#ff9800",
      bg: "rgba(255, 152, 0, 0.15)"
    },
    {
      title: "Avg Accuracy",
      value: `${statsData.avgAccuracy}%`,
      icon: <Target size={26} />,
      color: "#22d3ee",
      bg: "rgba(18,211,224, 0.15)"
    },
    {
      title: "Critical Issues",
      value: statsData.criticalIssues,
      icon: <AlertTriangle size={26} />,
      color: "#ff1744",
      bg: "rgba(255, 23, 68, 0.15)"
    },
    {
      title: "Healthy Scans",
      value: statsData.goodConditions,
      icon: <Activity size={26} />,
      color: "#22c55e",
      bg: "rgba(34, 197, 94, 0.15)"
    },
    {
      title: "Needs Attention",
      value: statsData.needsAttention,
      icon: <Zap size={26} />,
      color: "#ffb703",
      bg: "rgba(255, 183, 3, 0.15)"
    }
  ];

  return (
    <div className="statistics-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="statistics-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BrainCircuit color="#22d3ee" /> AI Analysis Statistics</h2>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(18,211,224,0.2)', color: '#22d3ee', padding: '6px 14px', borderRadius: '20px', fontSize: '13px' }}>
           <span className="live-dot" style={{width: '8px', height: '8px', background: '#22d3ee', borderRadius: '50%', display: 'inline-block'}}></span>
           LIVE SYNC
        </span>
      </div>
      <div className="statistics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', flex: 1 }}>
        {
          stats.map((item,index)=>(
            <div
              className="statistics-item"
              key={index}
              style={{ padding: '15px', background: '#16203a', border: '1px solid rgba(18,211,224,0.2)' }}
            >
              <div
                className="statistics-icon"
                style={{
                  background: item.bg,
                  color: item.color,
                  width: '50px',
                  height: '50px'
                }}
              >
                {item.icon}
              </div>
              <div>
                <div className="statistics-value" style={{ fontSize: '24px', marginBottom: '2px' }}>
                  {item.value}
                </div>
                <div className="statistics-title" style={{ fontSize: '13px', color: '#8fa5c7' }}>
                  {item.title}
                </div>
              </div>
            </div>
          ))
        }
      </div>
      <style>
         {`
            @keyframes blink {
               0% { opacity: 1; }
               50% { opacity: 0.3; }
               100% { opacity: 1; }
            }
            .live-dot {
               animation: blink 1.5s infinite ease-in-out;
            }
            .statistics-grid {
               display: grid;
               gap: 15px;
            }
            @media (max-width: 1024px) {
               .statistics-grid {
                  grid-template-columns: repeat(2, 1fr) !important;
               }
            }
            @media (max-width: 600px) {
               .statistics-grid {
                  grid-template-columns: 1fr !important;
               }
            }
         `}
      </style>
    </div>
  );
}
