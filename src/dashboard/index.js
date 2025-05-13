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
const tabGuide     = document.getElementById('tabGuide');
const tabVisitor   = document.getElementById('tabVisitor');
const guideContent = document.getElementById('guideContent');
const visitorContent = document.getElementById('visitorContent');

function showGuideTab() {
  // Highlight Guide tab
  tabGuide.classList.add('border-blue-500', 'text-blue-600');
  tabVisitor.classList.remove('border-blue-500', 'text-blue-600');

  // Show/hide content
  guideContent.classList.remove('hidden');
  visitorContent.classList.add('hidden');
}

function showVisitorTab() {
  // Highlight Visitor tab
  tabVisitor.classList.add('border-blue-500', 'text-blue-600');
  tabGuide.classList.remove('border-blue-500', 'text-blue-600');

  // Show/hide content
  visitorContent.classList.remove('hidden');
  guideContent.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  // Default to the Guide tab
  showGuideTab();

  // Wire up clicks
  tabGuide.addEventListener('click', showGuideTab);
  tabVisitor.addEventListener('click', showVisitorTab);
});

  const btnProfile = document.getElementById('btnProfile');
  btnProfile.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });