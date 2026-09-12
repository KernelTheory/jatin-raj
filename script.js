const songs = [
  { title: "Zara si ek baat", id: "EveW_3WtmPs", art: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=240&q=80" },
  { title: "Andheri Si", id: "pU_Ei35MlpA", art: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=240&q=80" },
  { title: "Phir Se", id: "BhQ3LNHqnC8", art: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=240&q=80" },
  { title: "Ishq-e-Bazaar", id: "gbYTO8Ol67U", art: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=240&q=80" },
  { title: "Bagawat", id: "36PTtkktWtM", art: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=240&q=80" },
  { title: "Papa mummy ne mar li", id: "P22WUe86cLg", art: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=240&q=80" }
];

let player;
let preloadPlayer;
let currentIndex = 0;
let progressTimer;
let playerReady = false;
let preloadReady = false;
let preloadedIndex;

const title = document.querySelector("#track-title");
const count = document.querySelector("#track-count");
const progress = document.querySelector("#progress");
const elapsed = document.querySelector("#elapsed");
const duration = document.querySelector("#duration");
const playToggle = document.querySelector("#play-toggle");
const playerPanel = document.querySelector("#player-panel");
const recordToggle = document.querySelector("#record-toggle");
const recordCover = document.querySelector("#record-cover");
const soundWave = document.querySelector("#sound-wave");
const playlistPanel = document.querySelector("#playlist-panel");
const queueList = document.querySelector("#queue-list");
const youtubeLink = document.querySelector("#youtube-link");
const themeToggle = document.querySelector("#theme-toggle");
const themeToggleLabel = document.querySelector("#theme-toggle-label");
const sceneImages = document.querySelectorAll(".scene-image");
const intro = document.querySelector(".intro");
const siteHeader = document.querySelector(".site-header");
const playerMain = document.querySelector(".player-main");
const collaboration = document.querySelector(".collaboration");
const ambientLight = document.querySelector(".ambient-light");

if (window.Motion && window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const { animate } = Motion;
  const spring = { type: "spring", stiffness: 115, damping: 22, mass: 0.65 };
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let motionFrame;

  const moveLayers = () => {
    const horizontal = pointerX / window.innerWidth * 2 - 1;
    const vertical = pointerY / window.innerHeight * 2 - 1;
    animate(sceneImages, { x: -horizontal * 14, y: -vertical * 9, scale: 1.035 }, spring);
    animate(siteHeader, { x: horizontal * 4, y: vertical * 2 }, spring);
    animate(intro, { x: horizontal * 9, y: vertical * 6 }, spring);
    animate(playerMain, { x: -horizontal * 4, y: -vertical * 2 }, spring);
    animate(collaboration, { x: -horizontal * 7, y: -vertical * 4 }, spring);
    animate(ambientLight, { x: pointerX, y: pointerY, opacity: 0.72 }, { duration: 0.35, ease: "easeOut" });
    motionFrame = undefined;
  };

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!motionFrame) motionFrame = window.requestAnimationFrame(moveLayers);
  });

  document.addEventListener("mouseout", (event) => {
    if (event.relatedTarget) return;
    animate(sceneImages, { x: 0, y: 0, scale: 1.02 }, spring);
    animate([siteHeader, intro, playerMain, collaboration], { x: 0, y: 0 }, spring);
    animate(ambientLight, { opacity: 0 }, { duration: 0.3 });
  });
}

function renderQueue() {
  queueList.innerHTML = songs.map((song, index) => `
    <button class="queue-track${index === currentIndex ? " is-current" : ""}" type="button" data-index="${index}" aria-label="Play ${song.title}">
      <img src="${song.art}" alt="" />
      <span class="queue-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="queue-name">${song.title}</span>
    </button>
  `).join("");
}

function formatTime(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function updateSongDetails() {
  const song = songs[currentIndex];
  title.textContent = song.title;
  count.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(songs.length).padStart(2, "0")}`;
  playToggle.setAttribute("aria-label", `Play ${song.title}`);
  youtubeLink.href = `https://music.youtube.com/watch?v=${song.id}`;
  recordCover.src = song.art;
  queueList.querySelectorAll(".queue-track").forEach((track, index) => track.classList.toggle("is-current", index === currentIndex));
}

function updateProgress() {
  if (!playerReady) return;
  const total = player.getDuration();
  const current = player.getCurrentTime();
  if (Number.isFinite(total) && total > 0) {
    progress.max = Math.floor(total);
    progress.value = Math.floor(current);
    elapsed.textContent = formatTime(current);
    duration.textContent = formatTime(total);
  }
}

function preloadNextSong() {
  const nextIndex = (currentIndex + 1) % songs.length;
  if (!preloadReady || preloadedIndex === nextIndex) return;
  preloadPlayer.cueVideoById(songs[nextIndex].id);
  preloadedIndex = nextIndex;
}

function setPlaying(isPlaying) {
  playToggle.setAttribute("aria-label", `${isPlaying ? "Pause" : "Play"} ${songs[currentIndex].title}`);
  playerPanel.classList.toggle("is-playing", isPlaying);
  if (isPlaying) soundWave?.play?.();
  else soundWave?.pause?.();
  window.clearInterval(progressTimer);
  if (isPlaying) {
    progressTimer = window.setInterval(updateProgress, 500);
    preloadNextSong();
  }
}

function loadSong(index, autoplay = true) {
  currentIndex = (index + songs.length) % songs.length;
  preloadedIndex = undefined;
  updateSongDetails();
  playerPanel.classList.remove("is-playing");
  progress.value = 0;
  progress.max = 0;
  elapsed.textContent = "0:00";
  duration.textContent = "--:--";
  if (!playerReady) return;
  player.loadVideoById(songs[currentIndex].id);
  if (!autoplay) player.pauseVideo();
}

renderQueue();

window.onYouTubeIframeAPIReady = () => {
  const playerVars = { autoplay: 0, controls: 0, playsinline: 1, rel: 0 };
  if (window.location.origin !== "null") playerVars.origin = window.location.origin;

  player = new YT.Player("youtube-player", {
    height: "200",
    width: "200",
    videoId: songs[currentIndex].id,
    playerVars,
    events: {
      onReady: () => {
        playerReady = true;
        progress.disabled = false;
        playToggle.disabled = false;
      },
      onStateChange: (event) => {
        const playing = event.data === YT.PlayerState.PLAYING;
        setPlaying(playing);
        if (event.data === YT.PlayerState.ENDED) loadSong(currentIndex + 1);
      },
      onError: () => {
        setPlaying(false);
      }
    }
  });

  preloadPlayer = new YT.Player("youtube-preloader", {
    height: "1",
    width: "1",
    playerVars,
    events: {
      onReady: () => {
        preloadReady = true;
        if (playerPanel.classList.contains("is-playing")) preloadNextSong();
      }
    }
  });
};

playToggle.addEventListener("click", () => {
  if (!playerReady) return;
  if (player.getPlayerState() === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
});

function setPlaylistOpen(isOpen) {
  playerPanel.classList.toggle("is-queue-open", isOpen);
  recordToggle.setAttribute("aria-expanded", String(isOpen));
  recordToggle.setAttribute("aria-label", `${isOpen ? "Hide" : "Show"} playlist`);
  playlistPanel.setAttribute("aria-hidden", String(!isOpen));
}

recordToggle.addEventListener("click", () => {
  setPlaylistOpen(!playerPanel.classList.contains("is-queue-open"));
});

document.addEventListener("click", (event) => {
  if (!playerPanel.contains(event.target)) setPlaylistOpen(false);
});

document.querySelector("#previous").addEventListener("click", () => loadSong(currentIndex - 1));
document.querySelector("#next").addEventListener("click", () => loadSong(currentIndex + 1));

queueList.addEventListener("click", (event) => {
  const track = event.target.closest(".queue-track");
  if (track) loadSong(Number(track.dataset.index));
});

progress.addEventListener("input", () => {
  if (playerReady) player.seekTo(Number(progress.value), true);
  elapsed.textContent = formatTime(Number(progress.value));
});

themeToggle.addEventListener("click", () => {
  const isLight = document.body.dataset.theme === "light";
  document.body.dataset.theme = isLight ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(!isLight));
  themeToggleLabel.textContent = isLight ? "Light mode" : "Dark mode";
});
