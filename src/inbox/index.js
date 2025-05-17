import '../css/styles.css';
import { btnLogout } from './ui.js';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth, signOut, onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection, query, where, orderBy, onSnapshot,
  addDoc, doc, getDoc, updateDoc, Timestamp
} from 'firebase/firestore';

// ——— Firebase init ———
const firebaseConfig = {
  apiKey: "AIzaSyA_SIYh8CCbC12BmFOYS1VBSJLVnCBNu0c",
  authDomain: "citysurfer-609ab.firebaseapp.com",
  projectId: "citysurfer-609ab",
  storageBucket: "citysurfer-609ab.appspot.com",
  messagingSenderId: "736165172289",
  appId: "1:736165172289:web:0f75f82abf121cdb06e2c0",
  measurementId: "G-7LHT92W2NX"
};

let firebaseApp;
if (!window.__firebaseInitialized) {
  window.__firebaseInitialized = true;
  if (!getApps().length) {
    console.log('Initializing Firebase…');
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    console.log('Re-using existing Firebase app');
    firebaseApp = getApp();
  }
} else {
  console.log('Firebase init skipped');
  firebaseApp = getApp();
}

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ——— UI refs ———
const msgForm = document.getElementById('messageForm');
const msgInput = document.getElementById('messageInput');
const msgList = document.getElementById('messageList');
const btnSchedule = document.getElementById('btnScheduleMeetup');
const pendingList = document.getElementById('pendingMeetupsList');
const confirmedList = document.getElementById('confirmedMeetupsList');
const params = new URLSearchParams(window.location.search);
const recipientId = params.get('uid');

btnLogout?.addEventListener('click', async () => {
  await signOut(auth);
  window.location.replace('login.html');
});

onAuthStateChanged(auth, async user => {
  if (!user) return window.location.replace('login.html');
  if (!recipientId) return console.error('No recipientId');

  // 1) Schedule Meetup → create meetupRequests doc
  // Open modal on button click
  btnSchedule?.addEventListener('click', () => {
    document.getElementById('meetupModal').classList.remove('hidden');
  });

  const meetupForm = document.getElementById('meetupForm');
  const cancelBtn = document.getElementById('cancelMeetup');
  const modal = document.getElementById('meetupModal');
  const inputDate = document.getElementById('meetupDate');
  const inputTime = document.getElementById('meetupTime');
  const inputAddress = document.getElementById('meetupAddress');

  // Cancel modal
  cancelBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
    meetupForm.reset();
  });

  // Submit meetup form
  meetupForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const date = inputDate.value;
    const time = inputTime.value;
    const address = inputAddress.value;

    try {
      await addDoc(collection(db, 'meetupRequests'), {
        from: auth.currentUser.uid,
        to: recipientId,
        participants: [auth.currentUser.uid, recipientId],
        date,
        address,
        time,
        status: 'pending',
        timestamp: Timestamp.now()
      });
      alert('Meetup request sent!');
      modal.classList.add('hidden');
      meetupForm.reset();
    } catch (err) {
      console.error('Error sending request:', err);
      alert('Failed to send meetup request');
    }
  });

  // 2) Pending requests **to** me
  const pendingQ = query(
    collection(db, 'meetupRequests'),
    where('to', '==', user.uid),
    where('status', '==', 'pending'),
    orderBy('timestamp', 'asc')
  );
  onSnapshot(pendingQ, snap => {
    pendingList.innerHTML = '';
    if (snap.empty) {
      pendingList.innerHTML = '<li>No pending meetups.</li>';
    } else {
      snap.forEach(d => {
        const r = d.data();
        const li = document.createElement('li');
        li.innerHTML = `
          ${r.date} @ ${r.time}, ${r.address}
          <button data-id="${d.id}" class="accept ml-2 px-2 py-1 bg-green-500 text-white rounded">Accept</button>
          <button data-id="${d.id}" class="reject ml-1 px-2 py-1 bg-red-500 text-white rounded">Reject</button>
        `;
        pendingList.appendChild(li);
      });
      pendingList.querySelectorAll('.accept').forEach(btn =>
        btn.addEventListener('click', async e => {
          await updateDoc(doc(db, 'meetupRequests', e.target.dataset.id), { status: 'accepted' });
        })
      );
      pendingList.querySelectorAll('.reject').forEach(btn =>
        btn.addEventListener('click', async e => {
          await updateDoc(doc(db, 'meetupRequests', e.target.dataset.id), { status: 'rejected' });
        })
      );
    }
  });

  // 2.5) Outgoing meetup requests I sent (without cancel button)
  const outgoingList = document.getElementById('outgoingMeetupsList');
  const outgoingQ = query(
    collection(db, 'meetupRequests'),
    where('from', '==', user.uid),
    where('status', '==', 'pending'),
    orderBy('timestamp', 'asc')
  );

  onSnapshot(outgoingQ, snap => {
    outgoingList.innerHTML = '';
    if (snap.empty) {
      outgoingList.innerHTML = '<li>No outgoing requests.</li>';
    } else {
      snap.forEach(d => {
        const r = d.data();
        const li = document.createElement('li');
        li.textContent = `${r.date} @ ${r.time}, ${r.address}`;
        outgoingList.appendChild(li);
      });
    }
  });

  // 3) Confirmed meetups between us
  const confirmedList = document.getElementById('confirmedMeetupsList');
  let confirmedCache = {};

  function renderConfirmed() {
    confirmedList.innerHTML = '';
    const meetings = Object.values(confirmedCache).filter(r =>
      r.participants.includes(recipientId)
    );
    if (meetings.length === 0) {
      confirmedList.innerHTML = '<li>No confirmed meetups.</li>';
      return;
    }
    meetings.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
    for (const r of meetings) {
      const li = document.createElement('li');
      li.textContent = `${r.date} @ ${r.time}, ${r.address}`;
      confirmedList.appendChild(li);
    }
  }

  const qToMe = query(
    collection(db, 'meetupRequests'),
    where('to', '==', user.uid),
    where('status', '==', 'accepted'),
    orderBy('timestamp', 'asc')
  );
  onSnapshot(qToMe, snap => {
    snap.forEach(d => { confirmedCache[d.id] = d.data() });
    renderConfirmed();
  });

  const qFromMe = query(
    collection(db, 'meetupRequests'),
    where('from', '==', user.uid),
    where('status', '==', 'accepted'),
    orderBy('timestamp', 'asc')
  );
  onSnapshot(qFromMe, snap => {
    snap.forEach(d => { confirmedCache[d.id] = d.data() });
    renderConfirmed();
  });

  // 4) Existing chat logic
  const userDoc = await getDoc(doc(db, 'users', recipientId));
  const recipientName = userDoc.exists() ? userDoc.data().name : 'Them';
  const chatQ = query(
    collection(db, 'messages'),
    where('participants', 'array-contains', user.uid),
    orderBy('timestamp', 'asc')
  );
  onSnapshot(chatQ, snap => {
    msgList.innerHTML = '';
    snap.forEach(d => {
      const m = d.data();
      if (!m.participants.includes(recipientId)) return;
      const li = document.createElement('li');
      li.textContent = `${m.from === user.uid ? 'You' : recipientName}: ${m.text}`;
      msgList.appendChild(li);
    });
    msgList.scrollTop = msgList.scrollHeight;
  });

  msgForm.addEventListener('submit', async e => {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text) return;
    await addDoc(collection(db, 'messages'), {
      from: user.uid,
      to: recipientId,
      participants: [user.uid, recipientId].sort(),
      text,
      timestamp: Timestamp.now()
    });
    msgInput.value = '';
  });
});
