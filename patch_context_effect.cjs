const fs = require('fs');
const file = '/app/applet/src/context/MissionContext.jsx';
let content = fs.readFileSync(file, 'utf8');

const effectCode = `
    useEffect(() => {
        if (missionCompleted) {
            markMissionCompletedInHistory();
        }
    }, [missionCompleted]);
`;

content = content.replace('// =====================================================\n    // DISTANCE & TIME', effectCode + '\n    // =====================================================\n    // DISTANCE & TIME');

fs.writeFileSync(file, content);
