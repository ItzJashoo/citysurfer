import '../css/styles.css';
import {
  hideLoginError,
  showLoginState,
  showLoginForm,
  showApp,
  showLoginError,
  btnLogin,
  btnSignup,
  btnLogout
} from './ui';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';

import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

// Firebase config & initialization
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
const db = getFirestore(firebaseApp);

// Hide error on load
hideLoginError();

// Function to create a user profile doc in Firestore
const createUserProfileIfNeeded = async (user) => {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      name: "",
      age: null,
      homelocation: "",
      currentlocation: "",
      profilePicture: "",
      bio: "",
      connections: []
    });
  }
};

// Login function
const loginEmailPassword = async () => {
  const loginEmail = txtEmail.value;
  const loginPassword = txtPassword.value;

  try {
    await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    window.location.href = 'dashboard.html';
  } catch (error) {
    showLoginError(error);
  }
};

// Signup function
const createAccount = async () => {
  const email = txtEmail.value;
  const password = txtPassword.value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfileIfNeeded(userCredential.user);
    window.location.href = 'dashboard.html';
  } catch (error) {
    showLoginError(error);
  }
};

// Auth state monitoring
const monitorAuthState = () => {
  onAuthStateChanged(auth, async user => {
    if (user) {
      await createUserProfileIfNeeded(user);

      if (window.location.pathname.includes('dashboard')) {
        showApp();
        showLoginState(user);
        hideLoginError();
      } else if (window.location.pathname.includes('login')) {
        window.location.href = 'dashboard.html';
      }
    } else {
      showLoginForm();
      const lbl = document.getElementById('lblAuthState');
      if (lbl) lbl.textContent = `You're not logged in.`;
    }
  });
};

// Logout function
const logout = async () => {
  await signOut(auth);
};

// DOM event bindings
document.addEventListener('DOMContentLoaded', () => {
  btnLogin?.addEventListener('click', loginEmailPassword);
  btnSignup?.addEventListener('click', createAccount);
  btnLogout?.addEventListener('click', logout);
  monitorAuthState();
  hideLoginError();

  // Forgot Password handler
  const resetBtn = document.getElementById('btnReset');
  const resetEmailInput = document.getElementById('resetEmail');
  const resetMessage = document.getElementById('resetMessage');

  resetBtn?.addEventListener('click', async () => {
    const email = resetEmailInput.value.trim();
    if (!email) {
      resetMessage.textContent = 'Please enter your email address.';
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      resetMessage.textContent = 'Password reset email sent! Check your inbox.';
    } catch (err) {
      resetMessage.textContent = err.message;
    }
  });
});
