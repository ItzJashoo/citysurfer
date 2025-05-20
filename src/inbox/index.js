// src/inbox/index.js

import '../css/styles.css';
import { btnLogout } from './ui.js';

import { signOut, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  setDoc
} from 'firebase/firestore';

import { auth, db } from '../firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const msgForm = document.getElementById('messageForm');
  const msgInput = document.getElementById('messageInput');
  const msgList = document.getElementById('messageList');
  const params = new URLSearchParams(window.location.search);
  const recipientId = params.get('uid');

  const btnSchedule = document.getElementById('btnScheduleMeetup');
  const meetupModal = document.getElementById('meetupModal');
  const meetupForm = document.getElementById('meetupForm');
  const cancelBtn = document.getElementById('cancelMeetup');
  const inputDate = document.getElementById('meetupDate');
  const inputTime = document.getElementById('meetupTime');
  const inputAddress = document.getElementById('meetupAddress');

  const pendingList = document.getElementById('pendingMeetupsList');
  const outgoingList = document.getElementById('outgoingMeetupsList');
  const confirmedList = document.getElementById('confirmedMeetupsList');

  btnLogout?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.replace('login.html');
  });

  onAuthStateChanged(auth, async user => {
    if (!user) {
      window.location.replace('login.html');
      return;
    }

    const me = user.uid;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(today.getFullYear() + 1);

    const toLocalDateStr = date => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    inputDate.min = toLocalDateStr(tomorrow);
    inputDate.max = toLocalDateStr(oneYearFromNow);

    if (!window.__INBOX_BOUND) {
      window.__INBOX_BOUND = true;

      if (recipientId) {
        const udoc = await getDoc(doc(db, 'users', recipientId));
        const recipientName = udoc.exists() ? udoc.data().name : 'Them';

        const chatQ = query(
          collection(db, 'messages'),
          where('participants', 'array-contains', me),
          orderBy('timestamp', 'asc')
        );
        onSnapshot(chatQ, snap => {
          msgList.innerHTML = '';
          snap.forEach(d => {
            const m = d.data();
            if (!m.participants.includes(recipientId)) return;
            const li = document.createElement('li');
            li.textContent = `${m.from === me ? 'You' : recipientName}: ${m.text}`;
            msgList.appendChild(li);
          });
          msgList.scrollTop = msgList.scrollHeight;
        });
      }

      msgForm?.addEventListener('submit', async e => {
        e.preventDefault();
        if (!recipientId) return;
        const text = msgInput.value.trim();
        if (!text) return;
        await addDoc(collection(db, 'messages'), {
          from: me,
          to: recipientId,
          participants: [me, recipientId].sort(),
          text,
          timestamp: Timestamp.now()
        });
        msgInput.value = '';
      });

      btnSchedule?.addEventListener('click', () => {
        meetupModal.classList.remove('hidden');
      });
      cancelBtn?.addEventListener('click', () => {
        meetupModal.classList.add('hidden');
        meetupForm.reset();
      });

      meetupForm?.addEventListener('submit', async e => {
        e.preventDefault();
        if (!recipientId) return;

        const selectedDate = inputDate.valueAsDate;
        if (!selectedDate) {
          alert('Please select a date.');
          return;
        }

        const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
        const minDateOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0, 0);
        const maxDateOnly = new Date(oneYearFromNow.getFullYear(), oneYearFromNow.getMonth(), oneYearFromNow.getDate(), 0, 0, 0, 0);

        if (selectedDateOnly < minDateOnly || selectedDateOnly > maxDateOnly) {
          alert(`Date must be after ${toLocalDateStr(minDateOnly)} and before ${toLocalDateStr(maxDateOnly)}.`);
          return;
        }

        await addDoc(collection(db, 'meetupRequests'), {
          from: me,
          to: recipientId,
          participants: [me, recipientId].sort(),
          date: inputDate.value,
          time: inputTime.value,
          address: inputAddress.value,
          status: 'pending',
          timestamp: Timestamp.now()
        });

        meetupModal.classList.add('hidden');
        meetupForm.reset();
        alert('Meetup request sent!');
      });

      const pendingQ = query(
        collection(db, 'meetupRequests'),
        where('to', '==', me),
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
            li.textContent = `${r.date} @ ${r.time}, ${r.address}`;

            const btnContainer = document.createElement('div');
            btnContainer.style.display = 'inline-block';
            btnContainer.style.marginLeft = '10px';

            const acceptBtn = document.createElement('button');
            acceptBtn.textContent = 'Accept';
            acceptBtn.dataset.id = d.id;
            acceptBtn.className = 'accept bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded';

            const rejectBtn = document.createElement('button');
            rejectBtn.textContent = 'Reject';
            rejectBtn.dataset.id = d.id;
            rejectBtn.className = 'reject bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded';

            btnContainer.appendChild(acceptBtn);
            btnContainer.appendChild(rejectBtn);
            li.appendChild(btnContainer);

            pendingList.appendChild(li);
          });

          pendingList.querySelectorAll('.accept').forEach(btn =>
            btn.addEventListener('click', async () => {
              await updateDoc(doc(db, 'meetupRequests', btn.dataset.id), { status: 'accepted' });
            })
          );
          pendingList.querySelectorAll('.reject').forEach(btn =>
            btn.addEventListener('click', async () =>
              updateDoc(doc(db, 'meetupRequests', btn.dataset.id), { status: 'rejected' })
            )
          );
        }
      });

      const outgoingQ = query(
        collection(db, 'meetupRequests'),
        where('from', '==', me),
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

      const confirmedCache = {};
      const qToMe = query(
        collection(db, 'meetupRequests'),
        where('to', '==', me),
        where('status', '==', 'accepted'),
        orderBy('timestamp', 'asc')
      );
      const qFromMe = query(
        collection(db, 'meetupRequests'),
        where('from', '==', me),
        where('status', '==', 'accepted'),
        orderBy('timestamp', 'asc')
      );
      const renderConfirmed = () => {
        confirmedList.innerHTML = '';
        const meetings = Object.values(confirmedCache).filter(r =>
          r.participants.includes(recipientId)
        );
        if (!meetings.length) {
          confirmedList.innerHTML = '<li>No confirmed meetups.</li>';
          return;
        }
        meetings
          .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())
          .forEach(r => {
            const li = document.createElement('li');
            li.textContent = `${r.date} @ ${r.time}, ${r.address}`;
            confirmedList.appendChild(li);
          });
      };

      onSnapshot(qToMe, snap => {
        snap.forEach(d => (confirmedCache[d.id] = d.data()));
        renderConfirmed();
      });
      onSnapshot(qFromMe, snap => {
        snap.forEach(d => (confirmedCache[d.id] = d.data()));
        renderConfirmed();
      });

      const acceptedQ = query(
        collection(db, 'meetupRequests'),
        where('status', '==', 'accepted'),
        where('participants', 'array-contains', me),
        orderBy('timestamp', 'asc')
      );
      onSnapshot(acceptedQ, async snap => {
        for (const d of snap.docChanges()) {
          if (d.type !== 'added') continue;
          const req = d.doc.data();
          const meetupId = d.doc.id;
          const otherUid = req.participants.find(uid => uid !== me);
          if (!otherUid) continue;

          await setDoc(doc(db, 'meetupReviewPermissions', `${meetupId}_${me}`), {
            meetupId,
            reviewer: me,
            reviewee: otherUid,
            created: Timestamp.now()
          });

          await setDoc(doc(db, 'meetupReviewPermissions', `${meetupId}_${otherUid}`), {
            meetupId,
            reviewer: otherUid,
            reviewee: me,
            created: Timestamp.now()
          });
        }
      });
    }
  });
});
