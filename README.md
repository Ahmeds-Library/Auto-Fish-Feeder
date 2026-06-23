# FishFeeder Multi-Device IoT Dashboard

A Firebase-hostable dashboard foundation for automatic fish feeder devices. Phase 1 adds a React/Vite/Tailwind web app, Firebase Auth integration, per-user device loading, per-device commands, Realtime Database rules, seed data, and setup documentation.

## Tech stack
- React + Vite + TypeScript
- Tailwind CSS
- Firebase Authentication
- Firebase Realtime Database
- Firebase Hosting
- ESP8266 firmware contract for Phase 2

## Folder structure
```text
web/                 React dashboard
firebase/            Realtime Database rules and seed data
docs/                Architecture, schema, setup, testing plan
legacy/              Preserved original web UI and firmware
Web Interface/       Original web UI retained in place
code/                Original firmware retained in place
firebase.json        Firebase Hosting + rules config
.firebaserc.example  Firebase project placeholder
```

## Local setup
```bash
cd web
cp .env.example .env
npm install
npm run dev
```

Fill `.env` with your Firebase Web App config. Do not commit `.env`.

## Build
```bash
cd web
npm run build
```

## Deploy
```bash
firebase use <project-id>
firebase deploy --only hosting,database
```

## Security model
Users authenticate with Firebase Auth. User profiles live at `/users/{uid}`. Device access is scoped through `/users/{uid}/devices/{deviceId}` and `/devices/{deviceId}/ownerUid`. The new web app writes feed commands only to `/devices/{deviceId}/commands/active`; it does not use global `/feednow` or `/timers`.

## Phase 1 limitations
- Pairing is a safe placeholder; production pairing should use Cloud Functions/admin approval or constrained pre-provisioning.
- Firmware Phase 2 foundation now exists, but hardware flashing, pairing/provisioning, and real-device validation are still required.
- Firebase seed data uses placeholder UIDs and should be edited before import.

## Testing checklist
See `docs/testing-plan.md`.

## Phase 2 firmware

The new ESP8266 firmware is in `firmware/esp8266-fish-feeder/`. It uses LittleFS persistent config, first-boot setup AP portal, Firebase email/password device auth, per-device database paths, status heartbeat, logs, command polling, schedule polling, and safe continuous/positional servo control.

Flash `firmware/esp8266-fish-feeder/esp8266-fish-feeder.ino` to a Wemos D1 Mini / ESP8266. On first boot, join `FishFeeder-Setup` with password `setup1234`, open `http://192.168.4.1`, and enter Wi-Fi/Firebase/device credentials. Each ESP needs its own Firebase Auth account, and `/devices/{deviceId}/deviceAuthUid` must match that account UID.

See `firmware/esp8266-fish-feeder/README.md` for full firmware setup, safety notes, and known limitations.
