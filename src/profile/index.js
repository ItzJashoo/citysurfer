import '../css/styles.css';
import { btnLogout } from './ui.js';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
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

// Utility to detect base64 images
const isBase64Image = str => typeof str === 'string' && str.startsWith('data:image/');

// --- Logout handler ---
btnLogout?.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'login.html';
});

// --- Firestore profile update with confirmation ---
async function updateProfile(user, profileData) {
  try {
    await updateDoc(doc(db, 'users', user.uid), profileData);

    // Show confirmation
    const msg = document.getElementById('updateMessage');
    if (msg) {
      msg.textContent = '🎉 Profile updated successfully!';
      msg.classList.remove('text-red-600');
      msg.classList.add('text-green-500');
    }


  } catch (err) {
    console.error('Error updating profile:', err);
    const msg = document.getElementById('updateMessage');
    if (msg) {
      msg.textContent = `Error: ${err.message}`;
      msg.classList.remove('text-green-500');
      msg.classList.add('text-red-600');
    }
  }
}

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  // --- Mobile menu toggle ---
  const btnMobileMenu = document.getElementById('btnMobileMenu');
  const mobileMenu    = document.getElementById('mobileMenu');
  btnMobileMenu?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden');
  });

  // --- Navigation buttons ---
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

  // --- Password reset dropdown & handler ---
  const actionSelect  = document.getElementById('actionSelect');
  const resetGroup    = document.getElementById('resetGroup');
  const resetEmailIn  = document.getElementById('resetEmail');
  const btnReset      = document.getElementById('btnReset');
  const resetMessage  = document.getElementById('resetMessage');

  actionSelect?.addEventListener('change', () => {
    resetGroup.style.display = actionSelect.value === 'forgot' ? 'flex' : 'none';
    resetMessage.textContent = '';
  });

  btnReset?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = resetEmailIn.value.trim();
    if (!email) {
      resetMessage.textContent = 'Please enter your email address.';
      resetMessage.classList.add('text-red-600');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      resetMessage.textContent = '✅ Check your email for a password-reset link.';
      resetMessage.classList.remove('text-red-600');
      resetMessage.classList.add('text-green-500');
      setTimeout(() => resetMessage.textContent = '', 10000);
    } catch (err) {
      resetMessage.textContent = `Error: ${err.message}`;
      resetMessage.classList.add('text-red-600');
    }
  });

  // --- Profile form & preview setup ---
  const form         = document.getElementById('profileForm');
  const nameInput    = document.getElementById('name');
  const ageInput     = document.getElementById('age');
  const cityInput    = document.getElementById('city');
  const countryInput = document.getElementById('country');
  const bioInput     = document.getElementById('bio');
  const pictureInput = document.getElementById('profilePicture');
  const previewImg   = document.getElementById('profilePreview');

  // Pre-fill when user logs in
  onAuthStateChanged(auth, async user => {
    if (!user) {
      window.location.replace('login.html');
      return;
    }
    currentUser = user;

    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data();
      nameInput.value  = data.name || '';
      ageInput.value   = data.age  ?? '';
      bioInput.value   = data.bio || '';

      if (data.homelocation) {
        const [c='', cn=''] = data.homelocation.split(',').map(s=>s.trim());
        cityInput.value    = c;
        countryInput.value = cn;
      }

      if (data.profilePicture && (isBase64Image(data.profilePicture) || data.profilePicture.startsWith('http'))) {
        previewImg.src = data.profilePicture;
        previewImg.classList.remove('hidden');
      }
    }
  });

  // Handle profile form submission
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentUser) return;

    const profileData = {
      name:         nameInput.value.trim(),
      age:          parseInt(ageInput.value.trim()) || null,
      homelocation: `${cityInput.value.trim()}, ${countryInput.value.trim()}`.replace(/^,|,$/g,'').trim(),
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
