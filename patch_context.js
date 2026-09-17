const fs = require('fs');
const file = '/app/applet/src/context/MissionContext.jsx';
let content = fs.readFileSync(file, 'utf8');

const functionsToAdd = `
    const saveMissionToHistory = (status = "uncompleted") => {
        const history = JSON.parse(localStorage.getItem("missionHistory") || "[]");
        history.push({
            id: Date.now(),
            date: new Date().toISOString(),
            name: missionName || ("Mission " + new Date().toLocaleString()),
            area: inspectionArea || "Unknown Area",
            status: status,
            waypoints: waypoints,
            currentWaypoint: currentWaypoint,
            robotPosition: { lat: robot.latitude, lng: robot.longitude },
            missionTime: missionTime,
            distance: distance,
            progress: progress
        });
        localStorage.setItem("missionHistory", JSON.stringify(history));
    };

    const loadMissionFromHistory = (mission) => {
        setMissionName(mission.name);
        setInspectionArea(mission.area);
        setWaypoints(mission.waypoints);
        setCurrentWaypoint(mission.currentWaypoint);
        setRobot(prev => ({ ...prev, latitude: mission.robotPosition.lat, longitude: mission.robotPosition.lng, status: "READY" }));
        setMissionTime(mission.missionTime);
        setDistance(mission.distance);
        setProgress(mission.progress);
        setMissionStarted(false);
        setMissionPaused(false);
        setMissionCompleted(false);
        setReturningHome(false);
        setRouteSaved(true);
        setMissionStatus("READY");
    };

    const markMissionCompletedInHistory = () => {
        saveMissionToHistory("completed");
    };
`;

content = content.replace('const value = {', functionsToAdd + '\n    const value = {\n        saveMissionToHistory,\n        loadMissionFromHistory,\n        markMissionCompletedInHistory,');

fs.writeFileSync(file, content);
