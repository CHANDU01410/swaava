
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "maakhana-a2f53.firebaseapp.com",
  projectId: "maakhana-a2f53",
  storageBucket: "maakhana-a2f53.firebasestorage.app",
  messagingSenderId: "592008216029",
  appId: "1:592008216029:web:d2f780ba524e84ae07ca34",
  measurementId: "G-7T97J5S0YY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Analytics is optional — don't crash if it fails
try {
  const { getAnalytics } = await import("firebase/analytics");
  getAnalytics(app);
} catch (e) {
  // Analytics not available in this environment
}

export { app, auth }