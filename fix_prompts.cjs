const fs = require('fs');
const files = ['/app/applet/src/components/ControlPanel.jsx', '/app/applet/src/components/MissionToolbar.jsx'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
        "message: \"This will pause the current mission. Would you like to save this mission as 'uncompleted' to Mission History so you can resume it later?\", confirmText: \"Save & Pause\", cancelText: \"Just Pause\"",
        "message: \"Would you like to save your current progress to Mission History so you can resume it later?\", confirmText: \"Save & Return\", cancelText: \"Just Return\""
    );
    fs.writeFileSync(file, content);
});
