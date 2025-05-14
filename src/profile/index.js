import '../css/styles.css';
import { btnLogout } from './ui.js';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

// --- Firebase config & init ---
const firebaseApp = initializeApp({
  apiKey: "AIzaSyA_SIYh8CCbC12BmFOYS1VBSJLVnCBNu0c",
  authDomain: "citysurfer-609ab.firebaseapp.com",
  projectId: "citysurfer-609ab",
  storageBucket: "citysurfer-609ab.appspot.com",
  messagingSenderId: "736165172289",
  appId: "1:736165172289:web:0f75f82abf121cdb06e2c0",
  measurementId: "G-7LHT92W2NX"
});
const auth = getAuth(firebaseApp);
const db   = getFirestore(firebaseApp);

// Utility: detect base64 image strings
const isBase64Image = str => typeof str === 'string' && str.startsWith('data:image/');

// --- Logout handler ---
btnLogout?.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'login.html';
});

// --- Firestore profile update ---
async function updateProfile(user, profileData) {
  try {
    await updateDoc(doc(db, 'users', user.uid), profileData);
    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error('Error updating profile:', err);
  }
}

// Keep track of the logged-in user
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  // --- Mobile menu toggle ---
  const btnMobileMenu = document.getElementById('btnMobileMenu');
  const mobileMenu    = document.getElementById('mobileMenu');
  btnMobileMenu?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden');
  });

  // --- Nav buttons ---
  document.getElementById('btnReturn')?.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
  document.getElementById('btnReturnMobile')?.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
  document.getElementById('btnLogoutMobile')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'login.html';
  });

  // --- Profile form & preview setup ---
  const form                = document.getElementById('profileForm');
  const nameInput           = document.getElementById('name');
  const ageInput            = document.getElementById('age');
  const homeLocationInput   = document.getElementById('homelocation');
  const bioInput            = document.getElementById('bio');
  const pictureInput        = document.getElementById('profilePicture');
  const previewImg          = document.getElementById('profilePreview');

  // Listen for auth state
  onAuthStateChanged(auth, async user => {
    if (!user) {
      window.location.replace('login.html');
      return;
    }
    currentUser = user;

    // Pre-fill the form
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data();
      nameInput.value         = data.name || '';
      ageInput.value          = data.age  || '';
      homeLocationInput.value = data.homelocation || '';
      bioInput.value          = data.bio  || '';
      if (data.profilePicture && (isBase64Image(data.profilePicture) || data.profilePicture.startsWith('http'))) {
        previewImg.src      = data.profilePicture;
        previewImg.classList.remove('hidden');
      }
    }
  });

  // Handle form submit
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentUser) return;

    const profileData = {
      name:         nameInput.value.trim(),
      age:          parseInt(ageInput.value.trim()) || null,
      homelocation: homeLocationInput.value.trim(),
      bio:          bioInput.value.trim()
    };

    const file = pictureInput.files[0];
    if (file) {
      if (file.size > 1_048_576) {
        alert('Please upload an image 1 MB or smaller.');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        profileData.profilePicture = reader.result;
        await updateProfile(currentUser, profileData);
      };
      reader.readAsDataURL(file);
    } else {
      await updateProfile(currentUser, profileData);
    }
  });

});
