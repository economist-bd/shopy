// ==========================================================================
// Firebase কনফিগারেশন — shopy-dd4a6 প্রজেক্ট
// ==========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBOFkPM-Mzh_M70SRyDBQaZHzuku8r3ECo",
  authDomain: "shopy-dd4a6.firebaseapp.com",
  projectId: "shopy-dd4a6",
  storageBucket: "shopy-dd4a6.firebasestorage.app",
  messagingSenderId: "770209997649",
  appId: "1:770209997649:web:c868b1ba9de8c86e8e2970",
  measurementId: "G-Q2G6LK77QR"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Firestore কালেকশন রেফারেন্স
const productsRef = db.collection("products");
const ordersRef = db.collection("orders");
const categoriesRef = db.collection("categories");
