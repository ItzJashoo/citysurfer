// src/dashboard/index.js

import '../css/styles.css';
import { btnLogout } from './ui.js';

// ——— Firebase instances ———
import { auth, db } from '../firebase.js';
import {
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  onSnapshot,
  orderBy,
  addDoc,
  Timestamp
} from 'firebase/firestore';

// ——— Logout ———
btnLogout?.addEventListener('click', async () => {
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
  document.getElementById('btnInbox')?.addEventListener('click', () => {
    window.location.href = 'inbox.html';
  });
  document.getElementById('btnInboxMobile')?.addEventListener('click', () => {
    window.location.href = 'inbox.html';
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

  // — Inbox Badge Logic —
  const inboxBadge = document.getElementById('inboxBadge');
  if (inboxBadge) {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('to', '==', user.uid),
        where('read', '==', false)
      );
      const unreadSnap = await getDocs(q);
      if (!unreadSnap.empty) {
        inboxBadge.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Error checking unread messages:', err);
    }
  }

  // — Nearby Travelers (Guides tab) —
  if (GuidesContent) {
    const ul = document.getElementById('travelersList');
    if (!ul) return console.error('Missing #travelersList');
    ul.innerHTML = '<li>Loading…</li>';

    try {
      const yourSnap = await getDoc(doc(db,'users',user.uid));
      const home = yourSnap.exists() ? yourSnap.data().location : null;
      if (!home) {
        ul.innerHTML = '<li>You have no home location set.</li>';
      } else {
        const q = query(collection(db,'users'), where('location','==',home));
        const results = await getDocs(q);
        ul.innerHTML = '';
        let count = 0;
        results.forEach(ds => {
          if (ds.id === user.uid) return;
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
    } catch(err) {
      console.error('Error fetching travelers:', err);
      ul.innerHTML = '<li>Error loading travelers.</li>';
    }
  }

  // — Inbox Name Display —
  const inboxList = document.getElementById('inboxList');
  if (inboxList) {
    try {
      const q = query(collection(db, 'messages'), where('to', '==', user.uid));
      const inboxSnap = await getDocs(q);
      inboxList.innerHTML = '';
      if (inboxSnap.empty) {
        inboxList.innerHTML = '<li>No messages yet.</li>';
      } else {
        for (const docSnap of inboxSnap.docs) {
          const msg = docSnap.data();
          let senderName = msg.from;
          try {
            const senderSnap = await getDoc(doc(db, 'users', senderName));
            if (senderSnap.exists()) {
              senderName = senderSnap.data().name || senderName;
            }
          } catch {
            console.warn('Could not fetch sender name');
          }
          const li = document.createElement('li');
          li.textContent = `From ${senderName}: ${msg.text}`;
          inboxList.appendChild(li);
        }
      }
    } catch (err) {
      console.error('Error loading inbox:', err);
    }
  }

 
  // ——— Confirmed Meetups (both tabs) ———
  const listIds = ['confirmedMeetupsList', 'confirmedMeetupsListGuides'];
  const confirmedLists = listIds
    .map(id => document.getElementById(id))
    .filter(el => el);
  const confirmedCache = {};

  const qToMe = query(
    collection(db, 'meetupRequests'),
    where('to', '==', user.uid),
    where('status', '==', 'accepted'),
    orderBy('timestamp', 'asc')
  );
  const qFromMe = query(
    collection(db, 'meetupRequests'),
    where('from', '==', user.uid),
    where('status', '==', 'accepted'),
    orderBy('timestamp', 'asc')
  );

  function renderConfirmed() {
    const meetings = Object.values(confirmedCache)
      .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
    confirmedLists.forEach(ul => {
      ul.innerHTML = meetings.length
        ? meetings.map(r => `<li>${r.date} @ ${r.time}, ${r.address}</li>`).join('')
        : '<li>No confirmed meetups.</li>';
    });
  }

  onSnapshot(qToMe, snap => {
    snap.forEach(d => { confirmedCache[d.id] = d.data(); });
    renderConfirmed();
    checkForReviewPrompt();
  });
  onSnapshot(qFromMe, snap => {
    snap.forEach(d => { confirmedCache[d.id] = d.data(); });
    renderConfirmed();
    checkForReviewPrompt();
  });

  // ——— Rating Modal Logic ———
  const ratingModal   = document.getElementById('ratingModal');
  const ratingForm    = document.getElementById('ratingForm');
  const ratingCancel  = document.getElementById('ratingCancel');
  const messagesModal = document.getElementById('messagesModal');
  const closeMessages = document.getElementById('closeMessagesModal');
  let pendingReview   = null;
  let reviewQueue     = false;

  // When chat modal closes, trigger review if queued
  closeMessages?.addEventListener('click', () => {
    if (reviewQueue) {
      ratingModal.classList.remove('hidden');
      reviewQueue = false;
    }
  });

  function checkForReviewPrompt() {
    if (!ratingModal) return;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const cutoff = yesterday.toISOString().slice(0,10);

    for (const [meetupId, data] of Object.entries(confirmedCache)) {
      if (data.date > cutoff) continue;
      const otherUid = data.participants.find(uid => uid !== user.uid);
      if (!otherUid) continue;

      const key = `${meetupId}_${user.uid}`;
      window._reviewChecked = window._reviewChecked || {};
      if (window._reviewChecked[key]) continue;
      window._reviewChecked[key] = true;

      promptReviewIfNeeded(meetupId, otherUid);
      return;
    }
  }

  async function promptReviewIfNeeded(meetupId, otherUid) {
    const q = query(
      collection(db, 'meetupReviews'),
      where('meetupId', '==', meetupId),
      where('reviewer', '==', user.uid)
    );
    const res = await getDocs(q);
    if (res.empty && ratingModal) {
      pendingReview = { meetupId, otherUid };

      if (messagesModal && !messagesModal.classList.contains('hidden')) {
        reviewQueue = true;
      } else {
        ratingModal.classList.remove('hidden');
      }
    }
  }

  ratingCancel?.addEventListener('click', () => {
    ratingModal.classList.add('hidden');
    pendingReview = null;
  });

  ratingForm?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!pendingReview) return;

    const form = new FormData(ratingForm);
    const rating = Number(form.get('rating'));
    const comment = document.getElementById('ratingComment').value.trim();
    if (!rating || rating < 1 || rating > 5) {
      return alert('Select 1–5 stars.');
    }

    // 1) Create permission doc
    const permId = `${pendingReview.meetupId}_${user.uid}`;
    await setDoc(doc(db, 'meetupReviewPermissions', permId), {
      meetupId: pendingReview.meetupId,
      reviewer: user.uid,
      reviewee: pendingReview.otherUid,
      created: Timestamp.now()
    });

    // 2) Now create the review
    await addDoc(collection(db, 'meetupReviews'), {
      meetupId: pendingReview.meetupId,
      reviewer: user.uid,
      reviewee: pendingReview.otherUid,
      rating,
      comment,
      timestamp: Timestamp.now()
    });

    ratingModal.classList.add('hidden');
    pendingReview = null;
    alert('Thanks for your feedback!');
  });

});