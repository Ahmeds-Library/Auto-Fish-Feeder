# Database Schema

Root nodes:
- `/users/{uid}` stores web user profile and linked devices.
- `/devices/{deviceId}` stores owner, device auth UID, settings, command state, schedules, status, and logs.

Example command:
```json
{"id":"CMD_123","type":"feed","status":"pending","createdAt":1719123000000,"createdBy":"USER_UID","payload":{"motorType":"continuous360","direction":"cw","durationMs":700,"source":"manual"}}
```

Example schedule:
```json
{"enabled":true,"time":"08:00","days":["mon","tue","wed","thu","fri","sat","sun"],"feedMode":"medium","motorType":"continuous360","direction":"cw","durationMs":700,"lastTriggeredKey":""}
```

Example log:
```json
{"level":"success","message":"Manual feeding completed","createdAt":1719123000000,"source":"device"}
```

See `firebase/database.seed.json` for a complete sample with one user and two devices.
