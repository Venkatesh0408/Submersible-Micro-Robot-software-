const fs = require('fs');
const file = '/app/applet/src/context/MissionContext.jsx';
let content = fs.readFileSync(file, 'utf8');

// Change the target home to waypoints[0] if available
content = content.replace(
    'const home = homePosition;',
    'const home = (waypoints && waypoints.length > 0) ? waypoints[0] : homePosition;'
);

// We should also reset the mission progress properly
// when returning home is complete.
// Is there anywhere else "homePosition" is used as the target to return to?
// Let's check stopMission:
// setRobot(prev => ({ ...prev, latitude: homePosition.lat, longitude: homePosition.lng, status: "IDLE" }));
// If we stop the mission, it resets to homePosition? Wait, if they stop the mission, it teleports to homePosition.
content = content.replace(
    'latitude: homePosition.lat,\n            longitude: homePosition.lng,',
    'latitude: (waypoints && waypoints.length > 0) ? waypoints[0].lat : homePosition.lat,\n            longitude: (waypoints && waypoints.length > 0) ? waypoints[0].lng : homePosition.lng,'
);

fs.writeFileSync(file, content);
