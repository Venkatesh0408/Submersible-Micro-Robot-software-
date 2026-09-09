// Vercel serverless entry: hand every /api/* request to the Express app.
// The rewrite in vercel.json is transparent, so Express still sees the original URL.
import app from "../server.js";

export default app;
