// ===== 배경음악 (BGM) =====
// 1) audio/bgm.mp3 파일이 있으면 그 음악을 반복 재생합니다.
// 2) 파일이 없으면 직접 작곡한 산사(山寺) 명상 테마를 브라우저에서 만들어 재생합니다. (저작권 걱정 없음)
// 브라우저 정책상 소리는 사용자가 버튼을 눌러야 시작돼요.

(() => {
  const BGM_FILE = "audio/bgm.mp3";
  const VOLUME = 0.35;
  const btn = document.getElementById("bgmBtn");
  if (!btn) return;

  let playing = false;
  let mode = null;        // "file" | "synth"
  let audio = null;

  // ----- 산사 명상 테마 (직접 작곡, 5음계) -----
  // [MIDI 음 번호 또는 null(쉼표), 길이(8분음표 개수)]
  const MELODY = [
    [69, 4], [67, 2], [64, 2],
    [67, 6], [null, 2],
    [72, 4], [69, 2], [67, 2],
    [69, 6], [null, 2],
    [64, 2], [67, 2], [69, 4],
    [72, 3], [74, 1], [72, 2], [69, 2],
    [67, 4], [64, 2], [62, 2],
    [60, 6], [null, 2],
  ];
  const DRONE_ROOTS = [45, 43, 45, 45, 48, 45, 43, 45]; // 마디마다 길게 울리는 낮은 음
  const BPM = 72;
  const EIGHTH = 60 / BPM / 2;
  const LOOP_LEN = 64;    // 8마디 × 8분음표 8개

  let ctx = null, master = null, timer = null;
  let step = 0, nextTime = 0;
  const melodyAt = [];    // 8분음표 위치별 [음, 길이]
  {
    let pos = 0;
    for (const [n, len] of MELODY) { melodyAt[pos] = [n, len]; pos += len; }
  }

  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // 부드럽게 들어왔다가 천천히 사라지는 음
  function tone(type, hz, start, dur, vol, attack = 0.06) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = hz;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(vol, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(master);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  // 싱잉볼: 배음이 어긋난 사인파 몇 개가 길게 울림
  function bowl(start) {
    [[220, 0.12], [592, 0.05], [1093, 0.025]].forEach(([hz, v]) => tone("sine", hz, start, 7, v, 0.02));
  }

  // 목탁: 짧고 둥근 나무 소리 (음높이가 살짝 떨어짐)
  function moktak(start) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(820, start);
    o.frequency.exponentialRampToValueAtTime(560, start + 0.08);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.16, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    o.connect(g).connect(master);
    o.start(start);
    o.stop(start + 0.15);
  }

  function schedule() {
    while (nextTime < ctx.currentTime + 0.15) {
      const s = step % LOOP_LEN;
      const m = melodyAt[s];
      if (m && m[0] !== null) tone("triangle", freq(m[0]), nextTime, m[1] * EIGHTH * 1.4, 0.13);
      if (s % 8 === 0) tone("sine", freq(DRONE_ROOTS[s / 8]), nextTime, 8 * EIGHTH * 1.1, 0.16, 0.6);
      if (s % 32 === 0) bowl(nextTime);
      if (s % 4 === 0) moktak(nextTime);
      nextTime += EIGHTH;
      step++;
    }
  }

  function startSynth() {
    mode = "synth";
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = VOLUME;
      master.connect(ctx.destination);
    }
    ctx.resume();
    step = 0;
    nextTime = ctx.currentTime + 0.05;
    clearInterval(timer);
    timer = setInterval(schedule, 25);
  }

  function stopSynth() {
    clearInterval(timer);
    if (ctx) ctx.suspend();
  }

  // ----- 재생 / 정지 -----
  function play() {
    playing = true;
    updateBtn();
    if (mode === "synth") return startSynth();
    if (!audio) {
      audio = new Audio(BGM_FILE);
      audio.loop = true;
      audio.volume = VOLUME;
      // 파일이 없거나 못 읽으면 직접 만든 음악으로
      audio.addEventListener("error", () => { if (playing) startSynth(); }, { once: true });
    }
    audio.play().then(() => { mode = "file"; }).catch((e) => {
      if (e.name !== "NotAllowedError" && playing) startSynth();
    });
  }

  function stop() {
    playing = false;
    updateBtn();
    if (audio) audio.pause();
    stopSynth();
  }

  function updateBtn() {
    btn.classList.toggle("on", playing);
    btn.setAttribute("aria-pressed", playing);
    btn.setAttribute("aria-label", playing ? "배경음악 끄기" : "배경음악 켜기");
    btn.querySelector(".text").textContent = playing ? "BGM ON" : "BGM OFF";
  }

  btn.addEventListener("click", () => (playing ? stop() : play()));
  updateBtn();
})();
