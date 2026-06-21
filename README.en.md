# This Earth - Earth Mindfulness

A ready-to-run web MVP: it calculates Earth's day and night distribution from the current time, lets the user view Earth from their own location, and guides original 3, 7, and 12-minute mindfulness practices.

## Implemented

- Date and time driven day-night Earth view
- WebGL 3D Earth with drag and zoom; automatic 2D fallback when WebGL is unavailable
- Approximate GPS location, city presets, and manual latitude/longitude input
- 3-minute "Return to now", 7-minute "Embrace Earth", and 12-minute "Peace practice"
- Guidance text, device voice guidance, procedural ambient sound, and chimes
- Pause, resume, end early, and natural completion
- Post-session mood recording and weekly stats
- Wednesday reminder settings while the page is open or available in the background
- PWA manifest, offline cache, and install entry point
- Local storage only; location and practice history are not uploaded to a server
- Responsive desktop and mobile layouts, reduced-motion support, and keyboard focus styles

## Fastest Way To Use

Open directly:

```text
dist/index.html
```

This file inlines the scripts, styles, and Earth textures, so it can be opened offline. Browser support for location, notifications, and PWA installation may be limited on `file://` pages. For the full experience, open it through a local server or an HTTPS website.

## Local Development

Requires Node.js 20 or higher.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run typecheck
npm run build
```

Local preview:

```bash
npm run preview
```

## Deployment

Upload all files in `dist/` to any static hosting service. The site uses relative paths, so it can be deployed at the root or under a subdirectory.

Use HTTPS in production to enable location, system notifications, the Service Worker, and PWA installation.

## Native App Next Step

This delivery is a web/PWA version. Browsers cannot guarantee that weekly reminders will fire on time after the page is fully closed. For native scheduled notifications on iOS or Android, wrap this project with Capacitor and integrate Local Notifications. The existing UI, Earth rendering, records, and meditation logic can continue to be reused.

## Test Entry Point

For development testing, add this query string to the URL:

```text
?demo=fast
```

Practice duration will run at about 10x speed, which makes it easier to test natural completion, mood recording, and stats flows. Do not add this parameter to normal user-facing URLs.

## Data And Privacy

- GPS is requested only after the user explicitly clicks the location action.
- Coordinates, preferences, and practice history are stored only in browser local storage.
- The project has no backend, account system, analytics SDK, or advertising SDK.
- Voice guidance is provided by the device through the Web Speech API; ambient sound is generated in real time through the Web Audio API.

## Assets And Copyright

See [CREDITS.md](./CREDITS.md). Code is released under the MIT License. NASA/NOAA imagery is not included under the MIT License and should be used according to the attribution and usage rules on the source pages.
