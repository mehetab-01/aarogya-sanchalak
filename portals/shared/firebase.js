// ⚠️  READ ONLY — owned by Mehetab
// DO NOT EDIT — ask Mehetab if you need changes here
// Everyone imports from this file

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// TODO: Mehetab fills this in at hackathon start
const firebaseConfig = {
  apiKey: "AIzaSyDt2_iNsq2ij24VOpDhYeqG0DzJThJv99g",
  authDomain: "aarogya-sanchalak.firebaseapp.com",
  databaseURL: "https://aarogya-sanchalak-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aarogya-sanchalak",
  storageBucket: "aarogya-sanchalak.firebasestorage.app",
  messagingSenderId: "713751207790",
  appId: "1:713751207790:web:2450de7850cb9329206b7f"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export default app;
