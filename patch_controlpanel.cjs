const fs = require('fs');
const file = '/app/applet/src/components/ControlPanel.jsx';
let content = fs.readFileSync(file, 'utf8');

// The destructuring needs saveMissionToHistory
content = content.replace(
    'setCurrentWaypoint\n    } = useMission();',
    'setCurrentWaypoint,\n        saveMissionToHistory,\n        missionStarted\n    } = useMission();'
);

const newHandleReturn = `
    async function handleReturn() {
        if (missionStarted) {
            const confirm1 = window.confirm("Are you sure you want to return to the home position?");
            if (!confirm1) return;
            
            const confirm2 = window.confirm("This will pause the current mission. Would you like to save this mission as 'uncompleted' to Mission History so you can resume it later?");
            if (confirm2) {
                saveMissionToHistory("uncompleted");
                toast.success("Mission saved as uncompleted.");
            }
        }
        
        try {
            await returnHome();
            setMissionState("RETURNING HOME");
            setMissionStatus("RETURNING HOME");
        }
        catch (err) {
            console.log(err);
        }
    }
`;

content = content.replace(/async function handleReturn\(\) \{[\s\S]*?catch \(err\) \{[\s\S]*?console\.log\(err\);[\s\S]*?\}[\s\S]*?\}/, newHandleReturn.trim());

fs.writeFileSync(file, content);
