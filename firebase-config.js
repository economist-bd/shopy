// ==========================================================================
// Firebase কনফিগারেশন
// নিজের Firebase প্রজেক্ট থেকে এই মানগুলো বসান
// Firebase Console > Project Settings > General > Your apps > SDK setup
// ==========================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Firestore কালেকশন রেফারেন্স
const productsRef = db.collection("products");
const ordersRef = db.collection("orders");
const categoriesRef = db.collection("categories");
