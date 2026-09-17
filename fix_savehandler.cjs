const fs = require('fs');
const file = '/app/applet/src/components/MissionToolbar.jsx';
let content = fs.readFileSync(file, 'utf8');

const newSave = `
    function saveHandler() {
        if (missionStarted || missionPaused) {
            saveMissionToHistory("uncompleted");
            toast.success("Mission progress saved to History.");
        } else {
            saveRoute();
            toast.success("Route ready for mission start.");
        }
    }
`;

content = content.replace(
    'function saveHandler() { saveRoute(); }',
    newSave.trim()
);

fs.writeFileSync(file, content);
