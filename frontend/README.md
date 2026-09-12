# ToiLens frontend and Chrome extension

The Figma Make UI is served by this Vite project. Its data comes from `GET /locations` and `GET /routes` at `VITE_API_URL` (default: `http://localhost:8000`). No credentials are used or committed.

## Run locally

1. Start the existing backend from the workspace root:
   `npx json-server --watch db.json --port 8000`
2. In this directory, copy `.env.example` to `.env` if you need a non-default API URL. Keep `VITE_API_URL=http://localhost:8000` for the supplied backend.
3. Install and start the frontend:
   `npm install`
   `npm run dev`
4. Open the URL printed by Vite (normally `http://localhost:5173`).

## Build and install the extension

1. With the backend still running, run `npm run build` here.
2. In Chrome or Chromium, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select this project's `dist` directory.
3. Pin **ToiLens** and click it. The extension needs the local API at `http://localhost:8000`; after changing the API URL, rebuild and reload the extension.

The MV3 manifest is copied into `dist` during the Vite build. It grants access only to the local backend. The background worker has no data collection behavior; it only confirms installation in its console.
