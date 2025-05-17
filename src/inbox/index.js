
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

// Log config to ensure we’re pointing at the right project
console.log('Initializing Firebase with:', {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

const firebaseApp = initializeApp(firebaseConfig);
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

// ——— Main listener ———
onAuthStateChanged(auth, user => {
  if (!user) {
    return window.location.replace('login.html');
  }
  if (!recipientId) {
    console.error('Missing recipient UID in URL');
    return;
  }
  if (chatInitialized) return;
  chatInitialized = true;

  // === SANITY-CHECK: Log the query filters ===
  console.log('Running chat query:', {
    filterField: 'participants',
    filterOp: 'array-contains',
    filterValue: user.uid
  });

  // === SANITY-CHECK: Manual single-doc fetch ===
  const testDocId = '51Mu2N5mJ7bJoeqfw5UBfc82Evg1';  // adjust as needed
  getDoc(doc(db, 'messages', testDocId))
    .then(d => {
      console.log(`getDoc(${testDocId}) allowed?`, d.exists(), d.data());
    })
    .catch(e => {
      console.error(`getDoc(${testDocId}) failed:`, e);
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
        // client-side filter to only this chat
        if (!m.participants.includes(recipientId)) return;

        const li = document.createElement('li');
        li.textContent = `${m.from === user.uid ? 'You' : 'Them'}: ${m.text}`;
        msgList.appendChild(li);
      });
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
