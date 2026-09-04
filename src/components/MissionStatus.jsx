import { useState } from "react";
import { useMission } from "../context/MissionContext";
import { Calculator, Navigation, Zap, Compass, Clock, CheckCircle2, PlayCircle, Hourglass } from "lucide-react";

export default function MissionStatus() {
    const {
        robot,
        waypoints,
        currentWaypoint,
        getWaypointSegments,
        activeThrusterTime,
        thrustersActive,
        targetBearing,
        missionStarted,
        calculateHaversineDistance,
        calculateBearingAngle,
        calculateThrusterTimeSeconds
    } = useMission();

    const segments = getWaypointSegments();
    const totalDistanceMeters = segments.reduce((sum, s) => sum + s.distanceMeters, 0);
    const totalThrusterTimeSec = segments.reduce((sum, s) => sum + s.thrusterSec, 0);

    // Manual Distance Calculator State
    const [calcDistanceMeters, setCalcDistanceMeters] = useState(5.0);
    const [lat1, setLat1] = useState(12.8912);
    const [lng1, setLng1] = useState(77.4983);
    const [lat2, setLat2] = useState(12.8916);
    const [lng2, setLng2] = useState(77.4988);
    const [calcMode, setCalcMode] = useState("preset"); // "preset" | "gps"
    const [activeTab, setActiveTab] = useState("auto"); // "auto" | "manual"

    // Calculated values for manual lat/lng GPS mode
    const computedGpsDistance = calculateHaversineDistance({ lat: Number(lat1), lng: Number(lng1) }, { lat: Number(lat2), lng: Number(lng2) });
    const computedBearing = calculateBearingAngle({ lat: Number(lat1), lng: Number(lng1) }, { lat: Number(lat2), lng: Number(lng2) });
    const effectiveDistance = calcMode === "gps" ? computedGpsDistance : calcDistanceMeters;
    const computedThrusterSec = calculateThrusterTimeSeconds(effectiveDistance);

    return (
        <div className="mission-status" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 10px', background: '#0a1826', border: '1px solid rgba(18,211,224, 0.25)', borderRadius: '10px', marginBottom: '12px' }}>
            {/* Header & View Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🤖 Submersible Robot Telemetry
                    </span>
                    <span style={{ fontSize: '9px', background: 'rgba(18,211,224,0.15)', color: '#22d3ee', border: '1px solid rgba(18,211,224,0.3)', padding: '1px 6px', borderRadius: '8px', fontWeight: 'bold' }}>
                        {robot.status}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setActiveTab("auto")}
                        style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(18,211,224, 0.3)',
                            background: activeTab === "auto" ? '#22d3ee' : 'rgba(18,211,224, 0.08)',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                        }}
                    >
                        <Navigation size={10} /> Schedule
                    </button>
                    <button
                        onClick={() => setActiveTab("manual")}
                        style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(18,211,224, 0.3)',
                            background: activeTab === "manual" ? '#22d3ee' : 'rgba(18,211,224, 0.08)',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                        }}
                    >
                        <Calculator size={10} /> Calculator
                    </button>
                </div>
            </div>

            {/* Compact Top Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '4px', alignItems: 'center' }}>
                <div style={{ background: '#07101a', padding: '4px 8px', borderRadius: '5px', border: '1px solid rgba(18,211,224,0.15)' }}>
                    <div style={{ color: '#8296a8', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Battery</div>
                    <div style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>{robot.battery.toFixed(1)}%</div>
                </div>
                <div style={{ background: '#07101a', padding: '4px 8px', borderRadius: '5px', border: '1px solid rgba(18,211,224,0.15)' }}>
                    <div style={{ color: '#8296a8', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Signal</div>
                    <div style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>{robot.signal.toFixed(1)}%</div>
                </div>
                <div style={{ background: '#07101a', padding: '4px 8px', borderRadius: '5px', border: '1px solid rgba(18,211,224,0.15)' }}>
                    <div style={{ color: '#8296a8', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Heading</div>
                    <div style={{ color: '#60a5fa', fontSize: '11px', fontWeight: 'bold' }}>{robot.heading.toFixed(0)}° ({getBearingCardinal(robot.heading)})</div>
                </div>
                <div style={{ background: '#07101a', padding: '4px 8px', borderRadius: '5px', border: '1px solid rgba(18,211,224,0.15)' }}>
                    <div style={{ color: '#8296a8', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Thruster Timer</div>
                    <div style={{ color: thrustersActive ? '#4ade80' : '#facc15', fontSize: '11px', fontWeight: 'bold' }}>
                        {thrustersActive ? `${activeThrusterTime.toFixed(1)}s` : '0.0s'}
                    </div>
                </div>
                <div style={{ background: '#07101a', padding: '4px 8px', borderRadius: '5px', border: '1px solid rgba(18,211,224,0.15)' }}>
                    <div style={{ color: '#8296a8', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Calibration</div>
                    <div style={{ color: '#22d3ee', fontSize: '11px', fontWeight: 'bold' }}>5m = 20s</div>
                </div>
            </div>

            {/* TAB 1: Compact Waypoint Schedule */}
            {activeTab === "auto" && (
                <div style={{ background: '#07101a', borderRadius: '8px', padding: '8px', border: '1px solid rgba(18,211,224, 0.15)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#93a1bc', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Navigation size={12} className="text-cyan-500" /> Waypoint Distance & Thruster Schedule
                        </span>
                        <span style={{ color: '#22d3ee', fontSize: '10px', fontWeight: 'bold' }}>
                            {waypoints.length} Waypoints
                        </span>
                    </div>

                    {segments.length === 0 ? (
                        <div style={{ padding: '10px', textAlign: 'center', color: '#888888', fontSize: '10px' }}>
                            📍 Add waypoints on map to compute distances & thruster times.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', maxHeight: '140px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ color: '#8296a8', borderBottom: '1px solid rgba(18,211,224, 0.2)' }}>
                                        <th style={{ padding: '4px 6px' }}>Segment</th>
                                        <th style={{ padding: '4px 6px' }}>Distance</th>
                                        <th style={{ padding: '4px 6px' }}>Angle</th>
                                        <th style={{ padding: '4px 6px' }}>Thruster</th>
                                        <th style={{ padding: '4px 6px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {segments.map((seg, i) => {
                                        const isCurrent = currentWaypoint === i && missionStarted;
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(18,211,224,0.08)', background: isCurrent ? 'rgba(18,211,224, 0.12)' : 'transparent' }}>
                                                <td style={{ padding: '4px 6px', color: '#ffffff', fontWeight: 'bold' }}>{seg.from} ➔ {seg.to}</td>
                                                <td style={{ padding: '4px 6px', color: '#22d3ee', fontWeight: 'bold' }}>{seg.distanceMeters.toFixed(1)} m</td>
                                                <td style={{ padding: '4px 6px', color: '#60a5fa' }}>{seg.bearingDeg}°</td>
                                                <td style={{ padding: '4px 6px', color: '#facc15', fontWeight: 'bold' }}>{seg.thrusterSec.toFixed(1)} s</td>
                                                <td style={{ padding: '4px 6px' }}>
                                                    {seg.status === 'COMPLETED' ? (
                                                        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✓ Done</span>
                                                    ) : isCurrent ? (
                                                        <span style={{ color: '#facc15', fontWeight: 'bold' }} className="animate-pulse">▶ Active</span>
                                                    ) : (
                                                        <span style={{ color: '#888' }}>Pending</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8296a8', paddingTop: '4px', borderTop: '1px solid rgba(18,211,224,0.1)' }}>
                        <span>Total Dist: <strong style={{ color: '#22d3ee' }}>{totalDistanceMeters.toFixed(1)} m</strong></span>
                        <span>Total Thruster: <strong style={{ color: '#facc15' }}>{totalThrusterTimeSec.toFixed(1)} s</strong></span>
                        <span>Rate: <strong style={{ color: '#4ade80' }}>5m = 20s (4.0s/m)</strong></span>
                    </div>
                </div>
            )}

            {/* TAB 2: Compact Distance Calculator */}
            {activeTab === "manual" && (
                <div style={{ background: '#07101a', borderRadius: '8px', padding: '10px', border: '1px solid rgba(18,211,224, 0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#93a1bc', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calculator size={12} className="text-cyan-500" /> Distance & Thruster Calculator
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={() => setCalcMode("preset")}
                                style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(18,211,224, 0.3)', background: calcMode === "preset" ? '#22d3ee' : 'transparent', color: '#fff', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Preset
                            </button>
                            <button
                                onClick={() => setCalcMode("gps")}
                                style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(18,211,224, 0.3)', background: calcMode === "gps" ? '#22d3ee' : 'transparent', color: '#fff', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                GPS
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <label style={{ fontSize: '9px', color: '#8296a8' }}>Distance (Meters)</label>
                            <input
                                type="number"
                                value={calcDistanceMeters}
                                onChange={(e) => { setCalcDistanceMeters(Math.max(0, parseFloat(e.target.value) || 0)); setCalcMode("preset"); }}
                                style={{ background: '#0a1826', border: '1px solid rgba(18,211,224, 0.3)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <label style={{ fontSize: '9px', color: '#8296a8' }}>Point A (Lat / Lng)</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <input type="number" step="0.0001" value={lat1} onChange={(e) => { setLat1(e.target.value); setCalcMode("gps"); }} style={{ width: '50%', background: '#0a1826', border: '1px solid rgba(18,211,224,0.2)', color: '#fff', padding: '3px', borderRadius: '4px', fontSize: '10px' }} />
                                <input type="number" step="0.0001" value={lng1} onChange={(e) => { setLng1(e.target.value); setCalcMode("gps"); }} style={{ width: '50%', background: '#0a1826', border: '1px solid rgba(18,211,224,0.2)', color: '#fff', padding: '3px', borderRadius: '4px', fontSize: '10px' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <label style={{ fontSize: '9px', color: '#8296a8' }}>Point B (Lat / Lng)</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <input type="number" step="0.0001" value={lat2} onChange={(e) => { setLat2(e.target.value); setCalcMode("gps"); }} style={{ width: '50%', background: '#0a1826', border: '1px solid rgba(18,211,224,0.2)', color: '#fff', padding: '3px', borderRadius: '4px', fontSize: '10px' }} />
                                <input type="number" step="0.0001" value={lng2} onChange={(e) => { setLng2(e.target.value); setCalcMode("gps"); }} style={{ width: '50%', background: '#0a1826', border: '1px solid rgba(18,211,224,0.2)', color: '#fff', padding: '3px', borderRadius: '4px', fontSize: '10px' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: '#0a1826', padding: '6px', borderRadius: '6px', border: '1px solid rgba(18,211,224,0.1)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#8296a8', fontSize: '8px', textTransform: 'uppercase' }}>Distance</div>
                            <div style={{ color: '#22d3ee', fontSize: '13px', fontWeight: 'bold' }}>{effectiveDistance.toFixed(2)} m</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#8296a8', fontSize: '8px', textTransform: 'uppercase' }}>Thruster Time</div>
                            <div style={{ color: '#facc15', fontSize: '13px', fontWeight: 'bold' }}>{computedThrusterSec.toFixed(1)} s</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#8296a8', fontSize: '8px', textTransform: 'uppercase' }}>Bearing</div>
                            <div style={{ color: '#60a5fa', fontSize: '13px', fontWeight: 'bold' }}>{calcMode === "gps" ? `${computedBearing}°` : `${targetBearing}°`}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function getBearingCardinal(deg) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(((deg % 360) / 45)) % 8;
    return directions[idx];
}


