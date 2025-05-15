import '../css/styles.css';
import {
  btnLogout
} from './ui';

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


// Firebase config
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
const db   = getFirestore(firebaseApp);

// Logout
const logout = async () => {
  await signOut(auth);
  console.log("Logged out. Redirecting to login page...");
  window.location.href = 'login.html';
};
btnLogout.addEventListener("click", logout);

// Tabs
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
  showTravelersTab();  // default
  tabTravelers.addEventListener('click', showTravelersTab);
  tabGuides.addEventListener('click',    showGuidesTab);

  const btnProfile = document.getElementById('btnProfile');
  btnProfile?.addEventListener('click', () => window.location.href = 'profile.html');
});

// ** Location form autofill + save + Nearby Travelers for guides **
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace('login.html');
    return;
  }

  // ——— your existing location form code here ———
  const locationForm  = document.getElementById('locationForm');
  const locationInput = document.getElementById('locationInput');
  const countrySelect = document.getElementById('countrySelect');
  if (locationForm && locationInput && countrySelect) {
    // pre‐fill
    try {
      const usnap = await getDoc(doc(db,'users',user.uid));
      if (usnap.exists() && usnap.data().location) {
        const [c,co] = usnap.data().location.split(',').map(s=>s.trim());
        if(c) locationInput.value=c;
        if(co) countrySelect.value=co;
      }
    } catch(e){ console.error(e); }

    // save
    locationForm.addEventListener('submit', async e => {
      e.preventDefault();
      const city    = locationInput.value.trim();
      const country = countrySelect.value;
      if (!city||!country) return alert('Enter both city & country');
      const loc = `${city}, ${country}`;
      await updateDoc(doc(db,'users',user.uid), { location: loc });
      alert('Location saved! Guides nearby will now see you.');
    });
  }

  // ——— new Nearby Travelers block ———
  // only populate when guide tab is visible
  if (GuidesContent) {
    const ul = document.getElementById('travelersList');
    if (ul) {
      ul.innerHTML = '<li>Loading…</li>';
      try {
        const yourSnap = await getDoc(doc(db,'users',user.uid));
        const loc = yourSnap.exists() ? yourSnap.data().homelocation : null;
        if (loc) {
          const q = query(collection(db,'users'), where('location','==',loc));
          const results = await getDocs(q);
          ul.innerHTML = '';  // clear loading
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

              // Create a "Message" button
              const btnMessage = document.createElement('button');
              btnMessage.textContent = 'Message';
              btnMessage.classList.add('ml-2', 'text-blue-500', 'underline');
              btnMessage.addEventListener('click', () => {
                // Redirect to inbox with receiver's ID
                window.location.href = `inbox.html?uid=${ds.id}`;
              });

              li.appendChild(btnMessage);
              ul.appendChild(li);

              count++;
            });
            if (count===0) ul.innerHTML = '<li>No other travelers found.</li>';
          }
        } else {
          ul.innerHTML = '<li>You have no location set.</li>';
        }
      } catch(err) {
        console.error('Error fetching travelers:',err);
        ul.innerHTML = '<li>Error loading travelers.</li>';
      }
    } else {
      console.error('Missing <ul id="travelersList"> in your HTML');
    }
  }
});
