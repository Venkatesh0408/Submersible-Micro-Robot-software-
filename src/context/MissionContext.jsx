import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef
} from "react";
import * as api from "../services/api";

const MissionContext = createContext();

export const useMission = () => useContext(MissionContext);

export const MissionProvider = ({ children }) => {

    // =====================================================
    // ROBOT
    // =====================================================

    const [robot, setRobot] = useState({

        latitude: 12.908200,
        longitude: 77.518600,

        heading: 0,

        speed: 0.25,

        battery: 100,

        signal: 100,

        status: "IDLE",

        mode: "AUTO"

    });

    const [missionStatus, setMissionStatus] = useState("READY");
    const [missionName, setMissionName] = useState("");
    const [inspectionArea, setInspectionArea] = useState("");

    // =====================================================
    // ROUTE
    // =====================================================

    const [waypoints, setWaypoints] = useState([]);

    const [routeSaved, setRouteSaved] = useState(false);

    const [currentWaypoint, setCurrentWaypoint] = useState(0);

    const [missionStarted, setMissionStarted] = useState(false);

    const [missionPaused, setMissionPaused] = useState(false);

    const [missionCompleted, setMissionCompleted] = useState(false);

    const [returningHome, setReturningHome] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);

    const [homePosition, setHomePosition] = useState({
        lat: 12.908200,
        lng: 77.518600
    });

    const [locationSource, setLocationSource] = useState("BROWSER_GPS"); // "BROWSER_GPS" | "IP_GEOLOCATION" | "MANUAL_OVERRIDE"
    const [gpsStatusMessage, setGpsStatusMessage] = useState("Initializing System Location Tracking...");

    // Helper to manually set bot (and optionally home) position anywhere
    const setBotLocation = (lat, lng, syncHome = true, source = "MANUAL_OVERRIDE") => {
        const numLat = Number(lat);
        const numLng = Number(lng);
        if (isNaN(numLat) || isNaN(numLng)) return;

        setRobot(prev => ({
            ...prev,
            latitude: numLat,
            longitude: numLng
        }));

        if (syncHome) {
            setHomePosition({ lat: numLat, lng: numLng });
        }

        setLocationSource(source);
        if (source === "MANUAL_OVERRIDE") {
            setGpsStatusMessage(`Manual GPS Override: ${numLat.toFixed(5)}, ${numLng.toFixed(5)}`);
        }
    };

    // Helper to explicitly re-enable live 1s system GPS tracking
    const enableLiveSystemGps = () => {
        setLocationSource("BROWSER_GPS");
        setGpsStatusMessage("Acquiring Live System Location (1s Refresh)...");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setRobot(prev => ({ ...prev, latitude: lat, longitude: lng }));
                    setHomePosition({ lat, lng });
                    setGpsStatusMessage(`📡 Live System GPS Active (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
                    api.updateGpsPosition({ latitude: lat, longitude: lng }).catch(() => {});
                },
                (err) => {
                    console.warn("Manual live GPS request error:", err);
                    setGpsStatusMessage("Browser GPS permission restricted/denied.");
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 4000 }
            );
        }
    };

    // =====================================================
    // REAL-TIME SYSTEM LOCATION TRACKING WITH 1-SEC REFRESH
    // =====================================================
    useEffect(() => {
        let active = true;

        // Fast IP Geolocation fallback for instant real location on launch
        fetch("https://ipapi.co/json/")
            .then(res => res.json())
            .then(data => {
                if (!active) return;
                if (data && typeof data.latitude === "number" && typeof data.longitude === "number") {
                    setRobot(prev => {
                        // Only set if we haven't locked browser GPS or manual override
                        if (locationSource === "BROWSER_GPS" && prev.latitude !== 12.9082) return prev;
                        return { ...prev, latitude: data.latitude, longitude: data.longitude };
                    });
                    setHomePosition(prev => {
                        if (locationSource === "BROWSER_GPS" && prev.lat !== 12.9082) return prev;
                        return { lat: data.latitude, lng: data.longitude };
                    });
                    if (locationSource !== "MANUAL_OVERRIDE" && locationSource !== "BROWSER_GPS") {
                        setLocationSource("IP_GEOLOCATION");
                        setGpsStatusMessage(`🌐 Network Location Active: ${data.city || 'Local'}, ${data.region_code || ''} (${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)})`);
                    }
                }
            })
            .catch(() => {
                // Ignore IP lookup failure
            });

        // Main high-accuracy system GPS fetch function
        const fetchSystemGps = () => {
            if (!navigator.geolocation) {
                if (active) setGpsStatusMessage("Browser Geolocation API not supported.");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    if (!active) return;
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;

                    setRobot(prev => {
                        if (locationSource === "MANUAL_OVERRIDE") return prev;
                        if (prev.status === "RUNNING" || prev.status === "RETURNING") return prev;
                        return {
                            ...prev,
                            latitude: lat,
                            longitude: lng
                        };
                    });

                    setHomePosition(prev => {
                        if (locationSource === "MANUAL_OVERRIDE") return prev;
                        return { lat, lng };
                    });

                    if (locationSource !== "MANUAL_OVERRIDE") {
                        setLocationSource("BROWSER_GPS");
                        setGpsStatusMessage(`📡 Live System Location Active (${lat.toFixed(5)}, ${lng.toFixed(5)}) - 1s Refresh`);
                    }

                    // Sync to backend server
                    api.updateGpsPosition({ latitude: lat, longitude: lng }).catch(() => {});
                },
                (err) => {
                    if (!active) return;
                    console.warn("System GPS refresh warning:", err.message);
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 3000 }
            );
        };

        // 1) Trigger immediate check when software opens
        fetchSystemGps();

        // 2) Set 1-second continuous refresh interval as requested
        const intervalId = setInterval(fetchSystemGps, 1000);

        // 3) Also subscribe to watchPosition for real-time OS location updates
        let watchId = null;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    if (!active) return;
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;

                    setRobot(prev => {
                        if (locationSource === "MANUAL_OVERRIDE") return prev;
                        if (prev.status === "RUNNING" || prev.status === "RETURNING") return prev;
                        return { ...prev, latitude: lat, longitude: lng };
                    });

                    setHomePosition(prev => {
                        if (locationSource === "MANUAL_OVERRIDE") return prev;
                        return { lat, lng };
                    });

                    if (locationSource !== "MANUAL_OVERRIDE") {
                        setLocationSource("BROWSER_GPS");
                        setGpsStatusMessage(`📡 Live System Location Active (${lat.toFixed(5)}, ${lng.toFixed(5)}) - 1s Refresh`);
                    }
                },
                () => {},
                { enableHighAccuracy: true, maximumAge: 0 }
            );
        }

        return () => {
            active = false;
            clearInterval(intervalId);
            if (watchId !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [locationSource]);

    // =====================================================
    // MISSION
    // =====================================================

    const [progress, setProgress] = useState(0);

    const [distance, setDistance] = useState(0);

    const [remainingDistance, setRemainingDistance] = useState(0);

    const [eta, setEta] = useState(0);
    const [missionTime, setMissionTime] = useState(0);
    const [waypointTime, setWaypointTime] = useState(0);

    // =====================================================
    // SET HOME
    // =====================================================
    const setHome = (lat, lng) => {
        setHomePosition({ lat, lng });
        // alert removed due to iframe restrictions
    };

    // =====================================================
    // ADD WAYPOINT
    // =====================================================

    const addWaypoint = (lat, lng) => {
        if (missionStarted) return;
        setWaypoints(prev => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                lat,
                lng
            }
        ]);
        setRouteSaved(false);
    };

    const undoWaypoint = () => {
        if (missionStarted) return;
        setWaypoints(prev => prev.slice(0, -1));
        setRouteSaved(false);
    };

    const removeWaypoint = (index) => {
        if (missionStarted) return;
        setWaypoints(prev => prev.filter((_, i) => i !== index));
        setRouteSaved(false);
    };

    const updateWaypoint = (index, lat, lng) => {
        if (missionStarted) return;
        setWaypoints(prev => prev.map((wp, i) => i === index ? { ...wp, lat, lng } : wp));
        setRouteSaved(false);
    };

    const clearWaypoints = () => {
        if (missionStarted) return;
        setWaypoints([]);
        setRouteSaved(false);
        setProgress(0);
        setCurrentWaypoint(0);
    };

    const [activeThrusterTime, setActiveThrusterTime] = useState(0);
    const [thrustersActive, setThrustersActive] = useState(false);
    const [targetBearing, setTargetBearing] = useState(0);

    // =====================================================
    // HAVERSINE DISTANCE & BEARING (HARDWARE TIMING: 5m = 20s Thruster Run)
    // =====================================================
    const calculateHaversineDistance = (p1, p2) => {
        if (!p1 || !p2) return 0;
        const R = 6371000; // Radius of Earth in meters
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLng = (p2.lng - p1.lng) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
    };

    const calculateBearingAngle = (p1, p2) => {
        if (!p1 || !p2) return 0;
        const y = Math.sin((p2.lng - p1.lng) * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180);
        const x = Math.cos(p1.lat * Math.PI / 180) * Math.sin(p2.lat * Math.PI / 180) -
                  Math.sin(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.cos((p2.lng - p1.lng) * Math.PI / 180);
        let brng = Math.atan2(y, x) * 180 / Math.PI;
        return Math.round((brng + 360) % 360);
    };

    // Hardware rule: 5 meters distance = 20 seconds thruster run (4 seconds per meter)
    const calculateThrusterTimeSeconds = (distanceMeters) => {
        return Math.round((distanceMeters * 4.0) * 10) / 10;
    };

    // Get detailed segment breakdown for all waypoints
    const getWaypointSegments = () => {
        if (waypoints.length === 0) return [];
        const segments = [];
        let prevPoint = { lat: homePosition.lat, lng: homePosition.lng, label: "Home Base" };

        waypoints.forEach((wp, idx) => {
            const dist = calculateHaversineDistance(prevPoint, wp);
            const bearing = calculateBearingAngle(prevPoint, wp);
            const thrusterSec = calculateThrusterTimeSeconds(dist);
            let status = "PENDING";
            if (idx < currentWaypoint) status = "COMPLETED";
            else if (idx === currentWaypoint && missionStarted) status = "ACTIVE";

            segments.push({
                index: idx + 1,
                from: prevPoint.label || `WP #${idx}`,
                to: `Waypoint ${idx + 1}`,
                lat: wp.lat,
                lng: wp.lng,
                distanceMeters: dist,
                bearingDeg: bearing,
                thrusterSec: thrusterSec,
                status: status
            });
            prevPoint = { lat: wp.lat, lng: wp.lng, label: `Waypoint ${idx + 1}` };
        });

        return segments;
    };

    const calculateDistance = (a, b) => {
        return calculateHaversineDistance(a, b);
    };

    // =====================================================
    // SAVE ROUTE
    // =====================================================

    const saveRoute = () => {
        if (waypoints.length < 1) {
            console.log("Add at least one waypoint");
            return;
        }
        // Preserve exact user-defined waypoint sequence without auto-shuffling
        setRouteSaved(true);
    };

    const optimizeRoute = () => {
        if (waypoints.length < 1) return;
        let remaining = [...waypoints];
        let currentPos = { lat: homePosition.lat, lng: homePosition.lng };
        let optimized = [];

        while (remaining.length > 0) {
            let nearestIdx = 0;
            let minVal = calculateDistance(currentPos, remaining[0]);
            for (let i = 1; i < remaining.length; i++) {
                let d = calculateDistance(currentPos, remaining[i]);
                if (d < minVal) {
                    minVal = d;
                    nearestIdx = i;
                }
            }
            let nextWp = remaining[nearestIdx];
            optimized.push(nextWp);
            currentPos = nextWp;
            remaining.splice(nearestIdx, 1);
        }

        setWaypoints(optimized);
        setRouteSaved(false);
    };
        // =====================================================
    // START MISSION
    // =====================================================

    const startMission = () => {
        if (!routeSaved) {
            console.log("Save the route first.");
            return;
        }
        setMissionStarted(true);
        setMissionPaused(false);
        setMissionCompleted(false);
        setReturningHome(false);
        setCurrentWaypoint(0);
        setProgress(0);
        setRobot(prev => ({
            ...prev,
            latitude: homePosition.lat,
            longitude: homePosition.lng,
            status: "RUNNING"
        }));
    };

    // =====================================================
    // PAUSE
    // =====================================================

    const pauseMission = () => {

        if (!missionStarted) return;

        setMissionPaused(true);

        setRobot(prev => ({

            ...prev,

            status: "PAUSED"

        }));

    };

    // =====================================================
    // RESUME
    // =====================================================

    const resumeMission = () => {

        if (!missionStarted) return;

        setMissionPaused(false);

        setRobot(prev => ({

            ...prev,

            status: "RUNNING"

        }));

    };

    // =====================================================
    // STOP
    // =====================================================

    const emergencyStop = () => {
        stopMission();
        api.emergencyStopMission().catch(err => console.error("Emergency stop API error:", err));
    };
    const stopMission = () => {

        setMissionStarted(false);

        setMissionPaused(false);

        setReturningHome(false);

        setMissionCompleted(false);

        setCurrentWaypoint(0);

        setProgress(0);

        setRobot(prev => ({

            ...prev,

            latitude: homePosition.lat,

            longitude: homePosition.lng,

            battery: 100,

            signal: 100,

            status: "IDLE"

        }));

    };

    // =====================================================
    // RETURN HOME
    // =====================================================

        const returnHome = () => {
        setReturningHome(true);
        setMissionStarted(true);
        setMissionPaused(false);
        setRobot(prev => ({
            ...prev,
            status: "RETURNING"
        }));
    };

    // =====================================================
    // DISTANCE & TIME
    // =====================================================
    useEffect(() => {
        let interval;
        if (missionStarted && !missionPaused && !missionCompleted) {
            interval = setInterval(() => {
                setMissionTime(prev => prev + 1);
                setWaypointTime(prev => prev + 1);
            }, 1000);
        } else if (!missionStarted && !missionCompleted) {
            setMissionTime(0);
            setWaypointTime(0);
        }
        return () => clearInterval(interval);
    }, [missionStarted, missionPaused, missionCompleted]);

    useEffect(() => {
        if (!missionStarted) return;
        if (waypoints.length > 0 && currentWaypoint < waypoints.length) {
            let dist = calculateDistance(
                { lat: robot.latitude, lng: robot.longitude },
                waypoints[currentWaypoint]
            );
            for (let i = currentWaypoint + 1; i < waypoints.length; i++) {
                dist += calculateDistance(waypoints[i - 1], waypoints[i]);
            }
            // Roughly convert degrees to meters
            setRemainingDistance(dist * 111139);
        } else {
            setRemainingDistance(0);
        }
    }, [robot.latitude, robot.longitude, waypoints, currentWaypoint, missionStarted]);

    // =====================================================
    // ROBOT MOVEMENT WITH AUTO-TURN & HARDWARE THRUSTER MOTOR TIMING
    // =====================================================

    useEffect(() => {

        if (!missionStarted) return;

        if (missionPaused) return;

        const timer = setInterval(() => {

            // -------------------------------
            // RETURN HOME
            // -------------------------------

            if (returningHome) {

                setRobot(prev => {

                    const home = homePosition;
                    let lat = prev.latitude;
                    let lng = prev.longitude;

                    const targetBearingDeg = calculateBearingAngle({ lat, lng }, home);
                    let currentHeading = prev.heading || 0;
                    
                    // Auto-turn towards home
                    let headingDiff = (targetBearingDeg - currentHeading + 540) % 360 - 180;
                    if (Math.abs(headingDiff) > 5) {
                        currentHeading = (currentHeading + (headingDiff > 0 ? 5 : -5) + 360) % 360;
                    } else {
                        currentHeading = targetBearingDeg;
                    }

                    const dLat = home.lat - lat;
                    const dLng = home.lng - lng;
                    const distDeg = Math.hypot(dLat, dLng);
                    const step = 0.00002;

                    if (distDeg <= step) {
                        clearInterval(timer);
                        setReturningHome(false);
                        setMissionStarted(false);
                        setMissionCompleted(true);
                        setThrustersActive(false);

                        return {
                            ...prev,
                            latitude: home.lat,
                            longitude: home.lng,
                            heading: targetBearingDeg,
                            status: "MISSION COMPLETE"
                        };
                    } else {
                        lat += (step * dLat) / distDeg;
                        lng += (step * dLng) / distDeg;
                    }

                    return {
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                        heading: currentHeading,
                        battery: Math.max(prev.battery - 0.02, 0),
                        signal: Math.max(prev.signal - 0.01, 0),
                        status: "RETURNING HOME (THRUSTERS ON)"
                    };
                });

                return;
            }

            // -------------------------------
            // NO WAYPOINTS LEFT
            // -------------------------------

            if (currentWaypoint >= waypoints.length) {
                if (!isWaiting) {
                    setIsWaiting(true);
                    setThrustersActive(false);
                    setRobot(prev => ({ ...prev, status: "WAITING AT LAST WP (10s)" }));
                    setTimeout(() => {
                        setIsWaiting(false);
                        setReturningHome(true);
                        setRobot(prev => ({ ...prev, status: "RETURNING HOME" }));
                    }, 10000);
                }
                return;
            }

            const target = waypoints[currentWaypoint];

            setRobot(prev => {
                let lat = prev.latitude;
                let lng = prev.longitude;

                const targetBrng = calculateBearingAngle({ lat, lng }, target);
                setTargetBearing(targetBrng);

                let currentHeading = prev.heading || 0;
                let headingDiff = (targetBrng - currentHeading + 540) % 360 - 180;

                // Step 1: Auto-turn to face target waypoint direction first
                if (Math.abs(headingDiff) > 6) {
                    setThrustersActive(false);
                    const nextHeading = (currentHeading + (headingDiff > 0 ? 6 : -6) + 360) % 360;
                    return {
                        ...prev,
                        heading: nextHeading,
                        status: `AUTOTURNING TO ${targetBrng}°`
                    };
                }

                // Step 2: Auto-turn completed - activate thruster motor
                setThrustersActive(true);

                // Calculate total segment distance and thruster run time (5 meters = 20s)
                const currentDistMeters = calculateHaversineDistance({ lat, lng }, target);
                const remainingThrusterSec = calculateThrusterTimeSeconds(currentDistMeters);
                setActiveThrusterTime(remainingThrusterSec);

                const dLat = target.lat - lat;
                const dLng = target.lng - lng;
                const distDeg = Math.hypot(dLat, dLng);
                const step = 0.00002;

                if (distDeg <= step) {
                    lat = target.lat;
                    lng = target.lng;
                    setTimeout(() => { 
                        setCurrentWaypoint(currentWaypoint + 1); 
                        setProgress(Math.round(((currentWaypoint + 1) / waypoints.length) * 100)); 
                        setWaypointTime(0); 
                    }, 0);
                } else {
                    lat += (step * dLat) / distDeg;
                    lng += (step * dLng) / distDeg;
                }

                return {
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    heading: targetBrng,
                    battery: Math.max(prev.battery - 0.02, 0),
                    signal: Math.max(prev.signal - 0.01, 0),
                    status: `THRUSTERS ON (${remainingThrusterSec}s REMAINING)`
                };

            });

        }, 100);

        return () => clearInterval(timer);

    }, [

        missionStarted,

        missionPaused,

        currentWaypoint,

        returningHome,

        waypoints,

    ]);
        // =====================================================
    // MANUAL MOVE
    // =====================================================
    const manualMove = (dir) => {
        setRobot(prev => {
            let lat = prev.latitude;
            let lng = prev.longitude;
            const step = 0.0001; // Manual move step
            if (dir === 'up') lat += step;
            if (dir === 'down') lat -= step;
            if (dir === 'left') lng -= step;
            if (dir === 'right') lng += step;
            return {
                ...prev,
                latitude: lat,
                longitude: lng,
                status: "MANUAL"
            };
        });
    };

    // =====================================================
    // CONTEXT VALUE
    // =====================================================

        const value = {
        missionName,
        setMissionName,
        inspectionArea,
        setInspectionArea,
        robot,
        waypoints,

        routeSaved,
        currentWaypoint,
        setCurrentWaypoint,
        missionStarted,
        missionPaused,
        missionCompleted,
        returningHome,
        progress,
        setProgress,
        distance,
        remainingDistance,
        eta,
        missionTime,
        waypointTime,
        addWaypoint,
        undoWaypoint,
        removeWaypoint,
        updateWaypoint,
        clearWaypoints,
        saveRoute,
        optimizeRoute,
        startMission,
        pauseMission,
        resumeMission,
        stopMission,
        emergencyStop,
        returnHome,
        missionStatus,
        setMissionStatus,
        manualMove,
        setHome,
        homePosition,
        setRobot,
        // Hardware & Location Management Additions:
        setBotLocation,
        enableLiveSystemGps,
        locationSource,
        gpsStatusMessage,
        setGpsStatusMessage,
        getWaypointSegments,
        calculateHaversineDistance,
        calculateBearingAngle,
        calculateThrusterTimeSeconds,
        activeThrusterTime,
        thrustersActive,
        targetBearing
    };

    return (

        <MissionContext.Provider value={value}>

            {children}

        </MissionContext.Provider>

    );

};