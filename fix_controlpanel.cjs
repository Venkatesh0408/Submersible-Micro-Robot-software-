const fs = require('fs');
const file = '/app/applet/src/components/ControlPanel.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace local state usage with context
content = content.replace(
    /const \[running, setRunning\] = useState\(false\);\s*const \[paused, setPaused\] = useState\(false\);\s*const \[missionState, setMissionState\] = useState\("READY"\);/,
    ''
);

content = content.replace(
    /const \{\s*setMissionStatus,\s*setProgress,\s*setCurrentWaypoint[\s\S]*?\} = useMission\(\);/,
    `const {
        missionStarted,
        missionPaused,
        currentWaypoint,
        setCurrentWaypoint,
        setProgress,
        setMissionStatus,
        saveMissionToHistory,
        missionStatus: missionState
    } = useMission();
    
    const running = missionStarted;
    const paused = missionPaused;`
);

// Fix handleStartStop
content = content.replace(
    /async function handleStartStop\(\) \{[\s\S]*?catch \(err\) \{[\s\S]*?\}[\s\S]*?\}/,
    `async function handleStartStop() {
        try {
            if (!running) {
                await startMission();
                // Context handles the rest!
            } else {
                await stopMission();
                // Context handles the rest!
            }
        } catch (err) {
            console.log(err);
        }
    }`
);

// Fix handlePauseResume
content = content.replace(
    /async function handlePauseResume\(\) \{[\s\S]*?catch \(err\) \{[\s\S]*?\}[\s\S]*?\}/,
    `async function handlePauseResume() {
        if (!running && currentWaypoint === 0) return; // Allow resuming if loaded from history
        try {
            if (!paused) {
                await pauseMission();
                // Context handles the rest
            } else {
                await resumeMission();
                // Context handles the rest
            }
        } catch (err) {
            console.log(err);
        }
    }`
);

fs.writeFileSync(file, content);
