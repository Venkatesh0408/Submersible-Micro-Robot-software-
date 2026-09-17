const fs = require('fs');
const file = '/app/applet/src/components/MissionToolbar.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    'manualMove,\n        setHome\n    } = useMission();',
    'manualMove,\n        setHome,\n        saveMissionToHistory\n    } = useMission();'
);

fs.writeFileSync(file, content);
