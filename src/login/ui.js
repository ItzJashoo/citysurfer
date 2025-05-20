// src/login/ui.js

import { AuthErrorCodes } from 'firebase/auth';

// ── DOM containers ──
const loginContainer = document.getElementById('login');
const appContainer   = document.getElementById('app'); // make sure your dashboard HTML has <div id="app">

// ── Input & button refs ──
export const txtEmail    = document.querySelector('#txtEmail');
export const txtPassword = document.querySelector('#txtPassword');

export const btnLogin   = document.querySelector('#btnLogin');
export const btnSignup  = document.querySelector('#btnSignup');
export const btnLogout  = document.querySelector('#btnLogout');

export const divLoginError        = document.querySelector('#divLoginError');
export const lblLoginErrorMessage = document.querySelector('#lblLoginErrorMessage');
export const lblAuthState         = document.querySelector('#lblAuthState');

// ── UI functions ──
export const showLoginForm = () => {
  if (loginContainer) loginContainer.style.display = 'block';
  if (appContainer)   appContainer.style.display   = 'none';
};

export const showApp = () => {
  if (loginContainer) loginContainer.style.display = 'none';
  if (appContainer)   appContainer.style.display   = 'block';
};

export const hideLoginError = () => {
  if (divLoginError) {
    divLoginError.style.display = 'none';
    lblLoginErrorMessage.innerHTML = '';
  }
};

export const showLoginError = (error) => {
  if (!divLoginError) return;
  divLoginError.style.display = 'block';
  if (error.code === AuthErrorCodes.INVALID_PASSWORD) {
    lblLoginErrorMessage.innerHTML = `Wrong password. Try again.`;
  } else {
    lblLoginErrorMessage.innerHTML = `Error: ${error.message}`;
  }
};

export const showLoginState = (user) => {
  if (lblAuthState) {
    lblAuthState.innerHTML = `You're logged in as ${user.displayName || 'N/A'} (uid: ${user.uid}, email: ${user.email})`;
  }
};
