import { useState, useEffect } from "react";
import TopNav from "../components/TopNav";
import { useNavigate } from "react-router-dom";
import { generateInspectionReport } from "../utils/pdfGenerator";
import { confirmDialog } from "../components/ConfirmDialog";
import Header from "../components/Header";
import "../styles/History.css";

export default function History() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/analysis-history");
            if (!res.ok) return;
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) return;
            const text = await res.text();
            if (!text || text.trim().startsWith("<")) return;
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
                setHistory(data);
            }
        } catch(e) {
            console.error("History fetch error:", e);
        }
    };

    return (
        <div className="history-page">
            <TopNav />
            <Header />
            <div className="page-toolbar" style={{ margin: '20px' }}>
                <button 
                    className="back-btn"
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>
            </div>
            
            <div className="history-header">
                <h1>📁 Analysis History</h1>
                <p>Review past underwater inspections and AI reports</p>
            </div>

            <div className="history-grid">
                {history.length === 0 ? (
                    <div style={{color: '#c7ddff', fontSize: '1.2rem', padding: '20px'}}>No history found. Run AI analysis or Mission Report to save reports here.</div>
                ) : (
                    history.map((item) => (
                        <div key={item.id} className="history-file-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div onClick={() => setSelectedItem(item)} style={{ cursor: 'pointer' }}>
                                <div className="gallery-thumbnail">
                                    <img src={item.image} alt={item.missionName || "Inspection"} />
                                    <span style={{
                                        position: 'absolute',
                                        top: 8,
                                        left: 8,
                                        background: 'rgba(18,211,224, 0.9)',
                                        color: '#ffffff',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        padding: '2px 8px',
                                        borderRadius: '12px'
                                    }}>
                                        📁 {item.inspectionArea || "Location"}
                                    </span>
                                </div>
                                <div className="file-details" style={{ padding: '12px' }}>
                                    <div className="file-name" style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '14px' }}>
                                        {item.missionName || "Mission Inspection"}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold', margin: '4px 0' }}>
                                        Location: {item.inspectionArea || "Lake"}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#8296a8', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        📍 {item.address || "Subsurface Mission Area"}
                                    </div>
                                    <div className="file-date" style={{ fontSize: '10.5px', color: '#8090a0' }}>
                                        {new Date(item.timestamp).toLocaleString()}
                                    </div>
                                    <div className="file-status" style={{ color: item.overallCondition === 'GOOD' ? '#00e676' : (item.overallCondition === 'CRITICAL' ? '#ff1744' : '#ff9800'), fontWeight: 'bold', fontSize: '11px', marginTop: '4px' }}>
                                        Condition: {item.overallCondition || 'UNKNOWN'}
                                    </div>
                                </div>
                            </div>

                            {/* Direct Action Buttons on Card */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '0 12px 12px 12px' }}>
                                <button
                                    onClick={() => setSelectedItem(item)}
                                    style={{ background: '#1e090d', color: '#ffffff', border: '1px solid rgba(18,211,224,0.4)', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    👁️ View
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        generateInspectionReport(item);
                                    }}
                                    style={{ background: '#22d3ee', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    📄 PDF
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedItem && (
                <div className="history-modal" onClick={() => setSelectedItem(null)}>
                    <div className="history-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedItem(null)}>✕</button>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingRight: '40px'}}>
        <h2 style={{color: 'white', margin: 0}}>Inspection Details - {selectedItem.missionName} ({selectedItem.inspectionArea})</h2>
        <div style={{display: 'flex', gap: '15px'}}>
            <button 
                onClick={() => generateInspectionReport(selectedItem)}
                style={{ background: '#22d3ee', color: '#ffffff', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
                📄 Download PDF
            </button>
            <button 
                onClick={async () => {
                    const ok = await confirmDialog({
                        title: 'Delete inspection?',
                        message: 'This inspection record will be permanently removed. This action cannot be undone.',
                        confirmText: 'Delete',
                        tone: 'danger',
                    });
                    if(ok) {
                        await fetch('/api/analysis-history/' + selectedItem.id, { method: 'DELETE' });
                        setSelectedItem(null);
                        fetchHistory();
                    }
                }}
                style={{ background: '#ff1744', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
                🗑️ Delete
            </button>
        </div>
    </div>
                        <div className="modal-body">
                            <div className="modal-left">
                                <img src={selectedItem.image} alt="Inspection" />
                            </div>
                            <div className="modal-right">
                                <h3>AI Solutions Report</h3>
                                <div className="modal-scroll">
                                    {selectedItem.detections?.length > 0 ? (
                                        selectedItem.detections.map((det, idx) => (
                                            <div key={idx} style={{background: '#22344d', padding: '20px', borderRadius: '12px', borderLeft: `4px solid ${det.color}`, marginBottom: '15px'}}>
                                                <h4 style={{color: det.color, marginBottom: '12px', fontSize: '1.2rem'}}>{det.type} - Confidence: {det.confidence}%</h4>
                                                <div style={{marginBottom: '15px'}}>
                                                    <strong style={{color: '#c7ddff', display: 'block', marginBottom: '5px'}}>🇬🇧 English Solution:</strong>
                                                    <p style={{color: 'white', fontSize: '15px', lineHeight: '1.5'}}>{det.solutionEnglish}</p>
                                                </div>
                                                <div>
                                                    <strong style={{color: '#c7ddff', display: 'block', marginBottom: '5px'}}>🇮🇳 Kannada Solution (ಪರಿಹಾರ):</strong>
                                                    <p style={{color: 'white', fontSize: '15px', lineHeight: '1.5'}}>{det.solutionKannada}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{color: '#c7ddff', fontSize: '1.2rem', background: '#22344d', padding: '20px', borderRadius: '12px'}}>
                                            No anomalies detected in this image.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
