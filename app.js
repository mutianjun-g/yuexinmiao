(function () {
  "use strict";

  /* ---------- 歌词（内嵌，避免本地 file:// 读取失败） ---------- */

  var LRC = [
    "[00:00.00]间奏",
    "[00:04.74]我真的特别爱你",
    "[00:06.65]为什么你会落泪",
    "[00:12.81]我真的特别爱你",
    "[00:14.72]答应我不再流泪",
    "[00:16.85]在这世界没有",
    "[00:18.55]多少的时间能让我对你思念",
    "[00:20.67]我真的特别爱你",
    "[00:22.59]为什么你会落泪",
    "[00:28.96]我真的特别爱你",
    "[00:30.87]答应我不再流泪",
    "[00:32.78]在这世界没有",
    "[00:34.48]多少的时间能让我",
    "[00:36.61]对你思念",
    "[00:37.88]间奏",
    "[00:54.46]我真的特别爱你",
    "[00:56.58]为什么你会落泪",
    "[01:02.75]我真的特别爱你",
    "[01:04.44]答应我不再流泪",
    "[01:06.57]在这世界没有",
    "[01:08.27]多少的时间能让我对你思念",
    "[01:10.39]我真的特别爱你",
    "[01:12.52]为什么你会落泪",
    "[01:18.47]我真的特别爱你",
    "[01:20.38]答应我不再流泪",
    "[01:22.51]在这世界没有",
    "[01:24.21]多少的时间能让我",
    "[01:26.33]对你思念",
    "[01:27.82]间奏",
    "[01:44.39]我真的特别爱你",
    "[01:46.30]为什么你会落泪",
    "[01:52.25]我真的特别爱你",
    "[01:54.38]答应我不再流泪",
    "[01:56.29]在这世界没有",
    "[01:57.99]多少的时间能让我对你思念",
    "[02:00.33]我真的特别爱你",
    "[02:02.24]为什么你会落泪",
    "[02:08.19]我真的特别爱你",
    "[02:10.31]答应我不再流泪",
    "[02:12.23]在这世界没有",
    "[02:14.14]多少的时间能让我",
    "[02:16.48]对你思念",
    "[02:17.54]间奏"
  ].join("\n");

  var FALLBACK = "我真的特别爱你";

  function parseLRC(source) {
    var stampRe = /\[(\d+):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
    var lines = [];

    source.split(/\r?\n/).forEach(function (raw) {
      var line = raw.trim();
      if (!line) return;

      var stamps = [];
      var match;
      stampRe.lastIndex = 0;
      while ((match = stampRe.exec(line)) !== null) {
        stamps.push(match);
      }
      if (!stamps.length) return;

      var text = line.replace(stampRe, "").trim();

      stamps.forEach(function (m) {
        var frac = m[3] ? parseInt(m[3], 10) / Math.pow(10, m[3].length) : 0;
        lines.push({
          time: parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + frac,
          text: text
        });
      });
    });

    lines.sort(function (a, b) { return a.time - b.time; });
    return lines;
  }

  var lines = parseLRC(LRC);
  var times = lines.map(function (l) { return l.time; });

  function textAt(seconds) {
    if (!lines.length) return FALLBACK;
    var lo = 0;
    var hi = times.length;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (times[mid] <= seconds) lo = mid + 1;
      else hi = mid;
    }
    var idx = lo - 1;
    if (idx < 0) return FALLBACK;
    return lines[idx].text || FALLBACK;
  }

  /* ---------- 元素 ---------- */

  var audio = document.getElementById("audio");
  var lyricEl = document.getElementById("lyric");
  var progressEl = document.getElementById("progress");
  var barFill = document.getElementById("barFill");
  var toggleBtn = document.getElementById("toggleBtn");
  var muteBtn = document.getElementById("muteBtn");
  var veil = document.getElementById("veil");
  var hint = document.getElementById("hint");
  var hearts = document.getElementById("hearts");

  var playIcon = toggleBtn.querySelector(".ic-play");
  var pauseIcon = toggleBtn.querySelector(".ic-pause");
  var soundOnIcon = muteBtn.querySelector(".ic-on");
  var soundOffIcon = muteBtn.querySelector(".ic-off");

  var currentText = lyricEl.textContent;
  var fadeTimer = null;
  var started = false;

  /* ---------- 歌词淡入淡出 ---------- */

  function setLyric(text) {
    if (text === currentText) return;
    currentText = text;

    lyricEl.classList.add("swap");
    if (fadeTimer) clearTimeout(fadeTimer);
    fadeTimer = setTimeout(function () {
      lyricEl.textContent = text;
      lyricEl.classList.remove("swap");
    }, 150);
  }

  /* ---------- 播放 ---------- */

  function syncIcons() {
    var paused = audio.paused;
    playIcon.hidden = !paused;
    pauseIcon.hidden = paused;
    toggleBtn.setAttribute("aria-label", paused ? "播放" : "暂停");

    soundOnIcon.hidden = audio.muted;
    soundOffIcon.hidden = !audio.muted;
    muteBtn.setAttribute("aria-label", audio.muted ? "取消静音" : "静音");
    muteBtn.classList.toggle("is-muted", audio.muted);
  }

  function hideVeil() {
    if (!veil.classList.contains("gone")) {
      veil.classList.add("gone");
    }
  }

  function startPlayback() {
    var attempt = audio.play();
    started = true;
    hideVeil();
    document.querySelector(".stage").classList.remove("waiting");

    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(function () {
        hint.textContent = "浏览器阻止了自动播放，点右下角 ▶ 再试一次";
      });
    }
  }

  function togglePlay() {
    if (audio.paused) {
      startPlayback();
    } else {
      audio.pause();
    }
  }

  audio.volume = 0.85;

  audio.addEventListener("play", syncIcons);
  audio.addEventListener("pause", syncIcons);
  audio.addEventListener("volumechange", syncIcons);
  audio.addEventListener("error", function () {
    hint.textContent = "音频加载失败，只能看猫了";
  });

  toggleBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    togglePlay();
  });

  muteBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    audio.muted = !audio.muted;
    syncIcons();
  });

  document.querySelector(".cat").addEventListener("click", function () {
    if (veil.classList.contains("gone")) togglePlay();
  });

  veil.addEventListener("click", startPlayback);

  document.addEventListener("keydown", function (e) {
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;

    if (e.code === "Space") {
      e.preventDefault();
      if (veil.classList.contains("gone")) togglePlay();
      else startPlayback();
      return;
    }

    if (e.key === "Enter" && !veil.classList.contains("gone")) {
      e.preventDefault();
      startPlayback();
      return;
    }

    if (e.key === "m" || e.key === "M") {
      audio.muted = !audio.muted;
      syncIcons();
      return;
    }

    if (veil.classList.contains("gone") && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      var step = e.key === "ArrowRight" ? 5 : -5;
      if (audio.duration) {
        audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + step));
      }
    }
  });

  /* ---------- 进度条 ---------- */

  function seekFromEvent(e) {
    if (!audio.duration) return;
    var rect = progressEl.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    var ratio = Math.min(1, Math.max(0, x / rect.width));
    audio.currentTime = ratio * audio.duration;
    barFill.style.width = (ratio * 100) + "%";
    setLyric(textAt(audio.currentTime));
  }

  progressEl.addEventListener("click", seekFromEvent);
  progressEl.addEventListener("keydown", function (e) {
    if (!audio.duration) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      var delta = e.key === "ArrowRight" ? 5 : -5;
      audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + delta));
    }
  });

  /* ---------- 主循环 ---------- */

  function tick() {
    var t = audio.currentTime || 0;
    var duration = audio.duration || 0;

    if (duration > 0) {
      barFill.style.width = Math.min(100, (t / duration) * 100) + "%";
    }

    if (started) {
      setLyric(textAt(t));
    }

    requestAnimationFrame(tick);
  }

  /* ---------- 背景爱心 ---------- */

  function buildHearts() {
    var count = window.innerWidth < 640 ? 8 : 14;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < count; i++) {
      var heart = document.createElement("i");
      heart.textContent = "♥";
      heart.style.left = (Math.random() * 96 + 2) + "%";
      heart.style.fontSize = (9 + Math.random() * 13).toFixed(1) + "px";
      heart.style.setProperty("--o", (0.05 + Math.random() * 0.09).toFixed(3));
      heart.style.setProperty("--dx", (Math.random() * 80 - 40).toFixed(0) + "px");
      heart.style.animationDuration = (16 + Math.random() * 16).toFixed(1) + "s";
      heart.style.animationDelay = (-Math.random() * 28).toFixed(1) + "s";
      frag.appendChild(heart);
    }

    hearts.appendChild(frag);
  }

  /* ---------- 启动 ---------- */

  buildHearts();
  syncIcons();
  setLyric(FALLBACK);
  requestAnimationFrame(tick);

  // 直接带 #go 打开时跳过启动遮罩（调试 / 录屏用）
  if (location.hash === "#go") {
    startPlayback();
  }
})();
