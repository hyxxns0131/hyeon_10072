// ===== 첫 화면 · 목탁 키캡 · 흐르는 띠 · 수행 카드 · 동자승 대사 · 가이드 =====
// services(services.js)와 CATEGORIES, selectCategory 등(script.js)을 함께 사용합니다.

const $ = (id) => document.getElementById(id);

// ----- 수행별 AI 카드 (render() 때마다 개수 갱신) -----
function renderTypes() {
  const typeGrid = $("typeGrid");
  if (!typeGrid) return;
  typeGrid.innerHTML = CATEGORIES.filter((c) => c.name !== "전체").map((c) => {
    const n = services.filter((s) => s.category === c.name).length;
    return `
      <button class="type-card${n ? "" : " is-empty"}" type="button" data-category="${escapeHTML(c.name)}" style="--tc:${c.color}">
        <img class="type-photo" src="${photoImg(c.photos[0][0])}" alt="${escapeHTML(c.photos[0][1])}" loading="lazy" />
        <span class="type-top">
          <span class="type-label">${c.emoji} ${escapeHTML(c.type)}바라밀</span>
        </span>
        <span>
          <span class="type-name">${escapeHTML(c.name)}</span>
          <span class="type-count">${n ? `AI ${n}개 영접하기 →` : "아직 모신 AI 없음 · 정진 중"}</span>
        </span>
      </button>`;
  }).join("");
}

// 이름으로 목록의 카드를 찾아 이동 (필터 때문에 안 보이면 필터 해제)
function goToService(name) {
  let card = [...document.querySelectorAll(".card")].find((c) => c.dataset.name === name);
  if (!card) {
    currentCategory = "전체";
    keyword = "";
    searchInput.value = "";
    searchWrap.classList.remove("has-value");
    render();
    card = [...document.querySelectorAll(".card")].find((c) => c.dataset.name === name);
  }
  if (card) focusCard(card);
}

