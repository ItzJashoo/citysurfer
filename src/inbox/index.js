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
  Timestamp
} from 'firebase/firestore';

// ——— Firebase init ———
const firebaseApp = initializeApp({
  apiKey:    "AIzaSyA_SIYh8CCbC12BmFOYS1VBSJLVnCBNu0c",
  authDomain:"citysurfer-609ab.firebaseapp.com",
  projectId: "citysurfer-609ab",
  storageBucket: "citysurfer-609ab.appspot.com",
  messagingSenderId: "736165172289",
  appId:     "1:736165172289:web:0f75f82abf121cdb06e2c0",
  measurementId: "G-7LHT92W2NX"
});
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
    return console.error('Missing recipient UID in URL');
  }
  if (chatInitialized) return;
  chatInitialized = true;

  // Create sorted participants array for consistent ordering
  const participants = [user.uid, recipientId].sort();

  // Query messages where participants match (array equality)
  const chatQ = query(
    collection(db, 'messages'),
    where('participants', '==', participants),
    orderBy('timestamp', 'asc')
  );

  onSnapshot(chatQ,
    snap => {
      msgList.innerHTML = '';
      snap.forEach(docSnap => {
        const m = docSnap.data();
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
        participants: participants,  // <--- Added participants array here
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
