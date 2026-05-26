// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCb8psvXW8p62OYYzOXNEvAoG1I9jBFAKw",
  authDomain: "codegravity-b423c.firebaseapp.com",
  projectId: "codegravity-b423c",
  storageBucket: "codegravity-b423c.firebasestorage.app",
  messagingSenderId: "118845142740",
  appId: "1:118845142740:web:3f4fa4e5a11a31bbd9ad41",
  measurementId: "G-STCTXY6RY8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
