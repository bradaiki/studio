import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Firebase Configuration for Web Push Notifications
// Replace these placeholder values with your actual Firebase project credentials
// Get these from: https://console.firebase.google.com/
// Project Settings → General → Your apps → Web app

export const firebaseConfig = {
  apiKey: "AIzaSyCrHoODV_O57wX6WqAAGC-DSDq1BY0CLds",
  authDomain: "aiki-studios.firebaseapp.com",
  projectId: "aiki-studios",
  storageBucket: "aiki-studios.firebasestorage.app",
  messagingSenderId: "476918097897",
  appId: "1:476918097897:web:bd4b664af374116bd20d78",
  measurementId: "G-95B4JZWPY7"
};

// VAPID Key for Web Push
// Get this from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
export const vapidKey = "BMF-2pWg65zV3ibYsD1gB3a-T2zlipbBg9eHi05cbGSVnPFrlu3V70EhmXK0rd8Oq_I_TaLF4Tg-FvjvMjatJIg";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// TODO: Replace the placeholder values above with your actual Firebase credentials
// See WEB_PUSH_QUICK_START.md for instructions on how to get these values
