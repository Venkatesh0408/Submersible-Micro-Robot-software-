const fs = require('fs');
const file = '/app/applet/src/context/MissionContext.jsx';
let content = fs.readFileSync(file, 'utf8');

// Inside startMission: change start coordinate logic back to what it was
content = content.replace(
    'latitude: currentWaypoint === 0 ? ((waypoints && waypoints.length > 0) ? waypoints[0].lat : homePosition.lat) : prev.latitude,\n            longitude: currentWaypoint === 0 ? ((waypoints && waypoints.length > 0) ? waypoints[0].lng : homePosition.lng) : prev.longitude,',
    'latitude: currentWaypoint === 0 ? homePosition.lat : prev.latitude,\n            longitude: currentWaypoint === 0 ? homePosition.lng : prev.longitude,'
);

// We should also look at the returningHome logic in setInterval
content = content.replace(
    'const home = (waypoints && waypoints.length > 0) ? waypoints[0] : homePosition;',
    'const home = homePosition;'
);

// And stopMission
content = content.replace(
    /latitude: \(waypoints && waypoints\.length > 0\) \? waypoints\[0\]\.lat : homePosition\.lat,\s*longitude: \(waypoints && waypoints\.length > 0\) \? waypoints\[0\]\.lng : homePosition\.lng,/,
    'latitude: homePosition.lat,\n            longitude: homePosition.lng,'
);

fs.writeFileSync(file, content);
