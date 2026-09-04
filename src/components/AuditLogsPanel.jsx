import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, Activity, Key, LogIn, Monitor } from "lucide-react";

function AuditLogsPanel() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
      async function fetchLogs() {
          try {
              const res = await fetch("/api/auth/audit-logs");
              if (!res.ok) return;
              const contentType = res.headers.get("content-type") || "";
              if (!contentType.includes("application/json")) return;
              const text = await res.text();
              if (!text || text.trim().startsWith("<")) return;
              const data = JSON.parse(text);
              if (data && data.success) {
                  setLogs(data.logs);
              }
          } catch(e) {
              console.error("AuditLogsPanel fetch error:", e);
          }
      }
      fetchLogs();
      const interval = setInterval(fetchLogs, 15000);
      return () => clearInterval(interval);
  }, []);

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
           <Key size={26} /> Biometric Audit Logs
         </h2>
         <div style={{
             padding: '5px 15px',
             borderRadius: '20px',
             background: 'rgba(18,211,224, 0.2)',
             color: '#22d3ee',
             fontWeight: 'bold',
             display: 'flex',
             alignItems: 'center',
             gap: '8px'
         }}>
            <Activity size={18} />
            {logs.length} RECORDS
         </div>
      </div>
      
      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '5px' }}>
         {logs.length > 0 ? (
             logs.map((log) => (
                 <div key={log.id} style={{ 
                     background: '#16203a', 
                     borderRadius: '12px', 
                     padding: '12px 16px', 
                     borderLeft: `4px solid ${log.success ? '#22c55e' : '#22d3ee'}`,
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center'
                 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                         <div style={{ 
                             background: log.success ? 'rgba(34,197,94,0.2)' : 'rgba(18,211,224,0.2)',
                             color: log.success ? '#22c55e' : '#22d3ee',
                             padding: '10px',
                             borderRadius: '50%'
                         }}>
                             {log.success ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                             <div style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                 <LogIn size={14} color="#22d3ee" /> 
                                 {log.note || (log.success ? "Authentication Granted" : "Authentication Denied")}
                             </div>
                             <div style={{ color: '#93a1bc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                 <Monitor size={12} /> {log.deviceId}
                             </div>
                             <div style={{ color: '#22d3ee', fontSize: '12px', opacity: 0.8 }}>
                                 {new Date(log.timestamp).toLocaleString()}
                             </div>
                         </div>
                     </div>
                     <div style={{ 
                         display: 'flex', 
                         flexDirection: 'column', 
                         alignItems: 'flex-end',
                         gap: '5px'
                     }}>
                         <div style={{ fontSize: '12px', color: '#93a1bc', textTransform: 'uppercase', letterSpacing: '1px' }}>Confidence</div>
                         <div style={{ 
                             fontSize: '20px', 
                             fontWeight: 'black', 
                             color: log.confidence >= 90 ? '#22c55e' : (log.confidence >= 70 ? '#ffd600' : '#22d3ee'),
                             fontFamily: '"Orbitron", sans-serif'
                         }}>
                             {log.confidence}%
                         </div>
                     </div>
                 </div>
             ))
         ) : (
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(18,211,224,0.05)', borderRadius: '16px', color: '#22d3ee', gap: '15px', padding: '40px' }}>
                <Key size={50} style={{ opacity: 0.5 }} />
                <h3 style={{ fontSize: '20px' }}>No Audit Logs</h3>
                <p style={{ color: '#93a1bc' }}>Biometric authentication attempts will appear here.</p>
             </div>
         )}
      </div>
    </div>
  );
}

export default AuditLogsPanel;
