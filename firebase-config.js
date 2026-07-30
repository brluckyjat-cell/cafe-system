import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbxtIQ8OkNC9f4rDAG42mo-r3AllDr2YI",
  authDomain: "my-cafe-app-fb7ba.firebaseapp.com",
  projectId: "my-cafe-app-fb7ba",
  storageBucket: "my-cafe-app-fb7ba.firebasestorage.app",
  messagingSenderId: "227548526389",
  appId: "1:227548526389:web:e20f674879277ddf12fe7c",
  measurementId: "G-SP32DJ8042"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
