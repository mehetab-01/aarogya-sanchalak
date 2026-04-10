// ⚠️  READ ONLY — owned by Mehetab
// DO NOT EDIT — ask Mehetab if you need changes here
// Everyone imports from this file

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// TODO: Mehetab fills this in at hackathon start
const firebaseConfig = {
  apiKey: "FILL_ME",
  authDomain: "FILL_ME",
  databaseURL: "FILL_ME",
  projectId: "FILL_ME",
  storageBucket: "FILL_ME",
  messagingSenderId: "FILL_ME",
  appId: "FILL_ME",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export default app;
