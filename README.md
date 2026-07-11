# Shopy — বাংলা ই-কমার্স ওয়েবসাইট (স্টোরফ্রন্ট + অ্যাডমিন প্যানেল)

## ফাইল স্ট্রাকচার
```
shopy/
├── index.html          # স্টোরফ্রন্ট (কাস্টমার-facing)
├── admin.html          # অ্যাডমিন প্যানেল
├── css/style.css       # সব স্টাইল
├── js/firebase-config.js  # Firebase কনফিগ (নিজের keys বসাতে হবে)
├── js/app.js           # স্টোরফ্রন্ট লজিক
└── js/admin.js         # অ্যাডমিন প্যানেল লজিক
```

## সেটআপ ধাপ

### ১. Firebase প্রজেক্ট তৈরি
1. https://console.firebase.google.com → "Add project"
2. প্রজেক্ট তৈরি হলে **Firestore Database** চালু করুন (production mode)
3. **Authentication → Sign-in method → Email/Password** চালু করুন
4. Authentication → Users থেকে একটি অ্যাডমিন ইউজার তৈরি করুন (ইমেইল + পাসওয়ার্ড) — এটি দিয়েই admin.html-এ লগইন করবেন

### ২. কনফিগ বসান
Firebase Console → Project Settings → General → "Your apps" → Web app যোগ করুন। যে config অবজেক্ট পাবেন, সেটা `js/firebase-config.js` ফাইলে বসান।

### ৩. Firestore সিকিউরিটি রুলস
Firestore → Rules ট্যাবে গিয়ে নিচেরটা বসান (শুধু লগইন করা অ্যাডমিন প্রোডাক্ট/অর্ডার এডিট করতে পারবে, কাস্টমাররা প্রোডাক্ট দেখতে ও অর্ডার দিতে পারবে):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

### ৪. ডিপ্লয় (Vercel)
এই ফোল্ডারটি GitHub-এ পুশ করে Vercel-এ ইম্পোর্ট করুন — এটি স্ট্যাটিক HTML/CSS/JS, তাই কোনো বিল্ড কমান্ড লাগবে না (Framework: "Other")।

## ফিচারসমূহ

**স্টোরফ্রন্ট (index.html)**
- প্রোডাক্ট গ্রিড, ক্যাটাগরি ফিল্টার, লাইভ সার্চ
- প্রোডাক্ট ডিটেইল মোডাল
- কার্ট (localStorage-এ সংরক্ষিত, পেজ রিফ্রেশেও থাকবে)
- চেকআউট ফর্ম (নাম, ফোন, ঠিকানা, ক্যাশ অন ডেলিভারি/বিকাশ) → Firestore-এ অর্ডার সেভ হয়
- Firestore-এ প্রোডাক্ট না থাকলে ডেমো প্রোডাক্ট দেখাবে (টেস্ট করার জন্য)

**অ্যাডমিন প্যানেল (admin.html)**
- Firebase Auth দিয়ে সুরক্ষিত লগইন
- ড্যাশবোর্ড: মোট প্রোডাক্ট, অর্ডার, বিক্রি, পেন্ডিং অর্ডার
- প্রোডাক্ট যোগ/এডিট/মুছুন (ছবি Base64 আকারে Firestore-এ সেভ হয় — Firebase Storage CORS সমস্যা এড়াতে)
- অর্ডার লিস্ট + স্ট্যাটাস পরিবর্তন (পেন্ডিং → প্রসেসিং → শিপড → ডেলিভারড/বাতিল)
- ক্যাটাগরি ব্যবস্থাপনা

## পরবর্তী উন্নতির আইডিয়া
- বিকাশ পেমেন্ট গেটওয়ে API ইন্টিগ্রেশন
- SMS/WhatsApp অর্ডার নোটিফিকেশন
- প্রোডাক্ট রিভিউ ও রেটিং
- একাধিক ছবি আপলোড (গ্যালারি)
