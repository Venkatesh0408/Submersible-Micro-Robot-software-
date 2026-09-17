const fs = require('fs');
const file = '/app/applet/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add to load map
content = content.replace(
    '  History: () => import("./pages/History"),',
    '  History: () => import("./pages/History"),\n  MissionHistory: () => import("./pages/MissionHistory"),'
);

// Add lazy
content = content.replace(
    'const History = lazy(load.History);',
    'const History = lazy(load.History);\nconst MissionHistory = lazy(load.MissionHistory);'
);

// Add route
content = content.replace(
    '<Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />',
    '<Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />\n          <Route path="/mission-history" element={<ProtectedRoute><MissionHistory /></ProtectedRoute>} />'
);

fs.writeFileSync(file, content);
