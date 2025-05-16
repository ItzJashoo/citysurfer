import '../css/styles.css';
import { btnLogout } from './ui.js';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

// ——— Firebase init ———
const firebaseApp = initializeApp({
  apiKey:    "AIzaSyA_SIYh8CCbC12BmFOYS1VBSJLVnCBNu0c",
  authDomain:"citysurfer-609ab.firebaseapp.com",
  projectId: "citysurfer-609ab",
  storageBucket: "citysurfer-609ab.firebasestorage.app",
  messagingSenderId: "736165172289",
  appId:     "1:736165172289:web:0f75f82abf121cdb06e2c0",
  measurementId: "G-7LHT92W2NX"
});
const auth = getAuth(firebaseApp);
const db   = getFirestore(firebaseApp);

// ——— Logout ———
btnLogout.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'login.html';
});

// ——— Tabs UI ———
const tabTravelers     = document.getElementById('tabTravelers');
const tabGuides        = document.getElementById('tabGuides');
const TravelersContent = document.getElementById('TravelersContent');
const GuidesContent    = document.getElementById('GuidesContent');
function showTravelersTab() {
  tabTravelers.classList.add('border-blue-500','text-blue-600');
  tabGuides.classList.remove('border-blue-500','text-blue-600');
  TravelersContent.classList.remove('hidden');
  GuidesContent.classList.add('hidden');
}
function showGuidesTab() {
  tabGuides.classList.add('border-blue-500','text-blue-600');
  tabTravelers.classList.remove('border-blue-500','text-blue-600');
  GuidesContent.classList.remove('hidden');
  TravelersContent.classList.add('hidden');
}
document.addEventListener('DOMContentLoaded', () => {
  showTravelersTab();
  tabTravelers.addEventListener('click', showTravelersTab);
  tabGuides.addEventListener('click',    showGuidesTab);
  document.getElementById('btnProfile')?.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });
});

// ——— Auth & data logic ———
onAuthStateChanged(auth, async user => {
  if (!user) {
    return window.location.replace('login.html');
  }

  // — Location form autofill & save —
  const locationForm  = document.getElementById('locationForm');
  const locationInput = document.getElementById('locationInput');
  const countrySelect = document.getElementById('countrySelect');
  if (locationForm && locationInput && countrySelect) {
    try {
      const usnap = await getDoc(doc(db,'users',user.uid));
      const data = usnap.exists() && usnap.data().location;
      if (data) {
        const [c,co] = data.split(',').map(s=>s.trim());
        if (c)  locationInput.value = c;
        if (co) countrySelect.value  = co;
      }
    } catch(e){ console.error('Load location error', e); }

    locationForm.addEventListener('submit', async e => {
      e.preventDefault();
      const city    = locationInput.value.trim();
      const country = countrySelect.value;
      if (!city || !country) {
        return alert('Enter both city & country');
      }
      const loc = `${city}, ${country}`;
      try {
        await updateDoc(doc(db,'users',user.uid), { location: loc });
        alert('Location saved! Guides nearby will now see you.');
      } catch(err) {
        console.error('Save location error', err);
        alert('Failed to save location.');
      }
    });
  }

  // — Nearby Travelers (Guides tab) —
  if (GuidesContent) {
    const ul = document.getElementById('travelersList');
    if (!ul) return console.error('Missing #travelersList');
    ul.innerHTML = '<li>Loading…</li>';

    try {
      const yourSnap = await getDoc(doc(db,'users',user.uid));
      const home = yourSnap.exists() ? yourSnap.data().homelocation : null;
      if (!home) {
        ul.innerHTML = '<li>You have no home location set.</li>';
      } else {
        const q = query(collection(db,'users'), where('location','==',home));
        const results = await getDocs(q);
        ul.innerHTML = '';
        if (results.empty) {
          ul.innerHTML = '<li>No travelers in your area yet.</li>';
        } else {
          let count = 0;
          results.forEach(ds => {
            if (ds.id === user.uid) return; // skip yourself
            const d = ds.data();
            const name = d.name || d.email || 'Unnamed';

            const li = document.createElement('li');
            li.textContent = name;

            const btnMsg = document.createElement('button');
            btnMsg.textContent = 'Message';
            btnMsg.classList.add('ml-2','text-blue-500','underline');
            btnMsg.addEventListener('click', () => {
              window.location.href = `inbox.html?uid=${ds.id}`;
            });

            li.appendChild(btnMsg);
            ul.appendChild(li);
            count++;
          });
          if (count === 0) {
            ul.innerHTML = '<li>No other travelers found.</li>';
          }
        }
      }
    } catch(err) {
      console.error('Error fetching travelers:', err);
      ul.innerHTML = '<li>Error loading travelers.</li>';
    }
  }
});
