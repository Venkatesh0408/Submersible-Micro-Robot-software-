const fs = require('fs');
const file = '/app/applet/src/pages/MissionHistory.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('confirmDialog')) {
    content = content.replace(
        'import Header from "../components/Header";',
        'import Header from "../components/Header";\nimport { confirmDialog } from "../components/ConfirmDialog";'
    );
}

// Replace handleResume
content = content.replace(
    'if (!window.confirm("This mission is already completed. Do you want to load it anyway?")) return;',
    'const c = await confirmDialog({ title: "Completed Mission", message: "This mission is already completed. Do you want to load it anyway?", confirmText: "Load Anyway" });\n            if (!c) return;'
);
content = content.replace(
    'const handleResume = (mission) => {',
    'const handleResume = async (mission) => {'
);

// Replace handleDelete
content = content.replace(
    /if \(window\.confirm\("Are you sure you want to delete this mission record\?"\)\) \{/,
    'if (await confirmDialog({ title: "Delete Record?", message: "Are you sure you want to delete this mission record?", confirmText: "Delete", tone: "danger" })) {'
);
content = content.replace(
    'const handleDelete = (id) => {',
    'const handleDelete = async (id) => {'
);

fs.writeFileSync(file, content);
