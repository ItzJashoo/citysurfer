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
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

// Firebase config & initialization
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
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Logout function
const logout = async () => {
  await signOut(auth);
  console.log("Logged out. Redirecting to login page...");
  window.location.href = 'login.html';
};

btnLogout.addEventListener("click", logout);

// Profile update function
const updateProfile = async (user, profileData) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, profileData);
    console.log("Profile updated successfully.");
    window.location.href = 'dashboard.html';
  } catch (error) {
    console.error("Error updating profile:", error);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const profileForm = document.getElementById('profileForm');
  const nameInput = document.getElementById('name');
  const ageInput = document.getElementById('age');
  const homeLocationInput = document.getElementById('homelocation');
  const bioInput = document.getElementById('bio');
  const profilePictureInput = document.getElementById('profilePicture');

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.replace('login.html');
    } else {
      // Pre-fill profile if it exists
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        nameInput.value = data.name || '';
        ageInput.value = data.age || '';
        homeLocationInput.value = data.homelocation || '';
        bioInput.value = data.bio || '';
      }

      // Submit handler
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const age = parseInt(ageInput.value.trim());
        const homelocation = homeLocationInput.value.trim();
        const bio = bioInput.value.trim();
        const file = profilePictureInput.files[0];

        const profileData = { name, age, homelocation, bio };

        if (file) {
          // Upload profile picture
          const storageRef = ref(storage, `profilePictures/${user.uid}`);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          profileData.profilePicture = downloadURL;
        }

        await updateProfile(user, profileData);
      });
    }
  });
});
