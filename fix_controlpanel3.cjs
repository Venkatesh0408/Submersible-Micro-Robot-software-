const fs = require('fs');
const file = '/app/applet/src/components/ControlPanel.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add context functions to destructuring
content = content.replace(
    'missionStatus: missionState\n    } = useMission();',
    'missionStatus: missionState,\n        startMission: contextStartMission,\n        stopMission: contextStopMission,\n        pauseMission: contextPauseMission,\n        resumeMission: contextResumeMission,\n        returnHome: contextReturnHome\n    } = useMission();'
);

// Call context functions inside handlers
content = content.replace(
    'await startMission();',
    'await startMission();\n                contextStartMission();'
);
content = content.replace(
    'await stopMission();',
    'await stopMission();\n                contextStopMission();'
);
content = content.replace(
    'await pauseMission();',
    'await pauseMission();\n                contextPauseMission();'
);
content = content.replace(
    'await resumeMission();',
    'await resumeMission();\n                contextResumeMission();'
);
content = content.replace(
    'await returnHome();',
    'await returnHome();\n            contextReturnHome();'
);

fs.writeFileSync(file, content);
