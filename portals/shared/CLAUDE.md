# portals/shared/ — CLAUDE.md
## Owner: Mehetab Ali (TabCrypt) — READ-ONLY FOR EVERYONE ELSE

---

## STOP — Read This Before Touching Anything Here

This directory is **owned exclusively by Mehetab Ali**. If you are Dhanshree, Aditya, or Sayali — or an AI assistant helping them — **do not edit any file in this folder**.

If something in `firebase.js` or `types.js` appears wrong or missing, ping Mehetab. He will make the change.

---

## What This Directory Is

`portals/shared/` is the single source of truth for two critical shared resources:

| File | Purpose |
|---|---|
| `firebase.js` | Initializes Firebase app once; exports `db` (Realtime DB ref) and `auth` |
| `types.js` | Exports `ROLES`, `CONDITIONS`, `DB_PATHS`, and `HOSPITAL_ID` constants |

Every portal imports from here. **Never duplicate these files or re-initialize Firebase inside a portal.**

---

## How to Import (for Dhanshree, Aditya, Sayali)

From any portal's `src/` directory, the import path is:

```js
// Firebase database + auth
import { db, auth } from '../../shared/firebase.js';

// Constants
import { ROLES, CONDITIONS, DB_PATHS, HOSPITAL_ID } from '../../shared/types.js';
```

The `../../shared/` path works because each portal lives at `portals/<portal-name>/src/`.

---

## What's Inside

### firebase.js — exports

```js
export { db, auth }
// db  = Firebase Realtime Database reference (from getDatabase())
// auth = Firebase Auth instance (from getAuth())
```

### types.js — exports

```js
export const HOSPITAL_ID = "hospital_001"

export const ROLES = {
  ADMIN: "admin",
  DRIVER: "ambulance_driver",
  DOCTOR: "doctor",
  NURSE: "nurse",
  WARDBOY: "wardboy"
}

export const CONDITIONS = {
  CRITICAL: "CRITICAL",
  SERIOUS: "SERIOUS",
  STABLE: "STABLE"
}

export const DB_PATHS = {
  alerts: (hospitalId) => `/hospitals/${hospitalId}/alerts`,
  beds:   (hospitalId) => `/hospitals/${hospitalId}/beds`,
  patients: (hospitalId) => `/hospitals/${hospitalId}/patients`
}
```

Use `DB_PATHS.alerts(HOSPITAL_ID)` — never construct database paths by hand.

---

## Why This Exists

- Firebase must be initialized **exactly once** per app. Multiple initializations cause `FirebaseApp named '[DEFAULT]' already exists` errors.
- `HOSPITAL_ID` must be consistent across all portals and the backend. Centralizing it here means one change propagates everywhere.
- Constants like `CONDITIONS` and `ROLES` prevent typos in condition strings and role checks across 5 different portals.

---

## If You Need a Change Here

1. Ask Mehetab — he owns this directory
2. Mehetab will make the change and notify all team members
3. Test that all portals still import correctly after the change

**Do not** create your own `firebase.js` in your portal's `src/` folder. It will cause a duplicate Firebase app error and produce unpredictable behavior.