(() => {
  renderTypes();
  $("typeGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".type-card");
    if (card) selectCategory(card.dataset.category);
  });

  $("heroCount").textContent = services.length;

  // ----- 번뇌하는 목탁 키캡: 누를 때마다 번뇌 -1, 108번 누르면 해탈 -----
  const BEONNOE = 108;
  const key = $("moktakKey");
  const countEl = $("moktakCount");
  const labelEl = $("moktakLabel");
  const pops = $("moktakPops");
  const POP_WORDS = ["번뇌 -1", "공덕 +1", "집착 OUT", "마음 평화 +1", "극락 1cm 가까워짐", "업보 삭제", "멘탈 회복 +1"];
  let left = BEONNOE;
  try {
    const saved = parseInt(localStorage.getItem("moktak-left"), 10);
    if (saved >= 0 && saved <= BEONNOE) left = saved;
  } catch (e) { /* 저장소를 못 써도 그냥 108부터 */ }

  function showCount() {
    countEl.textContent = left;
    labelEl.textContent = left === 0 ? "해탈 완료! 🎉" : "남은 번뇌";
    key.classList.toggle("nirvana", left === 0);
  }
  showCount();

  // ----- 소리: 기계식 키보드 "도각"(누를 때) · "딸깍"(뗄 때) + 목탁 "톡" -----
  let actx = null;
  let noise = null;
  function audio() {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      // 키 소리에 쓸 하얀 잡음 (한 번만 만들어 재사용)
      noise = actx.createBuffer(1, actx.sampleRate * 0.2, actx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    actx.resume();
    return actx;
  }
  const vary = (v, amt = 0.08) => v * (1 - amt + Math.random() * amt * 2); // 매번 살짝 다르게

  // 잡음을 필터로 깎아서 짧게 터뜨림 (키캡이 부딪히는 소리)
  function burst(t, { freq, q, type = "bandpass", vol, dur }) {
    const src = actx.createBufferSource();
    const f = actx.createBiquadFilter();
    const g = actx.createGain();
    src.buffer = noise;
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(actx.destination);
    src.start(t, Math.random() * 0.1, dur + 0.02);
  }
  // 짧게 떨어지는 사인파 (바닥에 닿는 '퉁', 목탁 '톡')
  function knock(t, { from, to, vol, dur }) {
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function keyDownSound() {
    try {
      const t = audio().currentTime;
      burst(t, { freq: vary(5200), q: 0.9, type: "highpass", vol: 0.18, dur: 0.012 }); // 스위치 '딸'
      burst(t + 0.004, { freq: vary(1700), q: 1.1, vol: 0.55, dur: 0.045 });             // 키캡 '각'
      knock(t + 0.004, { from: vary(190), to: 85, vol: 0.45, dur: 0.06 });               // 바닥 '도'
    } catch (e) { /* 소리가 안 나도 동작은 그대로 */ }
  }
  function keyUpSound() {
    try {
      const t = audio().currentTime;
      burst(t, { freq: vary(3200), q: 1.4, vol: 0.22, dur: 0.025 });
      knock(t, { from: vary(420), to: 260, vol: 0.08, dur: 0.035 });
    } catch (e) { /* 무시 */ }
  }
  function tok() {
    try {
      const t = audio().currentTime + 0.02;
      knock(t, { from: vary(880, 0.04), to: 560, vol: 0.22, dur: 0.16 });
      knock(t, { from: vary(1760, 0.04), to: 1100, vol: 0.05, dur: 0.12 });
    } catch (e) { /* 무시 */ }
  }

  function popText(text) {
    const el = document.createElement("span");
    el.className = "moktak-pop";
    el.textContent = text;
    el.style.left = `${20 + Math.random() * 60}%`;
    el.style.setProperty("--tilt", `${Math.round(Math.random() * 24 - 12)}deg`);
    pops.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }

  function hit() {
    left = left === 0 ? BEONNOE : left - 1;
    try { localStorage.setItem("moktak-left", left); } catch (e) { /* 무시 */ }
    showCount();
    tok();
    popText(left === 0 ? "해탈 🎉" : POP_WORDS[Math.floor(Math.random() * POP_WORDS.length)]);
    key.classList.remove("hit");
    void key.offsetWidth; // 애니메이션 재시작
    key.classList.add("hit");
  }

  // 키캡처럼: 누르고 있는 동안 내려가 있고(도각), 떼면 올라옴(딸깍)
  function press(on) {
    if (on === key.classList.contains("pressed")) return;
    key.classList.toggle("pressed", on);
    on ? keyDownSound() : keyUpSound();
  }
  key.addEventListener("pointerdown", () => press(true));
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => key.addEventListener(ev, () => press(false)));
  key.addEventListener("keydown", (e) => { if (!e.repeat && (e.key === " " || e.key === "Enter")) press(true); });
  key.addEventListener("keyup", () => press(false));
  key.addEventListener("click", hit);

  // ----- 흐르는 띠 (같은 내용을 두 번 이어 붙여 끊김 없이 반복) -----
  const freeCount = services.filter((s) => s.price.includes("무료")).length;
  const items = [
    "NO 번뇌 JUST AI",
    "극락도 락이다",
    `AI ${services.length}개와 인연`,
    `${freeCount}개는 무료 보시`,
    "중생아 고생 많았다",
    `${CATEGORIES.length - 1}가지 바라밀`,
    "오늘도 무사히",
  ];
  const MARQUEE_SYMBOLS = ["🪷", "☸️", "🏮", "📿", "🔔", "✌️", "🙏"];
  const once = items.map((t, i) =>
    `<span>${escapeHTML(t)}<i class="marquee-sym">${MARQUEE_SYMBOLS[i % MARQUEE_SYMBOLS.length]}</i></span>`).join("");
  $("marquee").innerHTML = once + once;

  // ----- 동자승 대사 (한 글자씩 써지는 법문) -----
  const LINES = [
    "AI 고르다 생긴 번뇌, 여기 두고 가세요.",
    "극락도 락이다. 일단 무료부터 써 보자구요!",
    "목탁 한 번에 번뇌 하나. 첫 화면 키캡 눌러 봤어요?",
    "요금, 장점, 단점? 카드에 다 적어 놨어요 😎",
    "모든 AI는 인연 따라. 나랑 맞는 걸 찾으면 그게 극락!",
  ];
  const aboutLine = $("aboutLine");
  let li = 0;
  function typeLine(el, str, speed = 40) {
    clearInterval(el._typing);
    const chars = [...str];
    let i = 0;
    el.textContent = "";
    el._typing = setInterval(() => {
      el.textContent += chars[i++];
      if (i >= chars.length) { clearInterval(el._typing); el._typing = null; }
    }, speed);
  }
  typeLine(aboutLine, LINES[0]);
  setInterval(() => { li = (li + 1) % LINES.length; typeLine(aboutLine, LINES[li]); }, 4200);

  // ----- 수행 진행 바: 스크롤한 만큼 법륜이 굴러감 -----
  const fill = $("journeyFill");
  const ball = $("journeyBall");
  function updateJourney() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    fill.style.width = `${p * 100}%`;
    ball.style.left = `calc(${p * 100}% - ${p * 22}px)`;
    ball.style.rotate = `${p * 1440}deg`;
  }
  addEventListener("scroll", updateJourney, { passive: true });
  addEventListener("resize", updateJourney);
  updateJourney();

  // ----- 첫 화면을 지나면 법륜 버튼 보이기 -----
  const fab = $("ballFab");
  const hero = $("hero");
  const toggleFab = () => fab.classList.toggle("show", hero.getBoundingClientRect().bottom < innerHeight * .3);
  addEventListener("scroll", toggleFab, { passive: true });
  toggleFab();

  // ===== 동자승 가이드 =====
  const GUIDE = [
    "어서 오세요, 중생님 🙏 저는 길잡이 동자승이에요.\n번뇌 없이 AI 고르는 법, 3초 만에 알려드릴게요.",
    "🔍 헤더 검색창에 AI 이름이나 설명을 치면 바로 찾아드려요.\n키보드 / 키를 누르면 검색창으로 순간이동!",
    "☰ 버튼으로 사이드바를 열면 수행을 고르거나 AI로 바로 갈 수 있어요.",
    "카드에서 요금, 무료·유료 차이, 장점, 단점을 한 번에 확인!\n[추천 용도 · 소감]을 누르면 TMI가 펼쳐져요. 성불하세요 ✌️",
  ];
  const guide = $("guide");
  const guideText = $("guideText");
  const guideDots = $("guideDots");
  const guideNext = $("guideNext");
  let gStep = 0;

  function showGuideStep(i) {
    gStep = i;
    typeLine(guideText, GUIDE[i], 26);
    guideDots.innerHTML = GUIDE.map((_, n) => `<span class="${n === i ? "on" : ""}"></span>`).join("");
    guideNext.textContent = i === GUIDE.length - 1 ? "접수 완료 🙏" : "다음 ▶";
  }
  function openGuide() {
    setSidebar(false);
    guide.classList.add("open");
    guide.setAttribute("aria-hidden", "false");
    showGuideStep(0);
  }
  function closeGuide() {
    clearInterval(guideText._typing);
    guide.classList.remove("open");
    guide.setAttribute("aria-hidden", "true");
  }

  guideNext.addEventListener("click", () => {
    if (guideText._typing) {
      // 타이핑 중이면 문장을 바로 끝까지 보여주기
      clearInterval(guideText._typing);
      guideText._typing = null;
      guideText.textContent = GUIDE[gStep];
    } else if (gStep < GUIDE.length - 1) showGuideStep(gStep + 1);
    else closeGuide();
  });
  $("guideClose").addEventListener("click", closeGuide);
  fab.addEventListener("click", () => (guide.classList.contains("open") ? closeGuide() : openGuide()));
  ["sideGuide", "navGuide", "aboutGuide", "ctaGuide"].forEach((id) => $(id).addEventListener("click", openGuide));
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeGuide(); });

  // 마무리 배너의 [검색하기] → 맨 위 검색창으로
  $("ctaSearch").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    searchInput.focus({ preventScroll: true });
  });
})();
