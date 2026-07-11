// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBOFkPM-Mzh_M70SRyDBQaZHzuku8r3ECo",
  authDomain: "shopy-dd4a6.firebaseapp.com",
  projectId: "shopy-dd4a6",
  storageBucket: "shopy-dd4a6.firebasestorage.app",
  messagingSenderId: "770209997649",
  appId: "1:770209997649:web:c868b1ba9de8c86e8e2970",
  measurementId: "G-Q2G6LK77QR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
