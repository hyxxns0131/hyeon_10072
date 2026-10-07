// ===== 필터·검색 기능 =====
// 서비스 데이터는 js/services.js 의 services 배열에서 불러옵니다.

// 분야 = 육바라밀 수행 (type: 수행 이름, color: 흙·나무 톤 색, light: 연한 색)
// photos: 그 수행을 대표하는 사찰 사진 [파일 이름, 설명] → img/temple/파일이름.jpg
const CATEGORIES = [
  { name: "전체", emoji: "☸️", type: "전체", color: "#3b2a1e", light: "#ece2d2",
    photos: [["birojeon", "불국사 비로전 부처님"]] },
  { name: "바이브 코딩", emoji: "📿", type: "정진", color: "#b8642c", light: "#f3dcc8",
    photos: [["lanterns", "연등을 들고 행렬하는 스님들"], ["bell", "범종의 용뉴"]] },
  { name: "웹/UI/UX", emoji: "🏯", type: "지계", color: "#5f7f4f", light: "#dfe8d5",
    photos: [["bulguksa", "불국사"], ["pagoda", "낙산사 칠층석탑"]] },
  { name: "글쓰기/리서치", emoji: "📜", type: "지혜", color: "#b38a2e", light: "#f3e6c4",
    photos: [["sutra", "화엄경 해설집"], ["birojeon", "불국사 비로전 부처님"]] },
  { name: "영상", emoji: "🏮", type: "보시", color: "#b0525a", light: "#f3d8d6",
    photos: [["seokguram", "석굴암 가는 길의 오색 연등"], ["seokguram2", "석굴암 향로와 보시함"]] },
  { name: "음성/음악", emoji: "🔔", type: "선정", color: "#4f6a86", light: "#d9e1ea",
    photos: [["incense", "신흥사 향로의 봉황과 악사"], ["belltower", "동화사 종각"]] },
  { name: "시각화/PPT", emoji: "🪷", type: "인욕", color: "#7d5a3c", light: "#ecdfd0",
    photos: [["lotus2", "연꽃"], ["lotus", "활짝 핀 연꽃"]] },
];
const photoImg = (file) => `img/temple/${file}.jpg`;

// 서비스마다 사진 배정: 그 수행의 대표 사진을 먼저 쓰고, 그다음엔 다른 사찰 사진도 섞어서 덜 겹치게
const ALL_PHOTOS = [...new Map(CATEGORIES.flatMap((c) => c.photos).map((p) => [p[0], p])).values()];
function photoOf(s) {
  const own = typeOf(s.category).photos;
  const list = [...own, ...ALL_PHOTOS.filter((p) => !own.some((o) => o[0] === p[0]))];
  const sameType = services.filter((x) => x.category === s.category);
  return list[sameType.indexOf(s) % list.length];
}
const typeOf = (category) => CATEGORIES.find((c) => c.name === category) || CATEGORIES[0];
const typeVars = (category) => {
  const t = typeOf(category);
  return `--tc:${t.color};--tl:${t.light}`;
};

// 요금 표기 → 배지 색상 클래스
const PRICE_CLASS = { "무료": "free", "유료": "paid", "무료+유료": "mixed" };

// ===== 상태 =====
let currentCategory = "전체";
let keyword = "";
const openCards = new Set(); // 펼쳐진 카드의 서비스 이름

const grid = document.getElementById("grid");
const searchInput = document.getElementById("searchInput");
const searchWrap = document.getElementById("searchWrap");
const clearBtn = document.getElementById("clearBtn");
const resultInfo = document.getElementById("resultInfo");
const filtersEl = document.getElementById("filters");
const sideCategories = document.getElementById("sideCategories");
const sideServices = document.getElementById("sideServices");
const sidebarToggle = document.getElementById("sidebarToggle");
const backdrop = document.getElementById("backdrop");
const toggleAllBtn = document.getElementById("toggleAll");

// ===== 유틸 =====
const escapeHTML = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 검색어 하이라이트
function highlight(text) {
  const safe = escapeHTML(text);
  if (!keyword) return safe;
  const re = new RegExp(`(${escapeRegExp(escapeHTML(keyword))})`, "gi");
  return safe.replace(re, "<mark>$1</mark>");
}

function matchesKeyword(s) {
  if (!keyword) return true;
  const q = keyword.toLowerCase();
  return [s.name, s.desc].some((v) => v.toLowerCase().includes(q));
}

const countOf = (category) =>
  services.filter((s) => (category === "전체" || s.category === category) && matchesKeyword(s)).length;

function getVisibleList() {
  return services.filter(
    (s) => (currentCategory === "전체" || s.category === currentCategory) && matchesKeyword(s)
  );
}

