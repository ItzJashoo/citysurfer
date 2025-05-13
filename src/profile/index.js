import '../css/styles.css';
import { 
  btnLogout
} from './ui'

import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  signOut,
  onAuthStateChanged,
  connectAuthEmulator
} from 'firebase/auth';

const firebaseApp = initializeApp({
  apiKey: "AIzaSyA_SIYh8CCbC12BmFOYS1VBSJLVnCBNu0c",
  authDomain: "citysurfer-609ab.firebaseapp.com",
  projectId: "citysurfer-609ab",
  storageBucket: "citysurfer-609ab.firebasestorage.app",
  messagingSenderId: "736165172289",
  appId: "1:736165172289:web:0f75f82abf121cdb06e2c0",
  measurementId: "G-7LHT92W2NX"
});

const logout = async () => {
  await signOut(auth);
  console.log("Logged out. Redirecting to login page...");
  window.location.href = 'login.html';
};
btnLogout.addEventListener("click", logout);
const auth = getAuth(firebaseApp);
onAuthStateChanged(auth, user => {
  if (!user) {
    // Not logged in — send them back to the login page
    window.location.replace('login.html');
  }
});

  const btnReturn = document.getElementById('btnReturn');
  btnReturn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });