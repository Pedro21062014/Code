import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCujx9dtdlojodcKa9IglL2NY6GQ4O8NHs",
  authDomain: "ps-eletronics.firebaseapp.com",
  projectId: "ps-eletronics",
  storageBucket: "ps-eletronics.firebasestorage.app",
  messagingSenderId: "423208830267",
  appId: "1:423208830267:web:3ef90c621ef65083ba231e",
  measurementId: "G-2Q799D2W7Z"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);