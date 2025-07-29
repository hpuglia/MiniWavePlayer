let status = document.getElementById('status');
let waveformContainer = document.getElementById('waveform');
let hoverTimeEl = document.getElementById('hover-time');
let playBtn = document.getElementById('play-btn');
let stopBtn = document.getElementById('stop-btn');
let currentVolume = 1;
let waveformLoaded = false;
let isPlaying = false;
let donationAsked = false;

const donationModal = document.getElementById('donation-modal');
const donateBtn = document.getElementById('donate-button');
const closeAppBtn = document.getElementById('close-app-button');

const wavesurfer = WaveSurfer.create({
  container: waveformContainer,
  waveColor: '#ffffffff',
  progressColor: '#9c0000ff',
  height: 200,
  cursorWidth: 0,
  backgroundColor: 'transparent',
  barWidth: 1,
  barGap: 1,
  responsive: true
});

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function updateDynamicTimeDisplay() {
  const current = formatTime(wavesurfer.getCurrentTime());
  const total = formatTime(wavesurfer.getDuration());
  document.getElementById('elapsed-time').innerText = current;
  document.getElementById('total-time').innerText = total;
}

function startTimeUpdater() {
  setInterval(() => {
    if (isPlaying) {
      updateDynamicTimeDisplay();
    }
  }, 100);
}

function loadAndPlayFile(filePath) {
  wavesurfer.load(filePath);
  waveformLoaded = true;
  status.innerText = 'Carregando...';

  const name = filePath.split(/[\\/]/).pop();
  document.getElementById('file-name-display').innerText = name;

  wavesurfer.once('ready', () => {
    status.innerText = '';
    updateDynamicTimeDisplay();

    wavesurfer.play().then(() => {
      isPlaying = true;
      playBtn.textContent = '❚❚';
    }).catch(() => {
      isPlaying = false;
      status.innerText = 'Clique para reproduzir';
      const playOnClick = () => {
        wavesurfer.play();
        isPlaying = true;
        playBtn.textContent = '❚❚';
        status.innerText = '';
        waveformContainer.removeEventListener('click', playOnClick);
      };
      waveformContainer.addEventListener('click', playOnClick);
    });
  });
}

playBtn.addEventListener('click', () => {
  if (wavesurfer.isPlaying()) {
    wavesurfer.pause();
    playBtn.textContent = '▶';
  } else {
    wavesurfer.play();
    playBtn.textContent = '❚❚';
  }
});

stopBtn.addEventListener('click', () => {
  wavesurfer.pause();
  wavesurfer.seekTo(0);
  isPlaying = false;
  playBtn.textContent = '▶';
  status.innerText = 'Parado';
  updateDynamicTimeDisplay();
});

wavesurfer.on('play', () => {
  isPlaying = true;
  playBtn.textContent = '❚❚';
  status.innerText = '';
});

wavesurfer.on('pause', () => {
  isPlaying = false;
  playBtn.textContent = '▶';
  status.innerText = 'Pausado';
});

wavesurfer.on('seek', () => {
  updateDynamicTimeDisplay();
});

wavesurfer.on('finish', () => {
  wavesurfer.seekTo(0);
  isPlaying = false;
  playBtn.textContent = '▶';
  wavesurfer.play();
});

waveformContainer.addEventListener('mousemove', (e) => {
  const percent = e.offsetX / waveformContainer.clientWidth;
  const time = percent * wavesurfer.getDuration();
  hoverTimeEl.innerText = formatTime(time);
});

waveformContainer.addEventListener('mouseleave', () => {
  // mantém último valor
});

waveformContainer.addEventListener('click', (e) => {
  const percent = e.offsetX / waveformContainer.clientWidth;
  wavesurfer.seekTo(percent);
});

waveformContainer.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  wavesurfer.pause();
  wavesurfer.seekTo(0);
  isPlaying = false;
  status.innerText = 'Parado';
  updateDynamicTimeDisplay();
});

waveformContainer.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.05 : -0.05;
  currentVolume = Math.max(0, Math.min(1, currentVolume + delta));
  wavesurfer.setVolume(currentVolume);
});

// Recebe arquivo do processo principal
window.electronAPI.onFilePath((filePath) => {
  loadAndPlayFile(filePath);
});

// Drag & drop
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file) return;

  const ext = file.name.toLowerCase();
  if (ext.endsWith('.mp3') || ext.endsWith('.wav')) {
    waveformLoaded = true;
    loadAndPlayFile(file.path);
  } else {
    alert('Formato de arquivo inválido. Use .mp3 ou .wav');
  }
});

document.addEventListener('click', (e) => {
  const closeBtn = document.getElementById('close-button');
  const donationModal = document.getElementById('donation-modal');

  // Se o clique estiver dentro do botão de fechar ou dentro do modal de doação, não abre seletor
  const isClickInsideExempt = (
    closeBtn.contains(e.target) ||
    donationModal.contains(e.target)
  );

  if (!waveformLoaded && !isClickInsideExempt) {
    window.electronAPI.requestOpenFile();
  }
});



// ESC, atalhos
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case ' ':
      e.preventDefault();
      wavesurfer.playPause();
      break;
    case 'ArrowRight':
      wavesurfer.seekTo(Math.min(1, wavesurfer.getCurrentTime() / wavesurfer.getDuration() + 0.02));
      break;
    case 'ArrowLeft':
      wavesurfer.seekTo(Math.max(0, wavesurfer.getCurrentTime() / wavesurfer.getDuration() - 0.02));
      break;
    case 'Escape':
      if (donationModal.style.display === 'flex') {
        donationModal.style.display = 'none';
      } else {
        showDonationModal();
      }
      break;
  }
});

// Botão fechar chama doação
document.getElementById('close-button').addEventListener('click', showDonationModal);

// Modal de doação
function showDonationModal() {
  if (!donationAsked) {
    donationAsked = true;
    donationModal.style.display = 'flex';

    donateBtn.onclick = () => {
      window.open("https://nubank.com.br/cobrar/na7j5/6847d4fc-4652-4c8c-9949-d499d2338b2a", '_blank');
    };

    closeAppBtn.onclick = () => {
      window.close();
    };
  } else {
    window.close();
  }
}

// Inicia relógio
startTimeUpdater();
