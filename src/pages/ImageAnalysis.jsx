import { useState, useRef, useEffect } from "react";
import TopNav from "../components/TopNav";
import { useNavigate } from "react-router-dom";
import { useMission } from "../context/MissionContext";
import { toast } from "../components/Toast";
import Gallery from "../components/Gallery";
import Header from "../components/Header";
import DetectionPanel from "../components/DetectionPanel";
import MissionReportColumn from "../components/MissionReportColumn";
import Preview3D from "../components/Preview3D";
import "../styles/ImageAnalysis.css";

export default function ImageAnalysis() {
    const navigate = useNavigate();
    const { missionName, inspectionArea } = useMission();
    const fileInputRef = useRef(null);
    
    const [imageSource, setImageSource] = useState("https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=900");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [show3d, setShow3d] = useState(false);
    
    // Default stats before analysis
    const defaultStats = {
      objects: 0,
      accuracy: 0,
      condition: "UNKNOWN",
      detections: []
    };

    const stats = analysisData || defaultStats;

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;
                    const max_size = 1200;
                    if (width > max_size || height > max_size) {
                        if (width > height) {
                            height = Math.round((height * max_size) / width);
                            width = max_size;
                        } else {
                            width = Math.round((width * max_size) / height);
                            height = max_size;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
                    setImageSource(compressedDataUrl);
                    setAnalysisData(null);
                    runAnalysisWithImage(compressedDataUrl);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    
    const [history, setHistory] = useState([]);
    
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
            console.error("ImageAnalysis fetch history error:", e);
        }
    };
    
    const handleCaptureESP = async () => {
        try {
            const res = await fetch("/capture", { method: "POST" });
            if (!res.ok) {
                toast.error("ESP Cam capture failed (Server error " + res.status + ").");
                return;
            }
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                toast.error("ESP Cam capture endpoint unavailable.");
                return;
            }
            const text = await res.text();
            if (!text || text.trim().startsWith("<")) return;
            const data = JSON.parse(text);
            if (data.success && data.image) {
                setImageSource(data.image);
                setAnalysisData(null);
                await runAnalysisWithImage(data.image);
            }
        } catch (e) {
            console.error("Capture error", e);
            toast.error("Failed to capture image from ESP cam.");
        }
    };

    const runAnalysisWithImage = async (imgSrc) => {
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/analyze-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: imgSrc, missionName, inspectionArea })
            });
            if (!res.ok) {
                toast.error("Analysis failed with HTTP " + res.status);
                return;
            }
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                toast.error("Server returned non-JSON response.");
                return;
            }
            const text = await res.text();
            if (!text || text.trim().startsWith("<")) {
                toast.error("Server returned HTML response.");
                return;
            }
            const data = JSON.parse(text);
            
            if (data.success && data.data) {
                setAnalysisData({
                   objects: data.data.detections?.length || 0,
                   accuracy: data.data.accuracy || 95,
                   condition: data.data.overallCondition || "ANALYZED",
                   detections: data.data.detections || []
                });
                fetchHistory(); // Refresh history list
            } else {
                toast.error("Analysis failed: " + (data.message || "Unknown error"));
            }
        } catch (e) {
            console.error("Analysis error", e);
            toast.error("Failed to run AI analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const runAnalysis = () => runAnalysisWithImage(imageSource);
    
    const loadHistoryItem = (item) => {
        setImageSource(item.image);
        setAnalysisData({
           objects: item.detections?.length || 0,
           accuracy: item.accuracy || 95,
           condition: item.overallCondition || "ANALYZED",
           detections: item.detections || []
        });
    };
return (
        <div className="analysis-page">
            <TopNav />
            <Header />
            <div className="page-toolbar" style={{ margin: '20px' }}>
                <button 
                    className="back-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Back to Dashboard
                </button>
            </div>
            
            <div className="analysis-header">
                <h1>🤖 AI Image Inspection System</h1>
                <p>
                    Underwater Image Inspection & Artificial Intelligence Analysis
                </p>
                <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
                    <button className="start-mission" style={{width: 'auto', padding: '10px 20px'}} onClick={handleCaptureESP}>
                        📸 Capture ESP Cam
                    </button>
                    <button className="start-mission" style={{width: 'auto', padding: '10px 20px', background: 'linear-gradient(135deg, #22d3ee, #0a6b78)'}} onClick={handleUploadClick}>
                        📤 Upload Image
                    </button>
                    <button className="start-mission" style={{width: 'auto', padding: '10px 20px', background: 'linear-gradient(135deg, #22d3ee, #0a6b78)'}} onClick={() => navigate("/history")}>
                        🕒 View History
                    </button>
                    {/* Secondary/ghost — optional experimental visualization, clearly separated from detection results */}
                    <button
                        onClick={() => setShow3d(true)}
                        style={{ width: 'auto', padding: '10px 16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                        🧊 Generate 3D Preview
                        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--warning)', background: 'rgba(255,183,3,0.12)', border: '1px solid rgba(255,183,3,0.35)', padding: '2px 6px', borderRadius: '999px' }}>Experimental</span>
                    </button>
                    <input
                       type="file" 
                       ref={fileInputRef} 
                       style={{display: 'none'}} 
                       accept="image/*"
                       onChange={handleFileChange}
                    />
                </div>
            </div>

            {/* ================= IMAGE + AI ================= */}
            <div className="analysis-grid">
                <div className="analysis-left">
                    <div className="inspection-card">
                        <div className="inspection-header">
                            <h2>🖼 Image Inspection</h2>
                            <button 
                               className="start-mission" 
                               style={{width: 'auto', margin: 0, padding: '8px 16px', background: isAnalyzing ? 'gray' : 'linear-gradient(135deg, #f1a208, #facc15)'}}
                               onClick={runAnalysis}
                               disabled={isAnalyzing}
                            >
                                {isAnalyzing ? '⏳ ANALYZING...' : '✨ RUN AI ANALYSIS'}
                            </button>
                        </div>
                        <div className="inspection-image" style={{position: 'relative', overflow: 'hidden'}}>
                            <img
                                src={imageSource}
                                alt="Inspection"
                                style={{width: '100%', height: 'auto', borderRadius: '12px'}}
                            />
                            {isAnalyzing && (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', 
                                    justifyContent: 'center', flexDirection: 'column', color: '#22d3ee',
                                    borderRadius: '12px'
                                }}>
                                    <div className="spinner" style={{width: '50px', height: '50px', border: '4px solid #22d3ee', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                                    <style>{'@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }'}</style>
                                    <h3 style={{marginTop: '15px'}}>AI is Processing...</h3>
                                </div>
                            )}
                        </div>
                        
                        <div className="image-details">
                            <div className="detail-box">
                                <span>Mission ID</span>
                                <strong>{missionName || "MANUAL"}</strong>
                            </div>
                            <div className="detail-box">
                                <span>Source</span>
                                <strong>{inspectionArea || (imageSource.startsWith('data:') ? 'Uploaded' : 'ESP Stream')}</strong>
                            </div>
                            <div className="detail-box">
                                <span>AI Status</span>
                                <strong>{analysisData ? 'ANALYZED' : 'PENDING'}</strong>
                            </div>
                            <div className="detail-box">
                                <span>Time</span>
                                <strong>{new Date().toLocaleTimeString()}</strong>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="analysis-right">
                    <DetectionPanel data={stats} />
                </div>
            </div>

            {/* ================= REPORT ================= */}
            {analysisData && analysisData.detections.length > 0 && (
                <div className="report-section" style={{marginTop: '30px'}}>
                    <div className="report-card">
                        <h2>📋 AI Solutions Report (English & Kannada)</h2>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px'}}>
                            {analysisData.detections.map((det, idx) => (
                                <div key={idx} style={{background: 'rgba(34, 52, 77, 0.7)', backdropFilter: 'blur(5px)', padding: '20px', borderRadius: '12px', borderLeft: `4px solid ${det.color}`}}>
                                    <h3 style={{color: det.color, marginBottom: '10px'}}>{det.type} - Confidence: {det.confidence}%</h3>
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                                        <div>
                                            <h4 style={{color: '#c7ddff', marginBottom: '8px'}}>🇬🇧 English Solution:</h4>
                                            <p style={{color: 'white', lineHeight: '1.6'}}>{det.solutionEnglish}</p>
                                        </div>
                                        <div>
                                            <h4 style={{color: '#c7ddff', marginBottom: '8px'}}>🇮🇳 Kannada Solution (ಪರಿಹಾರ):</h4>
                                            <p style={{color: 'white', lineHeight: '1.6', fontSize: '1.1rem'}}>{det.solutionKannada}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MISSION REPORT COLUMN */}
            <div style={{ marginTop: '30px' }}>
                <MissionReportColumn />
            </div>

            {/* Optional experimental 3D preview (separate from detection results) */}
            <Preview3D open={show3d} image={imageSource} onClose={() => setShow3d(false)} />
        </div>
    );
}
