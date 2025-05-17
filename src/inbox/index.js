import '../css/styles.css';
import { btnLogout } from './ui.js';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';

// ——— Firebase init ———
const firebaseConfig = {
  apiKey:    "AIzaSyA_SIYh8CCbC12BmFOYS1VBSJLVnCBNu0c",
  authDomain:"citysurfer-609ab.firebaseapp.com",
  projectId: "citysurfer-609ab",
  storageBucket: "citysurfer-609ab.appspot.com",
  messagingSenderId: "736165172289",
  appId:     "1:736165172289:web:0f75f82abf121cdb06e2c0",
  measurementId: "G-7LHT92W2NX"
};

let firebaseApp;
if (!getApps().length) {
  console.log('Initializing Firebase with:', {
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId
  });
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const auth = getAuth(firebaseApp);
const db   = getFirestore(firebaseApp);

// ——— UI refs ———
const msgForm     = document.getElementById('messageForm');
const msgInput    = document.getElementById('messageInput');
const msgList     = document.getElementById('messageList');
const params      = new URLSearchParams(window.location.search);
const recipientId = params.get('uid');

let chatInitialized = false;

// ——— Logout ———
btnLogout?.addEventListener('click', async () => {
  await signOut(auth);
  window.location.replace('login.html');
});

// ——— Only attach listener once ———
if (!window.__chatAuthListenerAttached) {
  window.__chatAuthListenerAttached = true;

  onAuthStateChanged(auth, async user => {
    if (!user) {
      return window.location.replace('login.html');
    }
    if (!recipientId) {
      console.error('Missing recipient UID in URL');
      return;
    }
    if (chatInitialized) return;
    chatInitialized = true;

    // Fetch the recipient's display name
    let recipientName = 'Unknown';
    try {
      const userDoc = await getDoc(doc(db, 'users', recipientId));
      if (userDoc.exists()) {
        recipientName = userDoc.data().name;
      }
    } catch (nameErr) {
      console.error('Failed to fetch recipient name:', nameErr);
    }

    // === SANITY-CHECK: Log the query filters ===
    console.log('Running chat query:', {
      filterField: 'participants',
      filterOp: 'array-contains',
      filterValue: user.uid
    });

    // ——— Query only messages you’re a participant of ———
    const chatQ = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'asc')
    );

    onSnapshot(chatQ,
      snap => {
        msgList.innerHTML = '';
        snap.forEach(docSnap => {
          const m = docSnap.data();
          if (!m.participants.includes(recipientId)) return;

          const li = document.createElement('li');
          const senderLabel = m.from === user.uid ? 'You' : recipientName;
          li.textContent = `${senderLabel}: ${m.text}`;
          msgList.appendChild(li);
        });

        // ─── AUTO-SCROLL DOWN ───
        msgList.scrollTop = msgList.scrollHeight;
      },
      err => {
        console.error('Messages snapshot error:', err);
        msgList.innerHTML = `<li class="text-red-600">Error loading chat.</li>`;
      }
    );

    // — Send new messages — 
    msgForm?.addEventListener('submit', async e => {
      e.preventDefault();
      const text = msgInput.value.trim();
      if (!text) return;

      try {
        await addDoc(collection(db, 'messages'), {
          from:         user.uid,
          to:           recipientId,
          participants: [user.uid, recipientId].sort(),
          text,
          timestamp:    Timestamp.now()
        });
        msgInput.value = '';
      } catch (writeErr) {
        console.error('Send message error:', writeErr);
        alert('Failed to send message.');
      }
    });

  });
}
