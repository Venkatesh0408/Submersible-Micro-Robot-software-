const fs = require('fs');
const file = '/app/applet/src/context/MissionContext.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    'latitude: currentWaypoint === 0 ? homePosition.lat : prev.latitude,\n            longitude: currentWaypoint === 0 ? homePosition.lng : prev.longitude,',
    'latitude: currentWaypoint === 0 ? ((waypoints && waypoints.length > 0) ? waypoints[0].lat : homePosition.lat) : prev.latitude,\n            longitude: currentWaypoint === 0 ? ((waypoints && waypoints.length > 0) ? waypoints[0].lng : homePosition.lng) : prev.longitude,'
);

fs.writeFileSync(file, content);
