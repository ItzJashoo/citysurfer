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

const auth = getAuth(firebaseApp);
// Use emulator for local testing remove during production
//connectAuthEmulator(auth, "http://localhost:9099");

const logout = async () => {
  await signOut(auth);
  console.log("Logged out. Redirecting to login page...");
  window.location.href = 'login.html';
};

btnLogout.addEventListener("click", logout);
onAuthStateChanged(auth, user => {
  if (!user) {
    // Not logged in — send them back to the login page
    window.location.replace('login.html');
  }
});
// Tab elements
const tabTravelers     = document.getElementById('tabTravelers');
const tabGuides   = document.getElementById('tabGuides');
const TravelersContent = document.getElementById('TravelersContent');
const GuidesContent = document.getElementById('GuidesContent');

function showTravelersTab() {
  // Highlight Travelers tab
  tabTravelers.classList.add('border-blue-500', 'text-blue-600');
  tabGuides.classList.remove('border-blue-500', 'text-blue-600');

  // Show/hide content
  TravelersContent.classList.remove('hidden');
  GuidesContent.classList.add('hidden');
}

function showGuidesTab() {
  // Highlight Guides tab
  tabGuides.classList.add('border-blue-500', 'text-blue-600');
  tabTravelers.classList.remove('border-blue-500', 'text-blue-600');

  // Show/hide content
  GuidesContent.classList.remove('hidden');
  TravelersContent.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  // Default to the Travelers tab
  showTravelersTab();

  // Wire up clicks
  tabTravelers.addEventListener('click', showTravelersTab);
  tabGuides.addEventListener('click', showGuidesTab);
});

  const btnProfile = document.getElementById('btnProfile');
  btnProfile.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });