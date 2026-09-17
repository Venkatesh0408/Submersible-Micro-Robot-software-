const fs = require('fs');
const file = '/app/applet/src/context/MissionContext.jsx';
let content = fs.readFileSync(file, 'utf8');

// Inside startMission:
content = content.replace(
    '        setReturningHome(false);\n        setCurrentWaypoint(0);\n        setProgress(0);\n        setRobot(prev => ({',
    '        setReturningHome(false);\n        // Do not reset currentWaypoint and progress here so loaded missions can resume\n        setRobot(prev => ({'
);

// We need to also change resumeMission inside loadMissionFromHistory if they want to click resume directly.
// Actually, they can just click "Start Mission" on the UI and it will continue because currentWaypoint is not 0.

fs.writeFileSync(file, content);
