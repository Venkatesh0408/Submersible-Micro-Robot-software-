import { useState, useRef, useEffect, useCallback } from "react";
import { useMission } from "../context/MissionContext";
import { toast } from "./Toast";
import { captureImage } from "../services/api";

export default function MissionToolbar() {
    const [mode, setMode] = useState("auto");

    const {
        robot,
        routeSaved,
        waypoints,
        progress,
        remainingDistance,
        missionTime,
        waypointTime,
        missionStarted,
        missionPaused,
        missionCompleted,
        saveRoute,
        startMission,
        pauseMission,
        resumeMission,
        stopMission,
        emergencyStop,
        returnHome,
        manualMove,
        setHome
    } = useMission();

    function startHandler() { startMission(); }
    function pauseHandler() { missionPaused ? resumeMission() : pauseMission(); }
    function stopHandler() { stopMission(); }
    function homeHandler() { returnHome(); }
    function saveHandler() { saveRoute(); }

    async function handleCapture() {
        toast.success("Image captured", { title: "Camera" });
        try { await captureImage(); } catch { /* demo mode: no hardware attached */ }
    }
    function handleLight() { toast.info("Lights toggled"); }
    function handleEmergency() { emergencyStop(); toast.error("Emergency stop activated"); }
    const moveIntervalRef = useRef(null);

    const startMoving = useCallback((dir) => {
        if (moveIntervalRef.current) return;
        manualMove(dir);
        moveIntervalRef.current = setInterval(() => {
            manualMove(dir);
        }, 100);
    }, [manualMove]);

    const stopMoving = useCallback(() => {
        if (moveIntervalRef.current) {
            clearInterval(moveIntervalRef.current);
            moveIntervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (mode !== "manual") {
            stopMoving();
            return;
        }

        const handleKeyDown = (e) => {
            if (e.repeat) return; // Prevent continuous trigger from OS
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    startMoving('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    startMoving('down');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    startMoving('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    startMoving('right');
                    break;
            }
        };

        const handleKeyUp = (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                case 'ArrowDown':
                case 's':
                case 'S':
                case 'ArrowLeft':
                case 'a':
                case 'A':
                case 'ArrowRight':
                case 'd':
                case 'D':
                    stopMoving();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            stopMoving();
        };
    }, [mode, startMoving, stopMoving]);

    return (
        <div className="mission-toolbar">
            <div className="mode-selector" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    className={`mode-btn ${mode === "auto" ? "active" : ""}`}
                    onClick={() => setMode("auto")}
                    style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', background: mode === 'auto' ? 'linear-gradient(135deg, #22d3ee, #7fe9f0)' : '#16203a', color: '#fff' }}
                >
                    🤖 AUTO MODE
                </button>
                <button
                    className={`mode-btn ${mode === "manual" ? "active" : ""}`}
                    onClick={() => setMode("manual")}
                    style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', background: mode === 'manual' ? 'linear-gradient(135deg, #f1a208, #facc15)' : '#16203a', color: '#fff' }}
                >
                    🕹 MANUAL MODE
                </button>
            </div>

            {mode === "auto" ? (
                <div className="toolbar-buttons">
                    <button className="save-btn" onClick={saveHandler}>💾 SAVE</button>
                    <button className={missionStarted ? "stop-btn" : "start-btn"} onClick={missionStarted ? stopHandler : startHandler}>{missionStarted ? "⏹ STOP" : "▶ START"}</button>
                    <button className="pause-btn" onClick={pauseHandler} disabled={!missionStarted} style={{ opacity: missionStarted ? 1 : 0.5 }}>{missionPaused ? "▶ RESUME" : "⏸ PAUSE"}</button>
                    <button className="home-btn" onClick={homeHandler}>🏠 RETURN</button>
                    <button className="capture-btn" style={{ background: 'linear-gradient(135deg, #22d3ee, #0a6b78)', color: 'white' }} onClick={handleCapture}>📸 CAPTURE</button>
                </div>
            ) : (
                <div className="manual-controls" style={{ display: 'flex', gap: '20px', background: 'linear-gradient(145deg, #16203a, #0e1524)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(18, 211, 224, 0.25)' }}>
                    <div className="d-pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: '10px', margin: '0 auto' }}>
                        <div></div>
                        <button style={dPadBtn} onPointerDown={() => startMoving('up')} onPointerUp={stopMoving} onPointerLeave={stopMoving}>▲</button>
                        <div></div>
                        <button style={dPadBtn} onPointerDown={() => startMoving('left')} onPointerUp={stopMoving} onPointerLeave={stopMoving}>◀</button>
                        <button style={dPadBtn} onPointerDown={() => startMoving('down')} onPointerUp={stopMoving} onPointerLeave={stopMoving}>▼</button>
                        <button style={dPadBtn} onPointerDown={() => startMoving('right')} onPointerUp={stopMoving} onPointerLeave={stopMoving}>▶</button>
                    </div>
                    <div className="manual-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                        <div style={{display: 'flex', gap: '10px'}}>
                             <button style={{...actionBtn('#22d3ee'), flex: 1}} onClick={handleCapture}>📸 CAPTURE</button>

                        </div>
                        <div style={{display: 'flex', gap: '10px'}}>
                             <button 
                                 style={{...actionBtn(missionStarted ? '#22d3ee' : '#22c55e'), flex: 1, color: 'white'}} 
                                 onClick={missionStarted ? stopHandler : startHandler}
                             >
                                 {missionStarted ? '⏹ STOP' : '▶ START'}
                             </button>
                             <button 
                                 style={{...actionBtn(missionPaused ? '#22d3ee' : '#facc15'), flex: 1, color: '#ffffff', opacity: missionStarted ? 1 : 0.5}} 
                                 onClick={pauseHandler}
                                 disabled={!missionStarted}
                             >
                                 {missionPaused ? '▶ RESUME' : '⏸ PAUSE'}
                             </button>
                        </div>
                        <div style={{display: 'flex', gap: '10px'}}>
                             <button style={{...actionBtn('#fcd34d'), flex: 1, color: '#081223'}} onClick={homeHandler}>🏠 RETURN</button>
                             <button style={{...actionBtn('#ff0000'), flex: 1}} onClick={handleEmergency}>🚨 EMERGENCY</button>
                        </div>
                    </div>
                </div>
            )}

            </div>
    );
}

const dPadBtn = {
    background: 'linear-gradient(135deg, #22344d, #1a283b)',
    border: '1px solid rgba(0, 217, 255, 0.2)',
    borderRadius: '12px',
    color: '#00d9ff',
    fontSize: '24px',
    height: '60px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
    transition: '0.2s'
};

const actionBtn = (color) => ({
    background: `linear-gradient(135deg, ${color}, ${color}aa)`,
    color: 'white',
    border: 'none',
    padding: '15px',
    borderRadius: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: `0 4px 10px ${color}44`
});
