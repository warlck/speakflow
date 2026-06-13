import { EXERCISES } from './exercises.js';

export function renderExerciseList(container, onSelectCallback) {
  container.innerHTML = '';
  EXERCISES.forEach(ex => {
    const card = document.createElement('div');
    card.className = 'card-glass';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">${ex.icon}</div>
      <h3>${ex.title}</h3>
      <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">${ex.description}</p>
    `;
    card.addEventListener('click', () => onSelectCallback(ex));
    container.appendChild(card);
  });
}

export function drawWaveform(canvas, audioContext, analyser) {
  if (!canvas || !analyser) return;
  // Match the drawing buffer to the displayed size to avoid stretching/blur
  canvas.width = canvas.clientWidth || canvas.width;
  canvas.height = canvas.clientHeight || canvas.height;
  const ctx = canvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  let animFrameId;

  function draw() {
    animFrameId = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = '#0a0c16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#8b5cf6'; // accent purple
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }

  draw();

  return () => {
    cancelAnimationFrame(animFrameId);
  };
}

export function renderCustomAudioPlayer(container, audioUrl) {
  container.innerHTML = '';
  const player = document.createElement('div');
  player.className = 'audio-player-container';
  player.innerHTML = `
    <div class="audio-controls">
      <button id="btn-audio-play" class="btn btn-secondary" style="padding: 0.5rem 1rem;">▶️ Play Recording</button>
    </div>
    <div class="audio-progress">
      <div class="audio-progress-bar" id="audio-progress-bar"></div>
    </div>
    <audio id="feedback-audio" src="${audioUrl}"></audio>
  `;

  container.appendChild(player);

  const audio = player.querySelector('#feedback-audio');
  const playBtn = player.querySelector('#btn-audio-play');
  const progressBar = player.querySelector('#audio-progress-bar');
  const progressContainer = player.querySelector('.audio-progress');

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playBtn.innerText = '⏸️ Pause';
    } else {
      audio.pause();
      playBtn.innerText = '▶️ Play';
    }
  });

  audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / audio.duration) * 100 || 0;
    progressBar.style.width = `${pct}%`;
  });

  audio.addEventListener('ended', () => {
    playBtn.innerText = '▶️ Play';
    progressBar.style.width = '0%';
  });

  progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
  });
}
