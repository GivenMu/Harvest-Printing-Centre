// Shared Firebase setup for every page. Import { db, auth } from "./firebase-init.js".
// The web config below is public by design: access is controlled by the Firestore
// rules in database/firestore.rules, not by hiding these values.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAObkg1J4OJGS9WQPo1u_d3wE0Yn0wz5KM",
  authDomain: "harvest-printing-centre.firebaseapp.com",
  projectId: "harvest-printing-centre",
  storageBucket: "harvest-printing-centre.firebasestorage.app",
  messagingSenderId: "895161653548",
  appId: "1:895161653548:web:571e54b048783d5603f489",
  measurementId: "G-4VZPDLK528"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
