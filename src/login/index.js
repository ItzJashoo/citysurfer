// src/login/index.js

// 1) Bundle in your cursor-wave logic
import './cursor-wave.js';

// 2) Your CSS
import '../css/styles.css';

// 3) UI helper functions (no longer importing DOM refs)
import {
  hideLoginError,
  showLoginState,
  showLoginForm,
  showApp,
  showLoginError
} from './ui';

// 4) Firebase Auth & Firestore
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

// ——— Firestore: ensure user profile exists ———
async function createUserProfileIfNeeded(user) {
  const userRef  = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      name: '',
      age: null,
      homelocation: '',
      location: '',
      profilePicture: '',
      bio: '',
      connections: []
    });
  }
}

// ——— Wrap everything until DOM is ready ———
document.addEventListener('DOMContentLoaded', () => {
  // ——— Grab _every_ needed element locally ———
  const loginForm       = document.getElementById('loginForm');
  const txtEmail        = document.getElementById('txtEmail');
  const txtPassword     = document.getElementById('txtPassword');
  const btnLogin        = document.getElementById('btnLogin');
  const btnSignup       = document.getElementById('btnSignup');
  const btnLogout       = document.getElementById('btnLogout');
  const resetBtn        = document.getElementById('btnReset');
  const resetEmailInput = document.getElementById('resetEmail');
  const resetMessage    = document.getElementById('resetMessage');
  const actionSelect    = document.getElementById('actionSelect');
  const resetGroup      = document.getElementById('resetGroup');

  // Hide any leftover error
  hideLoginError();

  // ——— Auth State Listener ———
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

  // ——— Auth Action Handlers ———
  let loginInProgress = false;
  const loginEmailPassword = async (e) => {
    e.preventDefault();
    if (loginInProgress) return;
    loginInProgress = true;
    btnLogin.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, txtEmail.value, txtPassword.value);
      window.location.href = 'dashboard.html';
    } catch (err) {
      showLoginError(err);
      btnLogin.disabled = false;
      loginInProgress = false;
    }
  };

  let signupInProgress = false;
  const createAccount = async (e) => {
    e.preventDefault();
    if (signupInProgress) return;
    signupInProgress = true;
    btnSignup.disabled = true;
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth, txtEmail.value, txtPassword.value
      );
      await createUserProfileIfNeeded(userCred.user);
      window.location.href = 'dashboard.html';
    } catch (err) {
      showLoginError(err);
      btnSignup.disabled = false;
      signupInProgress = false;
    }
  };

  let resetInProgress = false;
  const handleReset = async (e) => {
    e.preventDefault();
    if (resetInProgress) return;
    resetInProgress = true;
    resetBtn.disabled = true;
    const email = resetEmailInput.value.trim();
    if (!email) {
      resetMessage.textContent = 'Please enter your email address.';
      resetBtn.disabled = false;
      resetInProgress = false;
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      resetMessage.textContent = 'Password reset email sent! Check your inbox.';
    } catch (err) {
      resetMessage.textContent = err.message;
    } finally {
      resetBtn.disabled = false;
      resetInProgress = false;
    }
  };

  // ——— Single-time Event Binding ———
  if (!window.__CITYSURFER_UI_BOUND) {
    window.__CITYSURFER_UI_BOUND = true;

    // Prevent form submit reload
    if (loginForm) {
      loginForm.addEventListener('submit', e => e.preventDefault());
    }

    if (btnLogin)    btnLogin.addEventListener('click', loginEmailPassword);
    if (btnSignup)   btnSignup.addEventListener('click', createAccount);
    if (btnLogout)   btnLogout.addEventListener('click', () => signOut(auth));

    if (actionSelect && resetGroup) {
      actionSelect.addEventListener('change', () => {
        resetGroup.style.display = actionSelect.value === 'forgot' ? 'flex' : 'none';
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', handleReset);
    }
  }
});
