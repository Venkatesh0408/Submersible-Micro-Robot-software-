import InteractiveMap from "./InteractiveMap";
import MissionToolbar from "./MissionToolbar";
import MissionAnalytics from "./MissionAnalytics";
import WaypointList from "./WaypointList";
import LiveMissionMonitor from "./LiveMissionMonitor";

import "../styles/map.css";

import { useMission } from "../context/MissionContext";

import { useState, useEffect } from "react";

const STANDARD_AREAS = ["Water Tank", "River", "Lake", "Pipeline", "Dam", "Wastewater Plant"];

export default function MapPanel() {
    const { missionName, setMissionName, inspectionArea, setInspectionArea, missionStarted } = useMission();
    const [isCustom, setIsCustom] = useState(false);

    useEffect(() => {
        if (!missionName) setMissionName("Mission 1");
        if (!inspectionArea) {
            setInspectionArea("Water Tank");
        } else if (!STANDARD_AREAS.includes(inspectionArea)) {
            setIsCustom(true);
        }
    }, [inspectionArea]);

    return (

        <div className="map-card">

            <div className="map-header" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '10px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                    <h2>🛰 Mission Planner</h2>
                    <span className="map-status">LIVE GPS</span>
                </div>
                <div style={{display: 'flex', gap: '12px', width: '100%', paddingBottom: '10px', flexWrap: 'wrap'}}>
                    <input 
                        type="text" 
                        placeholder="Mission Name (e.g. Mission 1)" 
                        value={missionName} 
                        onChange={(e) => setMissionName(e.target.value)}
                        disabled={missionStarted}
                        style={{flex: 1, minWidth: '140px', padding: '10px', borderRadius: '8px', border: '1px solid #22d3ee', background: '#16203a', color: 'white', outline: 'none'}}
                    />
                    <select 
                        value={isCustom ? "Custom" : (inspectionArea || "")} 
                        onChange={(e) => {
                            if (e.target.value === "Custom") {
                                setIsCustom(true);
                                if (STANDARD_AREAS.includes(inspectionArea)) {
                                    setInspectionArea("Custom Location");
                                }
                            } else {
                                setIsCustom(false);
                                setInspectionArea(e.target.value);
                            }
                        }}
                        disabled={missionStarted}
                        style={{flex: 1, minWidth: '140px', padding: '10px', borderRadius: '8px', border: '1px solid #22d3ee', background: '#16203a', color: 'white', outline: 'none'}}
                    >
                        <option value="">Select Inspection Area</option>
                        <option value="Water Tank">Water Tank</option>
                        <option value="River">River</option>
                        <option value="Lake">Lake</option>
                        <option value="Pipeline">Pipeline</option>
                        <option value="Dam">Dam</option>
                        <option value="Wastewater Plant">Wastewater Plant</option>
                        <option value="Custom">Custom Location...</option>
                    </select>

                    {isCustom && (
                        <input 
                            type="text" 
                            placeholder="Enter Custom Location Name" 
                            value={inspectionArea} 
                            onChange={(e) => setInspectionArea(e.target.value)}
                            disabled={missionStarted}
                            style={{flex: 1, minWidth: '160px', padding: '10px', borderRadius: '8px', border: '1px solid #22d3ee', background: '#16203a', color: 'white', outline: 'none'}}
                        />
                    )}
                </div>
            </div>

            <InteractiveMap />

            <MissionToolbar />

        </div>

    );

}