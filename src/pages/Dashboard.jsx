import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
import Header from "../components/Header";
import MissionStatus from "../components/MissionStatus";
import MissionToolbar from "../components/MissionToolbar";
import CameraPanel from "../components/CameraPanel";
import SensorCard from "../components/SensorCard";
import InspectionPanel from "../components/InspectionPanel";
import MissionReportColumn from "../components/MissionReportColumn";
import HealthPanel from "../components/HealthPanel";
import { getSensorData } from "../services/api";

export default function Dashboard() {
    const navigate = useNavigate();
    const [sensors, setSensors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let inFlight = null; // AbortController of the current poll

        async function loadData() {
            // Cancel any previous poll so a slow request can't stack or land late.
            if (inFlight) inFlight.abort();
            const controller = new AbortController();
            inFlight = controller;
            const data = await getSensorData({ signal: controller.signal });
            if (controller.signal.aborted) return; // superseded by a newer poll
            setSensors(Array.isArray(data) ? data : []);
            setLoading(false);
        }

        loadData();
        // Only poll while the tab is visible — no wasted CPU/battery when hidden.
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') loadData();
        }, 10000);
        const onVisibility = () => {
            if (document.visibilityState === 'visible') loadData();
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisibility);
            if (inFlight) inFlight.abort();
        };
    }, []);

    return (
        <div className="dashboard">
            <TopNav />
            
            <Header />
            {/* TOP 3-COMPONENT MAIN GRID: CAMERA 60% (LEFT) | MISSION STATUS + TOOLBAR 40% (RIGHT) */}
            <div className="main-hero-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
                gap: '16px',
                marginBottom: '16px',
                alignItems: 'start'
            }}>
                {/* 60% VIDEO FEED */}
                <div style={{ minWidth: 0 }}>
                    <CameraPanel />
                </div>

                {/* 40% MISSION STATUS & CONTROLS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                    <MissionStatus />
                    <MissionToolbar />
                </div>
            </div>

            <div className="three-panels" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <InspectionPanel />
                
                {/* MISSION REPORT COMPACT CARD */}
                <MissionReportColumn />

                {/* GPS CARD */}
                <div
                    className="system-card"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    onClick={() => navigate("/route-planner")}
                >
                    <div className="system-icon">
                        🛰
                    </div>
                    <h2>
                        GPS Mission Planner
                    </h2>
                    <p>
                        Create autonomous routes, add waypoints, edit routes, simulate robot movement.
                    </p>
                    <div className="system-info">
                        <span>Waypoints : 8</span>
                        <span>ETA : 18 min</span>
                    </div>
                    <button style={{ marginTop: 'auto' }}>
                        OPEN GPS SYSTEM →
                    </button>
                </div>

                {/* AI CARD */}
                <div
                    className="system-card"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    onClick={() => navigate("/image-analysis")}
                >
                    <div className="system-icon">
                        🤖
                    </div>
                    <h2>
                        AI Image Analysis
                    </h2>
                    <p>
                        Detect cracks, corrosion, algae, leakage, structural damage, and generate reports.
                    </p>
                    <div className="system-info">
                        <span>Objects : 12</span>
                        <span>Accuracy : 98.4%</span>
                    </div>
                    <button style={{ marginTop: 'auto' }}>
                        OPEN AI SYSTEM →
                    </button>
                </div>
            </div>
            {/* SENSOR CARDS */}
            {loading ? (
                <div className="sensor-section" aria-busy="true">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="sensor-card sensor-card--skeleton" />
                    ))}
                </div>
            ) : sensors.length === 0 ? (
                <div className="sensor-empty">
                    <Activity size={20} />
                    <span>No sensor data available yet.</span>
                </div>
            ) : (
                <div className="sensor-section">
                    {sensors.map((s, index) => (
                        <SensorCard
                            key={s.name ?? index}
                            title={s.name}
                            value={s.value}
                            unit={s.unit}
                            status={s.status}
                            error={s.error}
                            solution={s.solution}
                        />
                    ))}
                </div>
            )}
            <HealthPanel />
        </div>
    );
}
