import { AuthErrorCodes } from 'firebase/auth';
export const btnLogout = document.querySelector('#btnLogout')
export const divAuthState = document.querySelector('#divAuthState')
export const lblAuthState = document.querySelector('#lblAuthState')
export const hideLoginError = () => {
  divLoginError.style.display = 'none'
  lblLoginErrorMessage.innerHTML = ''
}
