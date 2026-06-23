# Architecture

The active system is a Firebase-hosted multi-device fish feeder dashboard plus ESP8266 firmware.

## Active components

- `web/`: React/Vite/Tailwind dashboard using Firebase Auth and Realtime Database.
- `firmware/esp8266-fish-feeder/`: ESP8266/Wemos D1 Mini firmware.
- `firebase/`: active Realtime Database rules and seed data.
- `legacy/`: original prototype code for reference only.

## Data flow

- Web users authenticate with Firebase Authentication.
- User profiles live at `/users/{uid}`.
- Device ownership is represented by `/users/{uid}/devices/{deviceId}: true` and `/devices/{deviceId}/ownerUid`.
- The dashboard loads only linked device IDs and then reads `/devices/{deviceId}`.
- Manual feed writes a command to `/devices/{deviceId}/commands/active` only.
- The ESP8266 authenticates with its own Firebase Auth email/password account.
- The ESP8266 reads settings, schedules, and commands only from `/devices/{deviceId}`.
- The ESP8266 writes status and logs only under `/devices/{deviceId}`.

Global prototype paths such as `/feednow` and `/timers` are not active because they can trigger every feeder in a shared database.

## Pairing limitation

The dashboard still uses a safe pairing placeholder. Production pairing should be implemented with Cloud Functions/admin approval or carefully pre-provisioned rules so users cannot claim arbitrary devices.

## Phase 3 pairing flow

Browsers cannot directly scan nearby Wi-Fi setup networks like a native mobile app. Users connect to the `FishFeeder-Setup` Wi-Fi network manually, open `http://192.168.4.1`, and use the Device ID plus 6-digit pairing code shown by the ESP setup portal.

The firmware publishes a one-time pairing request at `/pairingRequests/{pairingCode}` with a 15-minute expiry. The hosted dashboard opens `/devices/pair?deviceId=...&code=...` from the portal link or lets the user type the values manually. The dashboard calls the `claimDevice` Cloud Function, which validates authentication, device ID, code, expiry, claim state, and empty ownership before writing `/devices/{deviceId}/ownerUid` and `/users/{uid}/devices/{deviceId}`.
