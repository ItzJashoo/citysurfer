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
} from './ui'

import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
// comment this line out when deploying to production
connectAuthEmulator(auth, "http://localhost:9099");

// Login using email/password
const loginEmailPassword = async () => {
  const loginEmail = txtEmail.value;
  const loginPassword = txtPassword.value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    console.log("Login successful. Redirecting...");
    window.location.href = 'dashboard.html';
  } catch (error) {
    console.log(error);
    showLoginError(error);
  }
}

// Create new account using email/password
const createAccount = async () => {
  const email = txtEmail.value;
  const password = txtPassword.value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    console.log("Account created. Redirecting...");
    window.location.href = 'dashboard.html';
  } catch (error) {
    console.log(`There was an error: ${error}`);
    showLoginError(error);
  }
}

// Monitor auth state
const monitorAuthState = async () => {
  onAuthStateChanged(auth, user => {
    if (user) {
      console.log("User is logged in:", user.email);
      // Only show app if already on dashboard
      if (window.location.pathname.includes('dashboard')) {
        showApp();
        showLoginState(user);
        hideLoginError();
      } else if (window.location.pathname.includes('login')) {
        // Already logged in on login page? Go to dashboard.
        window.location.href = 'dashboard.html';
      }
    } else {
      showLoginForm();
      const lblAuthState = document.getElementById('lblAuthState');
      if (lblAuthState) {
        lblAuthState.innerHTML = `You're not logged in.`;
      }
    }
  });
}

// Log out
const logout = async () => {
  await signOut(auth);
}

btnLogin.addEventListener("click", loginEmailPassword);
btnSignup.addEventListener("click", createAccount);
btnLogout.addEventListener("click", logout);

monitorAuthState();
