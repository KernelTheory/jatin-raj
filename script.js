const songs = [
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
const playlistPanel = document.querySelector("#playlist-panel");
const queueList = document.querySelector("#queue-list");
const youtubeLink = document.querySelector("#youtube-link");
const themeToggle = document.querySelector("#theme-toggle");
const themeToggleLabel = document.querySelector("#theme-toggle-label");
const liquidDisplacement = document.querySelector("#liquid-displacement");
const liquidNoise = document.querySelector("#liquid-noise");
const fluidTargets = document.querySelectorAll(".fluid-reactive");
const sceneLens = document.querySelector(".scene-lens");

if (liquidDisplacement && liquidNoise && window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const motion = { x: window.innerWidth / 2, y: window.innerHeight / 2, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2, lastX: window.innerWidth / 2, lastY: window.innerHeight / 2 };
  let fluidFrame;
  let active = false;

  const distanceTo = (rect, x, y) => {
    const offsetX = Math.max(rect.left - x, 0, x - rect.right);
    const offsetY = Math.max(rect.top - y, 0, y - rect.bottom);
    return Math.hypot(offsetX, offsetY);
  };

  const renderFluid = (time) => {
    if (!active) return;
    motion.lastX = motion.x;
    motion.lastY = motion.y;
    motion.x += (motion.targetX - motion.x) * 0.24;
    motion.y += (motion.targetY - motion.y) * 0.24;
    const velocityX = motion.x - motion.lastX;
    const velocityY = motion.y - motion.lastY;
    const speed = Math.hypot(velocityX, velocityY);
    const strength = 18 + Math.min(speed * 4, 50);
    liquidDisplacement.setAttribute("scale", strength.toFixed(1));
    liquidNoise.setAttribute("baseFrequency", `${(0.007 + Math.sin(time * 0.001) * 0.002).toFixed(3)} ${(0.014 + Math.cos(time * 0.0013) * 0.003).toFixed(3)}`);
    sceneLens.style.setProperty("--fluid-x", `${motion.x}px`);
    sceneLens.style.setProperty("--fluid-y", `${motion.y}px`);
    sceneLens.classList.add("is-visible");
    fluidTargets.forEach((target) => {
      const distance = distanceTo(target.getBoundingClientRect(), motion.x, motion.y);
      const impact = target.classList.contains("scene-lens-art") ? 1 : Math.max(0, 1 - distance / 360);
      target.classList.toggle("is-fluid-reactive", impact > 0.02);
      target.style.setProperty("--fluid-shift-x", `${(velocityX * impact * 0.45).toFixed(2)}px`);
      target.style.setProperty("--fluid-shift-y", `${(velocityY * impact * 0.45).toFixed(2)}px`);
    });
    fluidFrame = window.requestAnimationFrame(renderFluid);
  };

  window.addEventListener("pointermove", (event) => {
    motion.targetX = event.clientX;
    motion.targetY = event.clientY;
    active = true;
    if (!fluidFrame) fluidFrame = window.requestAnimationFrame(renderFluid);
  });
  window.addEventListener("blur", () => {
    active = false;
    window.cancelAnimationFrame(fluidFrame);
    fluidFrame = undefined;
    liquidDisplacement.setAttribute("scale", "0");
    fluidTargets.forEach((target) => target.classList.remove("is-fluid-reactive"));
    sceneLens.classList.remove("is-visible");
  });
  document.addEventListener("mouseout", (event) => {
    if (!event.relatedTarget) {
      active = false;
      window.cancelAnimationFrame(fluidFrame);
      fluidFrame = undefined;
      liquidDisplacement.setAttribute("scale", "0");
      fluidTargets.forEach((target) => target.classList.remove("is-fluid-reactive"));
      sceneLens.classList.remove("is-visible");
    }
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
  playToggle.querySelector("span").textContent = isPlaying ? "❚❚" : "▶";
  playToggle.setAttribute("aria-label", `${isPlaying ? "Pause" : "Play"} ${songs[currentIndex].title}`);
  playerPanel.classList.toggle("is-playing", isPlaying);
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

recordToggle.addEventListener("click", () => {
  const isOpen = playerPanel.classList.toggle("is-queue-open");
  recordToggle.setAttribute("aria-expanded", String(isOpen));
  recordToggle.setAttribute("aria-label", `${isOpen ? "Hide" : "Show"} playlist`);
  playlistPanel.setAttribute("aria-hidden", String(!isOpen));
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
