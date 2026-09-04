import { useState } from "react";
import { toast } from "./Toast";

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

    const [running, setRunning] = useState(false);

    const [paused, setPaused] = useState(false);

    const [missionState, setMissionState] = useState("READY");

    const {

        setMissionStatus,

        setProgress,

        setCurrentWaypoint

    } = useMission();

    // ===========================================
    // START / STOP
    // ===========================================

    async function handleStartStop() {

        try {

            if (!running) {

                await startMission();

                setRunning(true);

                setPaused(false);

                setMissionState("MISSION RUNNING");

                setMissionStatus("RUNNING");

                setProgress(0);

                setCurrentWaypoint(0);

            }

            else {

                await stopMission();

                setRunning(false);

                setPaused(false);

                setMissionState("MISSION STOPPED");

                setMissionStatus("STOPPED");

                setProgress(100);

            }

        }

        catch (err) {

            console.log(err);

        }

    }

    // ===========================================
    // PAUSE / RESUME
    // ===========================================

    async function handlePauseResume() {

        if (!running) return;

        try {

            if (!paused) {

                await pauseMission();

                setPaused(true);

                setMissionState("MISSION PAUSED");

                setMissionStatus("PAUSED");

            }

            else {

                await resumeMission();

                setPaused(false);

                setMissionState("MISSION RUNNING");

                setMissionStatus("RUNNING");

            }

        }

        catch (err) {

            console.log(err);

        }

    }

    // ===========================================
    // RETURN HOME
    // ===========================================

    async function handleReturn() {

        try {

            await returnHome();

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