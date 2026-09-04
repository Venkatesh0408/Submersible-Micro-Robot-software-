# Deploying Submersible Micro Robot to Render

Your project is now fully configured for smooth deployment on [Render](https://render.com/).

---

## Quick Method 1: Automatic Deployment using Render Blueprint (Recommended)

1. Push your code to your **GitHub** repository.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** at the top right and select **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect the `render.yaml` file in the root directory.
6. Under Environment Variables, enter your `GEMINI_API_KEY` (if you use Gemini AI image analysis).
7. Click **Apply**. Render will automatically build and start your Node.js full-stack server!

---

## Quick Method 2: Manual Web Service Setup on Render

If you prefer adding a Web Service manually in Render:

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Fill in the following settings:
   - **Name**: `submersible-micro-robot` (or your choice)
   - **Language**: `Node`
   - **Branch**: `main` (or your active branch)
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or higher)
5. Scroll down to **Environment Variables**:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key, optional for AI inspection features)*
   - `JWT_SECRET`: *(A random string for JWT session signing, optional)*
6. Click **Create Web Service**.

---

## Features Supported on Render

- **Single Node.js Process**: Serves both the React SPA frontend and Express backend on a unified port.
- **Dynamic Port Binding**: Automatically listens to Render's allocated `PORT` environment variable.
- **REST APIs & AI Analysis**: Full access to all API routes (`/api/auth/login`, `/api/telemetry`, `/api/analyze-image`, etc.).
- **Live Video Streaming & Media Uploads**: Camera streams, RPi proxying, and local media uploads operate seamlessly.
