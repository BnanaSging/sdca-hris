import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA2JYt0VAJwU5MVyYiz0mUcyM0wCsZJONg",
  authDomain: "sdca-hris.firebaseapp.com",
  projectId: "sdca-hris",
  storageBucket: "sdca-hris.firebasestorage.app",
  messagingSenderId: "665109477130",
  appId: "1:665109477130:web:16c57a15468576f137acf3",
  measurementId: "G-NWZX47B1WZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);
