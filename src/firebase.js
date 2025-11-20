import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase Console에서 복사한 설정을 여기에 붙여넣으세요
const firebaseConfig = {
  apiKey: "AIzaSyCg9Ojdfgd7E7VNrE0KpOQlim3O0av3dBc",
  authDomain: "stock-dashboard-d73c5.firebaseapp.com",
  projectId: "stock-dashboard-d73c5",
  storageBucket: "stock-dashboard-d73c5.firebasestorage.app",
  messagingSenderId: "856127595204",
  appId: "1:856127595204:web:eea81e9af99ff78e659f91",
  measurementId: "G-FP8E7QPGBM"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);