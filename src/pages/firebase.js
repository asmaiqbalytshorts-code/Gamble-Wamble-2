import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB6kZe9g3YJvKEDB4AIfDDSZ4pGflAy1Uk",
  authDomain: "gamble-wamble.firebaseapp.com",
  projectId: "gamble-wamble",
  storageBucket: "gamble-wamble.firebasestorage.app",
  messagingSenderId: "44193618365",
  appId: "1:44193618365:web:747a79a18b4ff347435ad4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);