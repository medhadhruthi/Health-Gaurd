import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZqTeujtAhR_GinJMoGLWKdsFuqfzqc1w",
  authDomain: "health-guard-12948.firebaseapp.com",
  projectId: "health-guard-12948",
  storageBucket: "health-guard-12948.firebasestorage.app",
  messagingSenderId: "939876545459",
  appId: "1:939876545459:web:d7d681dbbe87915425d1c6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
