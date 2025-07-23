import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

console.log("Vite mode:", import.meta.env);
// console.log("API key in use:", import.meta.env.VITE_FIREBASE_API_KEY);
// console.log("API key in use:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
// console.log("API key in use:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
// console.log("API key in use:", import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
// console.log("API key in use:", import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
// console.log("API key in use:", import.meta.env.VITE_FIREBASE_APP_ID);
// console.log("API key in use:", import.meta.env.VITE_FIREBASE_MEASUREMENT_ID);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Expose db and Firestore functions globally for DevTools debugging
if (typeof window !== "undefined") {
  window.db = db;
  window.firestoreHelpers = {
    collection,
    getDocs,
    addDoc,
    doc,
    setDoc,
    deleteDoc,
    updateDoc,
    getDoc,
    query,
    where,
    orderBy,
    onSnapshot,
  };
}

export { db };
