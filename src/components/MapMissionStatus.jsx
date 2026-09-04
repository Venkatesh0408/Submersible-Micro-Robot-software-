import { useMission } from "../context/MissionContext";
import { Compass, Navigation, Zap, Clock, ShieldCheck, CheckCircle2, PlayCircle, Hourglass } from "lucide-react";

export default function MapMissionStatus() {
    const {
        robot,
        waypoints,
        currentWaypoint,
        getWaypointSegments,
        activeThrusterTime,
        thrustersActive,
        targetBearing,
        missionStarted,
        missionCompleted
    } = useMission();

    const segments = getWaypointSegments();

    const totalDistanceMeters = segments.reduce((sum, s) => sum + s.distanceMeters, 0);
    const totalThrusterTimeSec = segments.reduce((sum, s) => sum + s.thrusterSec, 0);

    return (
        <div style={{
            background: 'linear-gradient(180deg, #0e1524 0%, #17070b 100%)',
            padding: '20px',
            borderRadius: '20px',
            border: '1px solid rgba(18,211,224, 0.3)',
            height: '100%',
            boxSizing: 'border-box',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(18,211,224, 0.2)', paddingBottom: '12px' }}>
                <div>
                    <h3 style={{ color: '#22d3ee', fontSize: '18px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '1.2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Navigation size={20} className="text-cyan-500 animate-pulse" />
                        Waypoint Distance & Hardware Control
                    </h3>
                    <p style={{ color: '#8296a8', fontSize: '11px', margin: '4px 0 0 0', letterSpacing: '0.5px' }}>
                        Auto-Turn Heading Alignment & Distance-Proportional Thruster Controller
                    </p>
                </div>
                <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    background: thrustersActive ? 'rgba(34, 197, 94, 0.2)' : missionStarted ? 'rgba(234, 179, 8, 0.2)' : 'rgba(18,211,224, 0.15)',
                    color: thrustersActive ? '#4ade80' : missionStarted ? '#fde047' : '#22d3ee',
                    border: `1px solid ${thrustersActive ? '#22c55e' : missionStarted ? '#eab308' : 'rgba(18,211,224, 0.4)'}`
                }}>
                    {thrustersActive ? '⚡ THRUSTERS RUNNING' : missionStarted ? '🔄 AUTOTURNING' : '⚪ IDLE / READY'}
                </span>
            </div>

            {/* Hardware Calibration Rule Banner */}
            <div style={{
                background: 'rgba(18,211,224, 0.08)',
                border: '1px border-dashed rgba(18,211,224, 0.35)',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <Zap size={18} className="text-yellow-400 shrink-0" />
                <div style={{ fontSize: '11px', color: '#f3d0d5', lineHeight: '1.4' }}>
                    <strong style={{ color: '#22d3ee' }}>Hardware Rule: </strong> 
                    Distance ratio is calibrated at <strong>5.0 Meters = 20.0 Seconds</strong> Thruster Motor Run Time (4.0s per meter). The robot automatically turns to the target bearing before firing thrusters.
                </div>
            </div>

            {/* Live Motor & Heading Status Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Heading Card */}
                <div style={{ background: '#16203a', padding: '14px', borderRadius: '14px', border: '1px solid rgba(18,211,224, 0.2)' }}>
                    <div style={{ color: '#93a1bc', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Compass size={14} className="text-cyan-400" /> Auto-Turn Heading
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', fontFamily: '"Orbitron", sans-serif' }}>
                        {robot.heading.toFixed(0)}°
                    </div>
                    <div style={{ fontSize: '10px', color: '#22d3ee', marginTop: '4px', fontWeight: 'bold' }}>
                        Target Bearing: {targetBearing}° | {getBearingCardinal(robot.heading)}
                    </div>
                </div>

                {/* Thruster Motor Card */}
                <div style={{ background: '#16203a', padding: '14px', borderRadius: '14px', border: '1px solid rgba(18,211,224, 0.2)' }}>
                    <div style={{ color: '#93a1bc', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} className="text-yellow-400" /> Thruster Motor Timer
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: thrustersActive ? '#4ade80' : '#22d3ee', fontFamily: '"Orbitron", sans-serif' }}>
                        {thrustersActive ? `${activeThrusterTime.toFixed(1)}s` : '0.0s'}
                    </div>
                    <div style={{ fontSize: '10px', color: thrustersActive ? '#4ade80' : '#888888', marginTop: '4px', fontWeight: 'bold' }}>
                        {thrustersActive ? 'FORWARD THRUSTERS @ PWM 1800' : 'THRUSTERS OFF / STANDBY'}
                    </div>
                </div>
            </div>

            {/* Waypoints Distance Breakdown Table */}
            <div style={{ background: '#0a1826', borderRadius: '14px', padding: '12px', border: '1px solid rgba(18,211,224, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid rgba(18,211,224, 0.15)' }}>
                    <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Waypoint Distance & Thruster Schedule
                    </span>
                    <span style={{ color: '#22d3ee', fontSize: '11px', fontWeight: 'bold' }}>
                        {waypoints.length} Waypoints Set
                    </span>
                </div>

                {segments.length === 0 ? (
                    <div style={{ textTransform: 'uppercase', padding: '24px', textAlign: 'center', color: '#888888', fontSize: '11px', letterSpacing: '1px' }}>
                        📍 Add waypoints on the map to calculate segment distances & thruster motor run times.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ color: '#93a1bc', borderBottom: '1px solid rgba(18,211,224, 0.2)', background: 'rgba(18,211,224, 0.05)' }}>
                                    <th style={{ padding: '8px' }}>Segment</th>
                                    <th style={{ padding: '8px' }}>Distance</th>
                                    <th style={{ padding: '8px' }}>Auto-Turn Angle</th>
                                    <th style={{ padding: '8px' }}>Thruster Time</th>
                                    <th style={{ padding: '8px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {segments.map((seg, i) => {
                                    const isCurrent = currentWaypoint === i && missionStarted;
                                    return (
                                        <tr key={i} style={{
                                            borderBottom: '1px solid rgba(18,211,224, 0.1)',
                                            background: isCurrent ? 'rgba(18,211,224, 0.15)' : 'transparent',
                                            transition: 'background 0.2s ease'
                                        }}>
                                            <td style={{ padding: '8px', color: '#ffffff', fontWeight: 'bold' }}>
                                                {seg.from} ➔ {seg.to}
                                            </td>
                                            <td style={{ padding: '8px', color: '#22d3ee', fontWeight: '900', fontFamily: '"Orbitron", sans-serif' }}>
                                                {seg.distanceMeters.toFixed(2)} m
                                            </td>
                                            <td style={{ padding: '8px', color: '#60a5fa', fontWeight: 'bold' }}>
                                                {seg.bearingDeg}° ({getBearingCardinal(seg.bearingDeg)})
                                            </td>
                                            <td style={{ padding: '8px', color: '#facc15', fontWeight: '900', fontFamily: '"Orbitron", sans-serif' }}>
                                                {seg.thrusterSec.toFixed(1)} s
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                {seg.status === 'COMPLETED' ? (
                                                    <span style={{ color: '#4ade80', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <CheckCircle2 size={12} /> Done
                                                    </span>
                                                ) : isCurrent ? (
                                                    <span style={{ color: '#facc15', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }} className="animate-pulse">
                                                        <PlayCircle size={12} /> Active
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#8296a8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Hourglass size={12} /> Pending
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Total Route Totals Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                <div style={{ background: '#16203a', padding: '10px', borderRadius: '10px', border: '1px solid rgba(18,211,224, 0.15)', textAlign: 'center' }}>
                    <div style={{ color: '#93a1bc', fontSize: '9px', textTransform: 'uppercase' }}>Total Route Distance</div>
                    <div style={{ color: '#22d3ee', fontSize: '15px', fontWeight: 'bold', fontFamily: '"Orbitron", sans-serif', marginTop: '2px' }}>
                        {totalDistanceMeters.toFixed(1)} m
                    </div>
                </div>
                <div style={{ background: '#16203a', padding: '10px', borderRadius: '10px', border: '1px solid rgba(18,211,224, 0.15)', textAlign: 'center' }}>
                    <div style={{ color: '#93a1bc', fontSize: '9px', textTransform: 'uppercase' }}>Total Thruster Time</div>
                    <div style={{ color: '#facc15', fontSize: '15px', fontWeight: 'bold', fontFamily: '"Orbitron", sans-serif', marginTop: '2px' }}>
                        {totalThrusterTimeSec.toFixed(1)} s
                    </div>
                </div>
                <div style={{ background: '#16203a', padding: '10px', borderRadius: '10px', border: '1px solid rgba(18,211,224, 0.15)', textAlign: 'center' }}>
                    <div style={{ color: '#93a1bc', fontSize: '9px', textTransform: 'uppercase' }}>Hardware Rate</div>
                    <div style={{ color: '#4ade80', fontSize: '15px', fontWeight: 'bold', fontFamily: '"Orbitron", sans-serif', marginTop: '2px' }}>
                        5m = 20s
                    </div>
                </div>
            </div>
        </div>
    );
}

function getBearingCardinal(deg) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(((deg % 360) / 45)) % 8;
    return directions[idx];
}