// ===== 카드 렌더링 (경전 카드 스타일) =====
// 수행자 = 써본 사람
function cardHTML(s, i) {
  const open = openCards.has(s.name);
  const t = typeOf(s.category);
  const [photo, photoAlt] = photoOf(s);
  const no = String(services.indexOf(s) + 1).padStart(3, "0");
  const moves = (arr, mark) => arr.map((m) =>
    `<div class="move"><span class="energy">${mark}</span><span>${escapeHTML(m)}</span></div>`).join("");
  const hasMore = s.usage || s.review;
  return `
    <article class="card${open ? " open" : ""}" id="card-${i}" data-name="${escapeHTML(s.name)}" style="${typeVars(s.category)};animation-delay:${i * 40}ms">
      <div class="card-art">
        <img class="card-photo" src="${photoImg(photo)}" alt="${escapeHTML(photoAlt)}" loading="lazy" />
        <span class="card-icon" title="서비스 아이콘">${s.icon}</span>
        <span class="card-no">經 ${no}</span>
        <span class="type-pill">${t.emoji} ${escapeHTML(t.type)}바라밀</span>
      </div>

      <div class="card-head">
        <h2>${highlight(s.name)}</h2>
        <div class="card-meta">
          <span class="chip-cat">${escapeHTML(s.category)}</span>
          <span class="badge ${PRICE_CLASS[s.price] || "mixed"}">${escapeHTML(s.price)}</span>
        </div>
      </div>

      <p class="card-desc">${highlight(s.desc)}</p>

      ${priceCompareHTML(s)}

      <div class="moves pros"><h3>👍 장점</h3>${moves(s.pros || [], "+")}</div>
      <div class="moves cons"><h3>👎 단점</h3>${moves(s.cons || [], "!")}</div>

      ${hasMore ? `
      <button class="card-toggle" aria-expanded="${open}" aria-controls="card-${i}-body">
        <span class="text">${open ? "접기" : "추천 용도 · 소감"}</span><span class="chev">▾</span>
      </button>
      <div class="card-body" id="card-${i}-body">
        <div class="card-body-inner">
          ${s.usage ? `<div class="usage-row"><strong>🎯 추천 용도</strong>${escapeHTML(s.usage)}</div>` : ""}
          ${s.review ? `<div class="review"><strong>직접 써본 소감</strong>“${escapeHTML(s.review)}”</div>` : ""}
        </div>
      </div>` : ""}

      <div class="card-foot">
        <span class="tester">${s.tester ? `써본 수행자 <strong>${escapeHTML(s.tester)}</strong>` : `📚 자료 조사`}</span>
        <a class="go-btn" href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">바로가기 ↗</a>
      </div>
    </article>`;
}

// 무료 버전과 유료 버전의 차이
function priceCompareHTML(s) {
  const free = s.free || (s.price === "유료" ? "" : "무료로 사용 가능");
  const paid = s.paid || (s.price === "무료" ? "" : "유료 플랜 제공");
  return `
    <div class="price-compare">
      <div class="pc-col${free ? "" : " none"}"><span class="pc-label free">무료</span><p>${free ? escapeHTML(free) : "무료 버전 없음"}</p></div>
      <div class="pc-col${paid ? "" : " none"}"><span class="pc-label paid">유료</span><p>${paid ? escapeHTML(paid) : "유료 버전 없음"}</p></div>
    </div>`;
}

// ===== 카테고리 필터 버튼 =====
function renderFilters() {
  if (!filtersEl) return;
  filtersEl.innerHTML = CATEGORIES.map(({ name, emoji, color }) => `
    <button class="filter-btn${name === currentCategory ? " active" : ""}" role="tab" aria-selected="${name === currentCategory}"
            data-category="${escapeHTML(name)}" style="--tc:${color}">
      ${emoji} ${escapeHTML(name)} <span class="count">${countOf(name)}</span>
    </button>`).join("");
}

// ===== 사이드바 렌더링 =====
function renderSidebar(list) {
  sideCategories.innerHTML = CATEGORIES.map(({ name, type, color, photos }) => `
    <li><button class="${name === currentCategory ? "active" : ""}" data-category="${escapeHTML(name)}" style="--tc:${color}">
      <span class="dot"></span><img class="side-photo" src="${photoImg(photos[0][0])}" alt="" /><span class="label">${escapeHTML(name)}${name === "전체" ? "" : ` · ${type}`}</span><span class="count">${countOf(name)}</span>
    </button></li>`).join("");

  sideServices.innerHTML = list.length
    ? list.map((s, i) => `
      <li><button data-target="card-${i}">
        <span>${s.icon}</span><span class="label">${escapeHTML(s.name)}</span>
      </button></li>`).join("")
    : `<li class="empty-note">표시할 서비스가 없어요</li>`;
}

