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
  orderBy,
  onSnapshot,
  addDoc,
  where,
  Timestamp
} from 'firebase/firestore';

// Firebase config
const firebaseApp = initializeApp({
  apiKey: "AIzaSyA_SIYh8CCbC12BmFOYS1VBSJLVnCBNu0c",
  authDomain: "citysurfer-609ab.firebaseapp.com",
  projectId: "citysurfer-609ab",
  storageBucket: "citysurfer-609ab.appspot.com",
  messagingSenderId: "736165172289",
  appId: "1:736165172289:web:0f75f82abf121cdb06e2c0",
  measurementId: "G-7LHT92W2NX"
});

const db = getFirestore();
const auth = getAuth();
const params = new URLSearchParams(window.location.search);
const recipientId = params.get('uid');

const msgForm = document.getElementById('messageForm');
const msgInput = document.getElementById('messageInput');
const msgList = document.getElementById('messageList');

// Redirect if not logged in
onAuthStateChanged(auth, async user => {
  if (!user || !recipientId) {
    window.location.replace('login.html');
    return;
  }

  // Realtime listener for messages
  const q = query(
    collection(db, 'messages'),
    where('from', 'in', [user.uid, recipientId]),
    where('to', 'in', [user.uid, recipientId]),
    orderBy('timestamp', 'asc')
  );

  onSnapshot(q, snapshot => {
    msgList.innerHTML = '';
    snapshot.forEach(doc => {
      const msg = doc.data();
      const li = document.createElement('li');
      li.textContent = `${msg.from === user.uid ? 'You' : 'Them'}: ${msg.text}`;
      msgList.appendChild(li);
    });
  });

  // Send message on submit
  msgForm.addEventListener('submit', async e => {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text) return;

    await addDoc(collection(db, 'messages'), {
      from: user.uid,
      to: recipientId,
      text,
      timestamp: Timestamp.now()
    });

    msgInput.value = '';
  });
});
