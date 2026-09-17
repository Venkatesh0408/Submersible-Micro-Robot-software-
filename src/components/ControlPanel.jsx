import { useState } from "react";
import { toast } from "./Toast";
import { confirmDialog } from "./ConfirmDialog";

import { useMission } from "../context/MissionContext";

import {
    startMission,
    pauseMission,
    resumeMission,
    stopMission,
    returnHome,
    captureImage,
    runAI
} from "../services/api";

import "../styles/ControlPanel.css";

export default function ControlPanel() {

    const [mode, setMode] = useState("manual");

    

    const {
        missionStarted,
        missionPaused,
        currentWaypoint,
        setCurrentWaypoint,
        setProgress,
        setMissionStatus,
        saveMissionToHistory,
        missionStatus: missionState,
        startMission: contextStartMission,
        stopMission: contextStopMission,
        pauseMission: contextPauseMission,
        resumeMission: contextResumeMission,
        returnHome: contextReturnHome
    } = useMission();
    
    const running = missionStarted;
    const paused = missionPaused;

    // ===========================================
    // START / STOP
    // ===========================================

    async function handleStartStop() {
        try {
            if (!running) {
                contextStartMission();
                startMission().catch(console.error);
                // Context handles the rest!
            } else {
                contextStopMission();
                stopMission().catch(console.error);
                // Context handles the rest!
            }
        } catch (err) {
            console.log(err);
        }
    }

    // ===========================================
    // PAUSE / RESUME
    // ===========================================

    async function handlePauseResume() {
        if (!running && currentWaypoint === 0) return; // Allow resuming if loaded from history
        try {
            if (!paused) {
                contextPauseMission();
                pauseMission().catch(console.error);
                // Context handles the rest
            } else {
                contextResumeMission();
                resumeMission().catch(console.error);
                // Context handles the rest
            }
        } catch (err) {
            console.log(err);
        }
    }

    // ===========================================
    // RETURN HOME
    // ===========================================

    async function handleReturn() {
        if (missionStarted) {
            const confirm1 = await confirmDialog({ title: "Return Home?", message: "Are you sure you want to return to the home position?", confirmText: "Yes, Return" });
            if (!confirm1) return;
            
            const confirm2 = await confirmDialog({ title: "Save Mission?", message: "Would you like to save your current progress to Mission History so you can resume it later?", confirmText: "Save & Return", cancelText: "Just Return" });
            if (confirm2) {
                saveMissionToHistory("uncompleted");
                toast.success("Mission saved as uncompleted.");
            }
        }
        
        try {
            contextReturnHome();
            returnHome().catch(console.error);
            setMissionState("RETURNING HOME");
            setMissionStatus("RETURNING HOME");
        }
        catch (err) {
            console.log(err);
        }
    }

    // ===========================================
    // IMAGE CAPTURE
    // ===========================================

    async function handleCapture() {

        try {

            const result = await captureImage();

            console.log(result);

            toast.success("Image captured successfully");

        }

        catch (err) {

            console.log(err);

        }

    }

    // ===========================================
    // AI SCAN
    // ===========================================

    async function handleAI() {

        try {

            const result = await runAI();

            console.log(result);

            toast.success("AI inspection completed");

        }

        catch (err) {

            console.log(err);

        }

    }

    // ===========================================
    // LIGHT
    // ===========================================

    function handleLight() {

        toast.info("Lights control — hardware coming soon");

    }

    // ===========================================
    // EMERGENCY
    // ===========================================

    async function handleEmergency() {

        try {

            await stopMission();

            setRunning(false);

            setPaused(false);

            setMissionState("EMERGENCY STOP");

            setMissionStatus("EMERGENCY");

            toast.error("Emergency stop activated");

        }

        catch (err) {

            console.log(err);

        }

    }

    return (

        <div className="control-card">

            <div className="control-header">

                <h2>🎮 Mission Control</h2>

                <span className="online-badge">

                    {missionState}

                </span>

            </div>

            <div className="mode-selector">

                <button

                    className={`mode-btn ${mode === "manual" ? "active" : ""}`}

                    onClick={() => setMode("manual")}

                >

                    🎮 Manual

                </button>

                <button

                    className={`mode-btn ${mode === "auto" ? "active" : ""}`}

                    onClick={() => setMode("auto")}

                >

                    🤖 Auto

                </button>

            </div>

            <div className="control-grid">

                <button

                    className="control-btn start"

                    onClick={handleStartStop}

                >

                    {running ? "⏹ STOP" : "▶ START"}

                </button>

                <button

                    className="control-btn pause"

                    disabled={!running}

                    onClick={handlePauseResume}

                >

                    {paused ? "▶ RESUME" : "⏸ PAUSE"}

                </button>

                <button

                    className="control-btn return"

                    onClick={handleReturn}

                >

                    🏠 RETURN

                </button>

                <button

                    className="control-btn capture"

                    onClick={handleCapture}

                >

                    📷 CAPTURE

                </button>

            </div>

            <div className="secondary-grid">

                <button

                    className="control-btn ai"

                    onClick={handleAI}

                >

                    🤖 AI SCAN

                </button>

                <button

                    className="control-btn light"

                    onClick={handleLight}

                >

                    💡 LIGHTS

                </button>

                <button

                    className="control-btn emergency"

                    onClick={handleEmergency}

                >

                    🚨 EMERGENCY

                </button>

            </div>

        </div>

    );

}