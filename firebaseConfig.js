// src/js/firebase-config.js
import dotenv from 'dotenv';
dotenv.config();
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
// You can remove getAnalytics, getFirestore imports if you ONLY want auth for now
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-analytics.js";
// import { getFirestore } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const firebaseConfig = {
  // Your project config details...
  apiKey: "process.env.FIREBASE_API_KEY",
  authDomain: "citysurfer-609ab.firebaseapp.com",
  projectId: "citysurfer-609ab",
  storageBucket: "citysurfer-609ab.firebasestorage.app",
  messagingSenderId: "736165172289",
  appId: "1:736165172289:web:0f75f82abf121cdb06e2c0",
  measurementId: "G-7LHT92W2NX" // Keep this if you want Analytics initialized
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Only keep if you want analytics now

export const auth = getAuth(app); // Initialize and EXPORT Auth

// export const db = getFirestore(app); // Remove or comment out if only doing auth