function render() {
  const list = getVisibleList();

  renderSidebar(list);
  renderFilters();
  if (typeof renderTypes === "function") renderTypes();

  const where = currentCategory === "전체" ? "모든 수행" : `${typeOf(currentCategory).type}바라밀 (${currentCategory})`;
  resultInfo.innerHTML = keyword
    ? `${escapeHTML(where)}에서 “${escapeHTML(keyword)}” 검색 결과 <strong>${list.length}개</strong>`
    : `${escapeHTML(where)} · <strong>${list.length}개</strong> 등록`;

  if (list.length === 0) {
    grid.innerHTML = keyword
      ? `<div class="empty"><img src="${photoImg("lotus2")}" alt="연꽃" /><strong>찾는 AI와는 아직 인연이 닿지 않았어요…</strong>다른 키워드로 검색하거나 수행을 바꿔보세요.</div>`
      : `<div class="empty"><img src="${photoImg(typeOf(currentCategory).photos[0][0])}" alt="" /><strong>아직 모신 AI가 없어요</strong>이 수행은 조원들이 정진 중이에요.</div>`;
  } else {
    grid.innerHTML = list.map(cardHTML).join("");
  }
  updateToggleAll();
}

// 다른 곳(수행 카드 등)에서 분야를 바꿀 때 사용
function selectCategory(name) {
  currentCategory = name;
  render();
  document.getElementById("services").scrollIntoView({ behavior: "smooth" });
}

// ===== 카드 펼치기/접기 =====
function setCardOpen(card, open) {
  const name = card.dataset.name;
  open ? openCards.add(name) : openCards.delete(name);
  card.classList.toggle("open", open);
  const btn = card.querySelector(".card-toggle");
  if (!btn) return;
  btn.setAttribute("aria-expanded", open);
  btn.querySelector(".text").textContent = open ? "접기" : "추천 용도 · 소감";
}

// 헤더의 [모두 펼치기 / 모두 접기] 버튼 상태 맞추기
function updateToggleAll() {
  const cards = [...grid.querySelectorAll(".card")].filter((c) => c.querySelector(".card-toggle"));
  const allOpen = cards.length > 0 && cards.every((c) => c.classList.contains("open"));
  toggleAllBtn.dataset.mode = allOpen ? "collapse" : "expand";
  toggleAllBtn.querySelector(".ico").textContent = allOpen ? "📕" : "📖";
  toggleAllBtn.querySelector(".text").textContent = allOpen ? "모두 접기" : "모두 펼치기";
  toggleAllBtn.setAttribute("aria-label", allOpen ? "모든 카드 접기" : "모든 카드 펼치기");
  toggleAllBtn.disabled = cards.length === 0;
}

filtersEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  currentCategory = btn.dataset.category;
  render();
});

grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".card-toggle");
  if (!btn) return;
  const card = btn.closest(".card");
  setCardOpen(card, !card.classList.contains("open"));
  updateToggleAll();
});

toggleAllBtn.addEventListener("click", () => {
  const open = toggleAllBtn.dataset.mode !== "collapse";
  grid.querySelectorAll(".card").forEach((c) => c.querySelector(".card-toggle") && setCardOpen(c, open));
  updateToggleAll();
  document.getElementById("services").scrollIntoView({ behavior: "smooth" });
});

// ===== 사이드바 열고 닫기 =====
const isMobile = () => window.matchMedia("(max-width: 1199px)").matches;

function setSidebar(open) {
  document.body.classList.toggle("sidebar-open", open);
  sidebarToggle.setAttribute("aria-expanded", open);
  sidebarToggle.setAttribute("aria-label", open ? "사이드바 닫기" : "사이드바 열기");
}

sidebarToggle.addEventListener("click", () => {
  setSidebar(!document.body.classList.contains("sidebar-open"));
});
backdrop.addEventListener("click", () => setSidebar(false));

sideCategories.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  selectCategory(btn.dataset.category);
  if (isMobile()) setSidebar(false);
});

// 서비스 이름 클릭 → 해당 카드로 이동하고 펼치기
function focusCard(card) {
  setCardOpen(card, true);
  updateToggleAll();
  card.scrollIntoView({ behavior: "smooth", block: "start" });
  card.classList.remove("flash");
  void card.offsetWidth; // 애니메이션 재시작
  card.classList.add("flash");
}

sideServices.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const card = document.getElementById(btn.dataset.target);
  if (!card) return;
  if (isMobile()) setSidebar(false);
  focusCard(card);
});

// ===== 검색 =====
searchInput.addEventListener("input", (e) => {
  keyword = e.target.value.trim();
  searchWrap.classList.toggle("has-value", e.target.value.length > 0);
  render();
});

// Enter 를 누르면 목록으로 이동
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("services").scrollIntoView({ behavior: "smooth" });
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  keyword = "";
  searchWrap.classList.remove("has-value");
  searchInput.focus();
  render();
});

// "/" 키로 검색창 바로 이동, Esc 로 사이드바 닫기
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setSidebar(false);
  if (e.key === "/" && document.activeElement !== searchInput) {
    e.preventDefault();
    searchInput.focus();
  }
});

// 사이드바는 닫힌 상태로 시작 (☰ 버튼으로 열기)
setSidebar(false);
render();
