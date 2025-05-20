// cursor-wave.js
if (!window.__CITYSURFER_CURSOR_BOUND) {
  window.__CITYSURFER_CURSOR_BOUND = true;

  const cursor = document.getElementById('custom-cursor');
  const bigWave = document.getElementById('big-wave');
  const clicks = [];
  const threshold = 10;
  const windowMs = 1500;

  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });

  document.addEventListener('click', e => {
    const now = Date.now();
    while (clicks.length && now - clicks[0] > windowMs) clicks.shift();
    clicks.push(now);

    const wave = document.createElement('span');
    wave.className = 'wave';
    wave.style.left = `${e.clientX}px`;
    wave.style.top  = `${e.clientY}px`;
    document.body.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());

    if (clicks.length >= threshold) {
      bigWave.classList.add('show');
      setTimeout(() => bigWave.classList.remove('show'), 3000);
      clicks.length = 0;
    }
  });
}
