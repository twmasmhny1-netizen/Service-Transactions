// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // حط بياناتك هنا بالضبط زي ما جاتلك من Firebase
 apiKey: "AIzaSyBCDNv7GHabIlt8nHBnYnTP9Z0o3Oej2Ig",
  authDomain: "my-app-daebb.firebaseapp.com",
  databaseURL: "https://my-app-daebb-default-rtdb.firebaseio.com",
  projectId: "my-app-daebb",
  storageBucket: "my-app-daebb.firebasestorage.app",
  messagingSenderId: "579101318192",
  appId: "1:579101318192:web:1a24660b9d3f9f3bfde1f5"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة قاعدة البيانات
export const db = getFirestore(app);