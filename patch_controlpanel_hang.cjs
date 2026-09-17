const fs = require('fs');
const file = '/app/applet/src/components/ControlPanel.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix handleStartStop
content = content.replace(
    /await startMission\(\);\s*contextStartMission\(\);/,
    'contextStartMission();\n                startMission().catch(console.error);'
);
content = content.replace(
    /await stopMission\(\);\s*contextStopMission\(\);/,
    'contextStopMission();\n                stopMission().catch(console.error);'
);

// Fix handlePauseResume
content = content.replace(
    /await pauseMission\(\);\s*contextPauseMission\(\);/,
    'contextPauseMission();\n                pauseMission().catch(console.error);'
);
content = content.replace(
    /await resumeMission\(\);\s*contextResumeMission\(\);/,
    'contextResumeMission();\n                resumeMission().catch(console.error);'
);

// Fix handleReturn
content = content.replace(
    /await returnHome\(\);\s*contextReturnHome\(\);/,
    'contextReturnHome();\n            returnHome().catch(console.error);'
);

fs.writeFileSync(file, content);
