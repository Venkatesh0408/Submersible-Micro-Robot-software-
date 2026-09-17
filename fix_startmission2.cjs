const fs = require('fs');
const file = '/app/applet/src/context/MissionContext.jsx';
let content = fs.readFileSync(file, 'utf8');

// Inside startMission:
content = content.replace(
    /setRobot\(prev => \(\{\s*\.\.\.prev,\s*latitude: homePosition\.lat,\s*longitude: homePosition\.lng,\s*status: "RUNNING"\s*\}\)\);/,
    `setRobot(prev => ({
            ...prev,
            latitude: currentWaypoint === 0 ? homePosition.lat : prev.latitude,
            longitude: currentWaypoint === 0 ? homePosition.lng : prev.longitude,
            status: "RUNNING"
        }));`
);

fs.writeFileSync(file, content);
