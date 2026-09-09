import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    CircleMarker,
    useMapEvents,
    useMap
} from "react-leaflet";

import { useEffect, useState } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import { useMission } from "../context/MissionContext";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"

});

// =============================================
// homePosition ICON
// =============================================

const homeIcon = new L.DivIcon({

    className: "",

    html: `

        <div
        style="
            font-size:34px;
            text-align:center;
        ">
            🏠
        </div>

    `,

    iconSize:[40,40]

});

// =============================================
// DYNAMIC ROBOT ICON WITH HEADING ROTATION
// =============================================

const createRobotIcon = (heading = 0, isThrusterActive = false) => new L.DivIcon({
    className: "",
    html: `
    <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        transform: rotate(${heading}deg);
        transition: transform 0.3s ease;
    ">
        <div style="
            width:46px;
            height:46px;
            border-radius:50%;
            background:#0e1524;
            border:3px solid ${isThrusterActive ? '#4ade80' : '#22d3ee'};
            display:flex;
            justify-content:center;
            align-items:center;
            font-size:22px;
            box-shadow: 0 0 ${isThrusterActive ? '20px #4ade80' : '15px #22d3ee'};
            position: relative;
        ">
            <span style="display:inline-block; transform: rotate(-45deg);">🤿</span>
            <div style="
                position: absolute;
                top: -6px;
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-bottom: 8px solid ${isThrusterActive ? '#4ade80' : '#22d3ee'};
            "></div>
        </div>
    </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 30]
});

// =============================================
// DYNAMIC WAYPOINT ICON WITH NUMBER & HIGHLIGHT
// =============================================
const createWaypointIcon = (number, isCurrent) => new L.DivIcon({
    className: "",
    html: `
        <div style="
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: ${isCurrent ? '#facc15' : '#16203a'};
            border: 2px solid ${isCurrent ? '#ffffff' : '#00d9ff'};
            color: ${isCurrent ? '#000000' : '#ffffff'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: bold;
            box-shadow: 0 0 ${isCurrent ? '14px #facc15' : '8px #00d9ff'};
            cursor: pointer;
        ">
            ${number}
        </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

// =============================================
// =============================================
// MAP CLICK HANDLER (WAYPOINT / BOT / HOME)
// =============================================

function AddWaypoint({ mapClickMode, setMapClickMode }){
    const {
        addWaypoint,
        missionStarted,
        setBotLocation,
        setHome
    } = useMission();

    useMapEvents({
        click(e){
            if (missionStarted) return;
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            if (mapClickMode === "MOVE_BOT") {
                setBotLocation(lat, lng, true);
                setMapClickMode("WAYPOINT");
            } else if (mapClickMode === "SET_HOME") {
                setHome(lat, lng);
                setMapClickMode("WAYPOINT");
            } else {
                addWaypoint(lat, lng);
            }
        }
    });

    return null;
}

// =============================================
// MAIN MAP
// =============================================

function MapCenterController({ center, locateTrigger }) {
    const map = useMap();
    useEffect(() => {
        if (locateTrigger > 0) {
            map.setView(center, map.getZoom());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locateTrigger, map]);
    return null;
}

export default function InteractiveMap(){
   const [locateTrigger, setLocateTrigger] = useState(0);
   const [mapClickMode, setMapClickMode] = useState("WAYPOINT"); // "WAYPOINT" | "MOVE_BOT" | "SET_HOME"
   const [showManualGps, setShowManualGps] = useState(false);

   const {
    homePosition,
    robot,
    waypoints,
    progress,
    currentWaypoint,
    missionStarted,
    missionCompleted,
    undoWaypoint,
    removeWaypoint,
    updateWaypoint,
    optimizeRoute,
    clearWaypoints,
    setHome,
    thrustersActive,
    setBotLocation,
    enableLiveSystemGps,
    locationSource,
    gpsStatusMessage,
    setGpsStatusMessage
} = useMission();

    const [customLat, setCustomLat] = useState(robot.latitude);
    const [customLng, setCustomLng] = useState(robot.longitude);

    useEffect(() => {
        setCustomLat(robot.latitude);
        setCustomLng(robot.longitude);
    }, [robot.latitude, robot.longitude]);

    const handleRelocate = () => {
        enableLiveSystemGps();
        setLocateTrigger(prev => prev + 1);
    };

    const applyCustomCoordinates = (e) => {
        e.preventDefault();
        const lat = parseFloat(customLat);
        const lng = parseFloat(customLng);
        if (!isNaN(lat) && !isNaN(lng)) {
            setBotLocation(lat, lng, true);
            setLocateTrigger(prev => prev + 1);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* GPS Location Mode & Status Banner */}
            <div style={{
                background: "linear-gradient(90deg, #0a1826 0%, #16203a 100%)",
                border: "1px solid rgba(18,211,224, 0.3)",
                borderRadius: "12px",
                padding: "8px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
                fontSize: "12px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        background: locationSource === "BROWSER_GPS" ? "rgba(34,197,94,0.2)" : locationSource === "IP_GEOLOCATION" ? "rgba(59,130,246,0.2)" : "rgba(234,179,8,0.2)",
                        color: locationSource === "BROWSER_GPS" ? "#4ade80" : locationSource === "IP_GEOLOCATION" ? "#60a5fa" : "#fde047",
                        border: `1px solid ${locationSource === "BROWSER_GPS" ? "#22c55e" : locationSource === "IP_GEOLOCATION" ? "#3b82f6" : "#eab308"}`
                    }}>
                        {locationSource === "BROWSER_GPS" ? "📡 LIVE SYSTEM GPS (1s REFRESH)" : locationSource === "IP_GEOLOCATION" ? "🌐 NETWORK GPS" : "⚙️ MANUAL OVERRIDE"}
                    </span>
                    <span style={{ color: "#93a1bc", fontSize: "11px" }}>{gpsStatusMessage}</span>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                    {locationSource === "MANUAL_OVERRIDE" && (
                        <button
                            type="button"
                            onClick={enableLiveSystemGps}
                            style={{
                                background: "rgba(34,197,94,0.2)",
                                color: "#4ade80",
                                border: "1px solid #22c55e",
                                borderRadius: "8px",
                                padding: "4px 10px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                        >
                            📡 Resume Live System GPS (1s Auto-Refresh)
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowManualGps(!showManualGps)}
                        style={{
                            background: showManualGps ? "#22d3ee" : "rgba(18,211,224,0.15)",
                            color: "#ffffff",
                            border: "1px solid rgba(18,211,224,0.4)",
                            borderRadius: "8px",
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            cursor: "pointer"
                        }}
                    >
                        {showManualGps ? "✖ Close GPS Override" : "🎯 Manual GPS Inputs"}
                    </button>
                </div>
            </div>

            {/* Manual GPS Inputs Form Drawer */}
            {showManualGps && (
                <form
                    onSubmit={applyCustomCoordinates}
                    style={{
                        background: "#16203a",
                        border: "1px solid rgba(18,211,224,0.4)",
                        borderRadius: "12px",
                        padding: "12px",
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        flexWrap: "wrap"
                    }}
                >
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flex: 1 }}>
                        <span style={{ color: "#93a1bc", fontSize: "11px", fontWeight: "bold" }}>LAT:</span>
                        <input
                            type="number"
                            step="0.000001"
                            value={customLat}
                            onChange={(e) => setCustomLat(e.target.value)}
                            style={{ background: "#0e1524", border: "1px solid rgba(18,211,224,0.3)", color: "#fff", padding: "6px 8px", borderRadius: "6px", fontSize: "12px", width: "120px" }}
                        />
                        <span style={{ color: "#93a1bc", fontSize: "11px", fontWeight: "bold" }}>LNG:</span>
                        <input
                            type="number"
                            step="0.000001"
                            value={customLng}
                            onChange={(e) => setCustomLng(e.target.value)}
                            style={{ background: "#0e1524", border: "1px solid rgba(18,211,224,0.3)", color: "#fff", padding: "6px 8px", borderRadius: "6px", fontSize: "12px", width: "120px" }}
                        />
                        <button
                            type="submit"
                            style={{
                                background: "#22d3ee",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                padding: "6px 14px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                        >
                            Set Bot Position
                        </button>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span style={{ color: "#888", fontSize: "10px" }}>Presets:</span>
                        <button
                            type="button"
                            onClick={() => { setBotLocation(12.9082, 77.5186, true); setLocateTrigger(prev => prev + 1); }}
                            style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid #444", borderRadius: "4px", padding: "3px 6px", fontSize: "10px", cursor: "pointer" }}
                        >
                            Facility Pool
                        </button>
                        <button
                            type="button"
                            onClick={() => { setBotLocation(13.0827, 80.2707, true); setLocateTrigger(prev => prev + 1); }}
                            style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid #444", borderRadius: "4px", padding: "3px 6px", fontSize: "10px", cursor: "pointer" }}
                        >
                            Coastal Basin
                        </button>
                    </div>
                </form>
            )}

            {/* Map Click Mode Selector Bar */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: "#93a1bc", fontSize: "11px", fontWeight: "bold" }}>MAP CLICK ACTION:</span>
                <button
                    type="button"
                    onClick={() => setMapClickMode("WAYPOINT")}
                    style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(18,211,224,0.4)",
                        background: mapClickMode === "WAYPOINT" ? "#22d3ee" : "#16203a",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: "bold",
                        cursor: "pointer"
                    }}
                >
                    📍 Add Waypoint
                </button>
                <button
                    type="button"
                    onClick={() => setMapClickMode("MOVE_BOT")}
                    style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(18,211,224,0.4)",
                        background: mapClickMode === "MOVE_BOT" ? "#4ade80" : "#16203a",
                        color: mapClickMode === "MOVE_BOT" ? "#000" : "#fff",
                        fontSize: "11px",
                        fontWeight: "bold",
                        cursor: "pointer"
                    }}
                >
                    🤿 Click Map to Move Bot
                </button>
                <button
                    type="button"
                    onClick={() => setMapClickMode("SET_HOME")}
                    style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(18,211,224,0.4)",
                        background: mapClickMode === "SET_HOME" ? "#38bdf8" : "#16203a",
                        color: mapClickMode === "SET_HOME" ? "#000" : "#fff",
                        fontSize: "11px",
                        fontWeight: "bold",
                        cursor: "pointer"
                    }}
                >
                    🏠 Click Map to Set Home Base
                </button>
            </div>

            <MapContainer 

            center={[

                homePosition.lat,

                homePosition.lng

            ]}

            zoom={18}

            className="real-map"

        >

            <TileLayer

                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

            />

            <AddWaypoint mapClickMode={mapClickMode} setMapClickMode={setMapClickMode} />
            <MapCenterController center={[robot.latitude, robot.longitude]} locateTrigger={locateTrigger} />

            {/* ==========================================
                    homePosition
            =========================================== */}

            <Marker

                position={[

                    homePosition.lat,

                    homePosition.lng

                ]}

                icon={homeIcon}

            >

                <Popup>

                    <b>

                        🏠 Home Base

                    </b>

                    <br/>

                    Launch Position

                </Popup>

            </Marker>

            {/* ==========================================
                    ROBOT
            =========================================== */}

            <Marker

                position={[

                    robot.latitude,

                    robot.longitude

                ]}

                icon={createRobotIcon(robot.heading, thrustersActive)}

            >

                <Popup>

                    <h3>

                        🤿 Submersible Robot

                    </h3>

                    <hr/>

                    <p>

                        <b>Status :</b>

                        {" "}

                        {robot.status}

                    </p>

                    <p>

                        <b>Battery :</b>

                        {" "}

                        {robot.battery.toFixed(1)}%

                    </p>

                    <p>

                        <b>Signal :</b>

                        {" "}

                        {robot.signal.toFixed(1)}%

                    </p>

                    <p>

                        <b>Speed :</b>

                        {" "}

                        {robot.speed}

                        {" "}m/s

                    </p>

                </Popup>

            </Marker>
                        {/* ==========================================
                    WAYPOINTS
            =========================================== */}

            {waypoints.map((point, index) => (
                <Marker
                    key={point.id || index}
                    position={[point.lat, point.lng]}
                    draggable={!missionStarted}
                    eventHandlers={{
                        dragend: (e) => {
                            const marker = e.target;
                            const pos = marker.getLatLng();
                            updateWaypoint(index, pos.lat, pos.lng);
                        }
                    }}
                    icon={createWaypointIcon(index + 1, currentWaypoint === index)}
                >
                    <Popup>
                        <div style={{ textAlign: "center", minWidth: "130px" }}>
                            <b style={{ color: "#00d9ff", fontSize: "13px" }}>📍 Waypoint #{index + 1}</b>
                            <hr style={{ borderColor: "rgba(18,211,224,0.3)", margin: "4px 0" }} />
                            <div style={{ fontSize: "11px", color: "#333" }}>
                                <b>Lat:</b> {point.lat.toFixed(6)}
                                <br />
                                <b>Lng:</b> {point.lng.toFixed(6)}
                            </div>
                            {!missionStarted && (
                                <button
                                    onClick={() => removeWaypoint(index)}
                                    style={{
                                        marginTop: "8px",
                                        background: "#22d3ee",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "6px",
                                        padding: "4px 10px",
                                        fontSize: "11px",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        width: "100%"
                                    }}
                                >
                                    🗑 Delete Waypoint
                                </button>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* ==========================================
                    ROUTE
            =========================================== */}

            {

                waypoints.length > 0 && (

                    <Polyline

                        positions={[

                            [homePosition.lat, homePosition.lng],

                            ...waypoints.map(point => [point.lat, point.lng])

                        ]}

                        color="#00d9ff"

                        weight={5}

                    />

                )

            }

        </MapContainer>

        <div className="map-buttons">
    <button className="btn-locate" onClick={() => setLocateTrigger(prev => prev + 1)}>
        🔄 Locate Bot
    </button>

    <button

        onClick={undoWaypoint}

    >

        ↩ Undo

    </button>

    <button
        onClick={clearWaypoints}
    >
        🗑 Clear
    </button>
    <button
        onClick={optimizeRoute}
        disabled={missionStarted || waypoints.length < 2}
        style={{
            background: "rgba(0, 217, 255, 0.15)",
            color: "#00d9ff",
            border: "1px solid rgba(0, 217, 255, 0.4)",
            borderRadius: "10px",
            padding: "10px",
            cursor: missionStarted || waypoints.length < 2 ? "not-allowed" : "pointer",
            fontWeight: "bold",
            opacity: missionStarted || waypoints.length < 2 ? 0.5 : 1
        }}
        title="Optional: Sort waypoints by nearest distance"
    >
        ⚡ Auto-Sort Order
    </button>
    <button className="btn-relocate" onClick={handleRelocate} style={{ background: "linear-gradient(135deg, #e74c3c, #c0392b)", color: "white", padding: "10px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>
        📍 Relocate Bot
    </button>
    <button className="btn-sethome" onClick={() => setHome(robot.latitude, robot.longitude)} style={{ background: "linear-gradient(135deg, #22d3ee, #0a6b78)", color: "white", padding: "10px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>
        📍 Set Home
    </button>

    <button>

        Progress : {progress}%

    </button>

    <button>

        {

            missionStarted

            ? "🟢 RUNNING"

            : missionCompleted

            ? "✅ COMPLETE"

            : "⚪ READY"

        }

    </button>

    </div>
</div>
    );
}