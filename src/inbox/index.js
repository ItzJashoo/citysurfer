import '../css/styles.css';
import { btnLogout } from './ui.js';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

onAuthStateChanged(auth, async user => {
    if (!user) {
      window.location.replace('login.html');
      return;
    }
  });