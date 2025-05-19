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

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

// ← ONLY import these from your one firebase.js
import { auth, db } from '../firebase.js';

// Hide any login error on load
hideLoginError();

// ——— Firestore: create user profile if it doesn’t exist ———
const createUserProfileIfNeeded = async (user) => {
  const userRef  = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      name: "",
      age: null,
      homelocation: "",
      location: "",
      profilePicture: "",
      bio: "",
      connections: []
    });
  }
};

// ——— Authentication actions ———
const loginEmailPassword = async () => {
  try {
    await signInWithEmailAndPassword(auth, txtEmail.value, txtPassword.value);
    window.location.href = 'dashboard.html';
  } catch (error) {
    showLoginError(error);
  }
};

const createAccount = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      txtEmail.value,
      txtPassword.value
    );
    await createUserProfileIfNeeded(userCredential.user);
    window.location.href = 'dashboard.html';
  } catch (error) {
    showLoginError(error);
  }
};

const logout = async () => {
  await signOut(auth);
};

// ——— Monitor auth state ———
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await createUserProfileIfNeeded(user);
    if (location.pathname.includes('dashboard')) {
      showApp();
      showLoginState(user);
      hideLoginError();
    } else if (location.pathname.includes('login')) {
      location.href = 'dashboard.html';
    }
  } else {
    showLoginForm();
    const lbl = document.getElementById('lblAuthState');
    if (lbl) lbl.textContent = `You're not logged in.`;
  }
});

// ——— DOM event bindings ———
document.addEventListener('DOMContentLoaded', () => {
  btnLogin?.addEventListener('click', loginEmailPassword);
  btnSignup?.addEventListener('click', createAccount);
  btnLogout?.addEventListener('click', logout);

  // Forgot Password handler
  const resetBtn        = document.getElementById('btnReset');
  const resetEmailInput = document.getElementById('resetEmail');
  const resetMessage    = document.getElementById('resetMessage');

  resetBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
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
