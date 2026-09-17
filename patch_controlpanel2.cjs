const fs = require('fs');
const file = '/app/applet/src/components/ControlPanel.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add import if not present
if (!content.includes('confirmDialog')) {
    content = content.replace(
        'import { toast } from "./Toast";',
        'import { toast } from "./Toast";\nimport { confirmDialog } from "./ConfirmDialog";'
    );
}

// Replace window.confirm with confirmDialog
content = content.replace(
    /const confirm1 = window\.confirm\("Are you sure you want to return to the home position\?"\);/,
    'const confirm1 = await confirmDialog({ title: "Return Home?", message: "Are you sure you want to return to the home position?", confirmText: "Yes, Return" });'
);

content = content.replace(
    /const confirm2 = window\.confirm\("This will pause the current mission\. Would you like to save this mission as 'uncompleted' to Mission History so you can resume it later\?"\);/,
    'const confirm2 = await confirmDialog({ title: "Save Mission?", message: "This will pause the current mission. Would you like to save this mission as \'uncompleted\' to Mission History so you can resume it later?", confirmText: "Save & Pause", cancelText: "Just Pause" });'
);

fs.writeFileSync(file, content);
