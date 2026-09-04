import { useState } from "react";
import TopNav from "../components/TopNav";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import MapPanel from "../components/MapPanel";
import ControlPanel from "../components/ControlPanel";

import { useMission } from "../context/MissionContext";
import MapMissionStatus from "../components/MapMissionStatus";

import "../styles/RoutePlanner.css";

export default function RoutePlanner() {

    const navigate = useNavigate();

    const {

        waypoints,

        progress,

        robot,

        routeSaved,

        missionStarted,

        missionCompleted,

        startMission

    } = useMission();

    const [mission, setMission] = useState("Inspection 01");

    const [inspectionType, setInspectionType] = useState("Water Tank");

    const [priority, setPriority] = useState("High");

    return (

        <div className="route-page">
            <TopNav />

            <Header />

            {/* ================================= */}
            {/* BACK */}
            {/* ================================= */}

            <div className="page-toolbar">

                <button

                    className="back-btn"

                    onClick={() => navigate("/dashboard")}

                >

                    ← Back to Dashboard

                </button>

            </div>

            <div className="route-container">

                {/* ================================= */}
                {/* MAP */}
                {/* ================================= */}

                <div className="route-left">
                    <MapPanel />
                </div>
                <div className="route-right">
                    <MapMissionStatus />
                </div>

                

            </div>

        </div>

    );

}