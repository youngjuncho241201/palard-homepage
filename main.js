/* ═══════════════════════════════════════════════════════════════
   PALARD — Main Javascript
   · 콘텐츠 원본은 index.html (단일 소스)
   · 관리자 모드 편집값(localStorage)만 덮어씀
   ═══════════════════════════════════════════════════════════════ */

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  try { captureDefaultContent(); }  catch(e) { console.warn('captureDefaultContent', e); }
  try { applyAdminContent(); }      catch(e) { console.warn('applyAdminContent', e); }
  try { initScrollEffects(); }      catch(e) { console.warn('initScrollEffects', e); }
  try { initMobileMenu(); }         catch(e) { console.warn('initMobileMenu', e); }
  try { initAnimateOnScroll(); }    catch(e) { console.warn('initAnimateOnScroll', e); }
  try { initHeroTriangles(); }      catch(e) { console.warn('initHeroTriangles', e); }
  try { initHeroVectorGrid(); }     catch(e) { console.warn('initHeroVectorGrid', e); }
  try { initProjectModal(); }       catch(e) { console.warn('initProjectModal', e); }
  try { initContactForm(); }        catch(e) { console.warn('initContactForm', e); }
  try { initAdminMode(); }          catch(e) { console.warn('initAdminMode', e); }
});

/* ══════════════════════════════════════════════════════════════
 * 콘텐츠 관리 (Admin Content)
 * · 기본값은 HTML(DOM)에서 자동 추출 → HTML만 고치면 사이트 전체 반영
 * · 관리자 모드에서 저장한 값만 localStorage 로 덮어씀
 * ══════════════════════════════════════════════════════════════ */
const ADMIN_STORAGE_KEY = 'palardAdminContent';
const ADMIN_SCHEMA_VERSION = 'v2026-08-07-dark-renewal'; // 버전 변경 시 저장값 초기화

let DEFAULT_CONTENT = { fields: {}, projects: { 1: true, 2: true, 3: true } };

/* <br> → \n 로 변환하며 요소의 텍스트 추출 */
function domTextWithBreaks(el) {
  let out = '';
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') out += '\n';
    else out += node.textContent;
  });
  return out.replace(/[ \t]*\n[ \t]*/g, '\n').trim();
}

function captureDefaultContent() {
  const fields = {};
  document.querySelectorAll('[data-admin-field]').forEach((el) => {
    const key = el.getAttribute('data-admin-field');
    if (el.tagName === 'IMG') {
      fields[key] = el.getAttribute('src') || '';
    } else if (el.dataset.adminHtml === 'true') {
      fields[key] = el.innerHTML.trim();
    } else {
      fields[key] = domTextWithBreaks(el);
    }
  });
  DEFAULT_CONTENT = { fields, projects: { 1: true, 2: true, 3: true } };
}

function readAdminContent() {
  const defaults = {
    fields: { ...DEFAULT_CONTENT.fields },
    projects: { ...DEFAULT_CONTENT.projects }
  };
  try {
    const saved = JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY) || 'null');
    if (!saved) return defaults;

    // 스키마 버전이 다르면 저장값 초기화 → HTML 기본값 사용
    if (saved._version !== ADMIN_SCHEMA_VERSION) {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      console.info('PALARD: 콘텐츠 스키마 버전 변경 → 기본값으로 초기화');
      return defaults;
    }

    return {
      fields: { ...defaults.fields, ...(saved.fields || {}) },
      projects: { ...defaults.projects, ...(saved.projects || {}) }
    };
  } catch (error) {
    console.warn('PALARD admin content could not be loaded.', error);
    return defaults;
  }
}

/* 관리자 입력 이미지 경로에 배포 base 경로 보정 (/images/… → /palard-homepage/images/…) */
function resolveImagePath(value) {
  const base = (import.meta.env.BASE_URL || '/');
  if (base !== '/' && typeof value === 'string' && value.startsWith('/images/')) {
    return base.replace(/\/$/, '') + value;
  }
  return value;
}

function setTextWithLineBreaks(element, value) {
  element.textContent = '';
  String(value || '').split('\n').forEach((line, index) => {
    if (index > 0) element.appendChild(document.createElement('br'));
    element.appendChild(document.createTextNode(line));
  });
}

function setHeroTitle(element, value) {
  const lines = String(value || '').split('\n').filter(Boolean);
  element.textContent = '';

  if (lines.length <= 1) {
    element.textContent = lines[0] || '';
    return;
  }

  element.appendChild(document.createTextNode(lines[0]));
  element.appendChild(document.createElement('br'));
  const highlight = document.createElement('span');
  highlight.className = 'highlight-text';
  highlight.textContent = lines.slice(1).join(' ');
  element.appendChild(highlight);
}

function applyAdminContent() {
  const content = readAdminContent();

  document.querySelectorAll('[data-admin-field]').forEach((element) => {
    const key = element.getAttribute('data-admin-field');
    if (!(key in content.fields)) return;
    const value = content.fields[key];

    if (element.tagName === 'IMG') {
      const resolved = resolveImagePath(value);
      if (element.getAttribute('src') !== resolved) element.src = resolved;
    } else if (element.dataset.adminHtml === 'true') {
      element.innerHTML = value;
    } else if (key === 'heroTitle') {
      setHeroTitle(element, value);
    } else {
      setTextWithLineBreaks(element, value);
    }
  });

  document.querySelectorAll('.project-card[data-project]').forEach((card) => {
    const projectId = card.getAttribute('data-project');
    const isVisible = content.projects[projectId] !== false;
    card.classList.toggle('is-hidden-by-admin', !isVisible);
  });
}

/**
 * 1. Scroll Effects (Header shadow, Active Nav Links)
 */
function initScrollEffects() {
  const header = document.getElementById('header');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    let currentSectionId = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

/**
 * 2. Mobile Burger Menu Toggle
 */
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    navMenu.classList.toggle('open');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });
}

/**
 * 3. Intersection Observer (Animate on Scroll)
 */
function initAnimateOnScroll() {
  const revealElements = document.querySelectorAll('.reveal');

  const observerOptions = {
    root: null,
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(element => {
    observer.observe(element);
  });
}

/**
 * 4-A. Triangle Background — Decompose / Reassemble (Scroll Interaction)
 *
 * · position:fixed, z-index:-1 → 모든 콘텐츠 뒤 최하위 배경 레이어
 * · 캔버스 배경색(CSS)이 다크 페이지 배경 역할
 * · 다크 테마: 라이트 블루/시안 계열 반투명 fill 삼각형
 * · 스크롤 속도에 비례해 회전 가속, 정지 시 아주 느린 자체 회전
 * · 900px 마다 조합 ↔ 분해 사이클 반복
 */
function initHeroTriangles() {
  const canvas = document.getElementById('heroTriangles');
  if (!canvas) return;

  const ctx      = canvas.getContext('2d');
  const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, dpr = 1, raf = 0;
  let scrollTarget    = 0;
  let scrollCurrent   = 0;
  let time            = 0;

  let scrollVelocity = 0;
  let spinMult       = 0.08;
  let prevScrollY    = window.scrollY;

  /* ── 다크 테마 색상 팔레트 (R,G,B) ─────────────────────────── */
  const COLORS = [
    '96,165,250',   // 0  라이트 블루
    '34,211,238',   // 1  시안
    '148,163,184',  // 2  슬레이트
    '59,130,246',   // 3  로열 블루
    '129,140,248',  // 4  라이트 인디고
    '226,232,240',  // 5  니어 화이트
    '230,57,70',    // 6  시그널 레드 (절제)
  ];

  /* 다크 배경 위 가시성 보정 배율 */
  const ALPHA_BOOST = 1.5;

  const SHAPES = [
    [[0, -1], [0.866, 0.5], [-0.866, 0.5]],
    [[0, -1], [0.38, 0.88], [-0.38, 0.88]],
    [[0, -0.48], [1, 0.72], [-1, 0.72]],
    [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7]],
    [[-0.75, -0.85], [0.85, 0.6], [-0.75, 0.6]],
    [[-0.15, -1], [0.88, 0.45], [-0.73, 0.68]],
    [[0, -0.28], [1, 0.62], [-1, 0.62]],
  ];

  const DEFS = [
    /* ── Large ────────────────────────────────────────────────── */
    { hx:.08, hy:.18, sx:-280, sy:-180, size:520, r0: 12, rd: 35, rs: 1,  a:.042, col:3, sp:.62, shp:0 },
    { hx:.83, hy:.14, sx: 250, sy:-160, size:480, r0:-18, rd:-40, rs:-1,  a:.036, col:4, sp:.58, shp:2 },
    { hx:.88, hy:.73, sx: 220, sy: 190, size:570, r0: 40, rd: 28, rs: 1,  a:.028, col:2, sp:.68, shp:3 },
    { hx:.06, hy:.79, sx:-240, sy: 200, size:440, r0:-40, rd:-35, rs:-1,  a:.036, col:0, sp:.63, shp:5 },
    { hx:.50, hy:.04, sx:  35, sy:-230, size:365, r0: 60, rd: 38, rs: 1,  a:.030, col:1, sp:.58, shp:1 },
    { hx:.40, hy:.55, sx: -60, sy:  90, size:495, r0: 25, rd:-28, rs:-1,  a:.022, col:5, sp:.55, shp:6 },
    /* ── Medium ───────────────────────────────────────────────── */
    { hx:.26, hy:.31, sx:-150, sy:  90, size:240, r0: -8, rd: 65, rs: 1,  a:.056, col:0, sp:.88, shp:4 },
    { hx:.68, hy:.42, sx: 140, sy: -65, size:258, r0: 25, rd:-60, rs:-1,  a:.048, col:2, sp:.86, shp:0 },
    { hx:.18, hy:.58, sx:-125, sy: 120, size:212, r0:-50, rd: 72, rs: 1,  a:.062, col:1, sp:.90, shp:2 },
    { hx:.79, hy:.30, sx: 165, sy:  50, size:246, r0: 65, rd:-55, rs:-1,  a:.046, col:3, sp:.83, shp:5 },
    { hx:.42, hy:.73, sx:  65, sy: 145, size:225, r0:-20, rd: 60, rs: 1,  a:.042, col:5, sp:.88, shp:3 },
    { hx:.57, hy:.56, sx: -65, sy: 110, size:186, r0:110, rd:-72, rs: 1,  a:.064, col:4, sp:.91, shp:1 },
    { hx:.34, hy:.86, sx: -80, sy: 180, size:216, r0: 35, rd: 48, rs:-1,  a:.046, col:2, sp:.86, shp:6 },
    /* ── Small ────────────────────────────────────────────────── */
    { hx:.14, hy:.42, sx:-190, sy: -50, size:112, r0: 80, rd:110, rs: 1,  a:.092, col:0, sp:1.22, shp:0 },
    { hx:.38, hy:.14, sx: -50, sy:-190, size: 96, r0:-65, rd:-100, rs:-1, a:.082, col:3, sp:1.28, shp:3 },
    { hx:.62, hy:.22, sx:  95, sy:-155, size:122, r0: 40, rd: 90, rs: 1,  a:.086, col:1, sp:1.20, shp:2 },
    { hx:.93, hy:.48, sx: 200, sy:  38, size: 88, r0:-80, rd:-110, rs:-1, a:.076, col:6, sp:1.25, shp:5 },
    { hx:.30, hy:.91, sx: -65, sy: 175, size:102, r0:100, rd: 96, rs: 1,  a:.076, col:5, sp:1.18, shp:4 },
    { hx:.72, hy:.68, sx: 120, sy: 140, size: 84, r0:-30, rd:-85, rs:-1,  a:.096, col:4, sp:1.30, shp:1 },
    { hx:.48, hy:.89, sx:  26, sy: 165, size:108, r0: 55, rd: 78, rs: 1,  a:.076, col:0, sp:1.16, shp:6 },
    { hx:.04, hy:.27, sx:-200, sy: -80, size: 80, r0:-120,rd:-115, rs: 1, a:.102, col:2, sp:1.32, shp:0 },
    { hx:.55, hy:.37, sx:  80, sy:-110, size: 94, r0: 20, rd:100, rs:-1,  a:.082, col:3, sp:1.20, shp:5 },
    { hx:.20, hy:.05, sx:-120, sy:-200, size: 86, r0:-45, rd:-90, rs: 1,  a:.070, col:1, sp:1.25, shp:2 },
  ];

  const BASE_SPEED = [0.07, 0.14, 0.38]; // [Large, Medium, Small]
  function baseSpeed(size) {
    if (size >= 330) return BASE_SPEED[0];
    if (size >= 160) return BASE_SPEED[1];
    return BASE_SPEED[2];
  }

  let tris = [];

  function drawTri(cx, cy, R, rot, alpha, col, shp) {
    const a = Math.min(alpha * ALPHA_BOOST, 0.22);
    if (a <= 0.003) return;
    const v = SHAPES[shp];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(v[0][0] * R, v[0][1] * R);
    ctx.lineTo(v[1][0] * R, v[1][1] * R);
    ctx.lineTo(v[2][0] * R, v[2][1] * R);
    ctx.closePath();
    ctx.fillStyle = `rgba(${COLORS[col]},${a.toFixed(3)})`;
    ctx.fill();
    ctx.restore();
  }

  function buildTris() {
    const sc = W / 1440;
    tris = DEFS.map(d => ({
      hx:   d.hx * W,   hy:   d.hy * H,
      sx:   d.sx * sc,  sy:   d.sy * sc,
      size: d.size * sc,
      r0: d.r0, rd: d.rd, rs: d.rs,
      bs: baseSpeed(d.size),
      a: d.a, col: d.col, sp: d.sp, shp: d.shp,
    }));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W   = window.innerWidth;
    H   = window.innerHeight;
    canvas.width        = Math.ceil(W * dpr);
    canvas.height       = Math.ceil(H * dpr);
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildTris();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!tris.length) return;

    if (noMotion) {
      tris.forEach(t => drawTri(t.hx, t.hy, t.size, t.r0, t.a, t.col, t.shp));
      return;
    }

    time += 1;

    /* 플라이휠 회전 관성 */
    scrollVelocity *= 0.96;
    const spinTarget = 0.08 + scrollVelocity * 1.5;
    const isAccel    = Math.abs(spinTarget) > Math.abs(spinMult);
    spinMult += (spinTarget - spinMult) * (isAccel ? 0.05 : 0.008);

    /* 분해/재조합 */
    scrollCurrent += (scrollTarget - scrollCurrent) * 0.055;
    const ease = scrollCurrent * scrollCurrent * (3 - 2 * scrollCurrent);

    tris.forEach(t => {
      t.angle = (t.angle || 0) + t.bs * spinMult;
      const ef  = Math.min(1, Math.max(0, ease * t.sp));
      const cx  = t.hx + t.sx * ef;
      const cy  = t.hy + t.sy * ef;
      const rot = t.r0 + t.rd * ef + t.angle;
      const al  = t.a  * (1 - ef * 0.25);
      drawTri(cx, cy, t.size, rot, al, t.col, t.shp);
    });
  }

  function tick() { draw(); raf = requestAnimationFrame(tick); }

  function onScroll() {
    const dy = window.scrollY - prevScrollY;
    prevScrollY = window.scrollY;
    if (dy !== 0) scrollVelocity = Math.max(-1, Math.min(1, scrollVelocity + Math.sign(dy) * 0.18));
    scrollTarget = (1 - Math.cos((window.scrollY / 900) * Math.PI)) / 2;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* 스크롤 불가 페이지(thank-you 등)에서도 휠 회전 관성 적용 */
  window.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      scrollVelocity = Math.max(-1, Math.min(1, scrollVelocity + Math.sign(e.deltaY) * 0.08));
    }
  }, { passive: true });

  window.addEventListener('resize', () => { resize(); onScroll(); });

  resize();
  onScroll();
  raf = requestAnimationFrame(tick);
  window.addEventListener('beforeunload', () => cancelAnimationFrame(raf));
}

/**
 * 4-B. Interactive Hero Vector Grid (pointer-driven dot field)
 */
function initHeroVectorGrid() {
  const hero = document.getElementById('hero');
  const canvas = document.getElementById('heroVectorGrid');
  if (!hero || !canvas) return;

  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: 0, y: 0, active: false };
  const grid = [];
  const step = 32;
  const influence = 220;
  const directions = [
    [1, 0], [0.707, 0.707], [0, 1], [-0.707, 0.707],
    [-1, 0], [-0.707, -0.707], [0, -1], [0.707, -0.707]
  ];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frameId = 0;

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.ceil(rect.width);
    height = Math.ceil(rect.height);
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    grid.length = 0;
    for (let y = step / 2; y < height; y += step) {
      for (let x = step / 2; x < width; x += step) {
        grid.push({ x, y });
      }
    }
    draw();
  };

  const updatePointer = (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = pointer.x >= 0 && pointer.x <= width && pointer.y >= 0 && pointer.y <= height;
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(158, 185, 222, 0.13)'; /* 다크 배경 위 라이트 도트 */

    grid.forEach((point, index) => {
      const dx = point.x - pointer.x;
      const dy = point.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const strength = pointer.active && !prefersReducedMotion
        ? Math.max(0, 1 - distance / influence)
        : 0;

      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.35, 0, Math.PI * 2);
      ctx.fill();

      if (strength <= 0) return;

      const angle = Math.atan2(dy, dx);
      const octant = Math.round(angle / (Math.PI / 4)) & 7;
      const direction = directions[octant];
      const length = 5 + strength * 22;
      const alpha = 0.1 + strength * 0.42;
      const hueShift = index % 3 === 0 ? '34, 211, 238' : '96, 165, 250';

      ctx.strokeStyle = `rgba(${hueShift}, ${alpha})`;
      ctx.lineWidth = 1 + strength * 1.2;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x + direction[0] * length, point.y + direction[1] * length);
      ctx.stroke();
    });
  };

  const animate = () => {
    draw();
    frameId = window.requestAnimationFrame(animate);
  };

  hero.addEventListener('pointermove', updatePointer);
  hero.addEventListener('pointerenter', (event) => {
    updatePointer(event);
    pointer.active = true;
  });
  hero.addEventListener('pointerleave', () => {
    pointer.active = false;
  });
  window.addEventListener('resize', resize);

  resize();
  frameId = window.requestAnimationFrame(animate);

  window.addEventListener('beforeunload', () => {
    window.cancelAnimationFrame(frameId);
  });
}

/**
 * 5. Projects Detailed Data & Modal Controller
 */
const PROJECT_DATA = {
  1: {
    tag: '핵심 부품 설계 & CAE 수치해석',
    title: '현대차 2.0 세타 엔진용 2.5 터빈 스왑 주강 매니폴드 개발',
    content: `
      <div class="modal-project-grid">
        <div class="modal-project-section">
          <h4>프로젝트 개요</h4>
          <p>현대 및 제네시스 2.0 터보 차량(벨로스터N, 아반떼N 등) 오너들이 출력 향상을 위해 2.5 터보 터빈으로 업그레이드(스왑) 시 발생하는 하드웨어 장착 호환 문제를 해결하기 위해 착수된 고성능 부품 개발 프로젝트입니다.</p>
        </div>
        <div class="modal-project-section">
          <h4>핵심 설계 솔루션</h4>
          <ul>
            <li><strong>배기 합류각 최적화(CFD)</strong>: 4기통 배기가스의 원활한 배출과 역류 방지를 위해 유체역학을 반영한 합류각을 자체 시뮬레이션(CFD)하여 배출 효율 향상 및 엔진 압력 손실 최소화 설계.</li>
            <li><strong>용접 크랙의 근본적 제거</strong>: 고온 배기가스(800℃ 이상)와 가혹한 진동으로 크랙이 빈번한 수제작 파이프 용접 방식에서 탈피, 이음새 없는 <strong>일체형 주강(Casting) 주조 공법</strong> 적용.</li>
            <li><strong>소재 혁신</strong>: 열팽창 계수가 우수하고 내구성이 입증된 고내열 주강 소재를 채택하여 내구 수명 대폭 증대.</li>
          </ul>
        </div>
        <div class="modal-project-section">
          <h4>공정 협업 및 검증 결과</h4>
          <p>서울 팔라드의 3D 정밀 설계·유동해석 데이터를 바탕으로 경기 화성 CNC 협력사의 고정밀 가공 인프라로 시제품을 제작하였으며, 경기 일산 디스펙(D-spec)의 서킷 실차 가혹 주행을 통과하여 피팅 호환성과 내구 신뢰성을 증명했습니다.</p>
        </div>
        <div class="modal-project-section">
          <h4>엔지니어링 툴체인</h4>
          <p>SolidWorks / Fusion 360 / CFD Flow Simulation</p>
        </div>
      </div>
    `
  },
  2: {
    tag: '실차 외주 설계 & 구조해석',
    title: '현대 Veloster N 인터쿨러 덕트 및 프론트 패널 설계 실적',
    content: `
      <div class="modal-project-grid">
        <div class="modal-project-section">
          <h4>프로젝트 개요</h4>
          <p>국산 고성능 핫해치의 대표 차종인 현대 벨로스터 N 차량의 공기 냉각 시스템 효율 극대화 및 프론트 범퍼 보강 구조를 위해 정밀 외주 설계를 수행한 사례입니다.</p>
        </div>
        <div class="modal-project-section">
          <h4>핵심 설계 솔루션</h4>
          <ul>
            <li><strong>인터쿨러 덕트 형상 설계</strong>: 외기가 인터쿨러 코어 전체에 고르게 유입되도록 최적의 가이드 덕트 형상을 역설계 기법으로 도출하여 냉각 효율을 개선.</li>
            <li><strong>프론트 패널 구조 해석 및 설계</strong>: 엔진룸 구조물·라디에이터·범퍼 레일과의 공간 간섭을 오차범위 0.2mm 이내로 최소화하는 무가공 완벽 피팅(Plug &amp; Play) 설계.</li>
            <li><strong>포맷 호환성 보장</strong>: 서로 다른 CAD 포맷(Fusion 360 &harr; SolidWorks) 간 완벽한 데이터 변환과 구조 정합성을 검증하여 협력사 공정 효율 최적화.</li>
          </ul>
        </div>
        <div class="modal-project-section">
          <h4>적용 성과</h4>
          <p>레이싱 환경에 필수적인 냉각 효율을 높였으며, 전면 충격 하중 분산 능력을 FEA 구조해석으로 사전 검증하여 실차 장착 신뢰성을 만족시켰습니다.</p>
        </div>
      </div>
    `
  },
  3: {
    tag: '모터스포츠 하드웨어 설계 및 제작',
    title: '레이싱 시뮬레이터용 실작동 페달 키트 및 휠 거치대 개발',
    content: `
      <div class="modal-project-grid">
        <div class="modal-project-section">
          <h4>프로젝트 개요</h4>
          <p>프로 레이서 및 모터스포츠 동호인들의 고정밀 실전 연습용 시뮬레이터에 적용되는 페달 키트의 기계식 메커니즘 설계와 실물 휠 거치대를 설계·제작하여 납품한 실적입니다.</p>
        </div>
        <div class="modal-project-section">
          <h4>핵심 설계 솔루션</h4>
          <ul>
            <li><strong>실작동 클러치 압력 메커니즘</strong>: 일반 가변저항식 신호가 아닌, 실제 자동차 클러치가 끊어지고 맞물릴 때의 물리적 압력 피드백(작동 곡선)을 기계식 링크 구조와 스프링 장력 설계로 재현.</li>
            <li><strong>가혹 환경 진동·하중 설계</strong>: 급제동·급조향 시 모터 반발력과 조작 하중(최대 100kgf 이상)을 견디도록 굽힘 모멘트 해석 수행 및 최적 보강 리브 설계.</li>
            <li><strong>공간 정합성</strong>: 휠 모터 및 프레임 레이아웃에 맞춘 완벽한 조립 적합성의 CNC 강판 도면 설계 제공.</li>
          </ul>
        </div>
        <div class="modal-project-section">
          <h4>공급 및 납품 실적</h4>
          <p>국내 유수의 모터스포츠 체험 매장 체인 'PSR'의 공식 매장 전시용 휠 거치대 및 페달 메커니즘으로 최종 채택되어 생산·공급을 완료하였으며, 실주행 검증으로 내구도를 승인받았습니다.</p>
        </div>
      </div>
    `
  }
};

function initProjectModal() {
  const content = readAdminContent();
  Object.keys(PROJECT_DATA).forEach((projectId) => {
    const tag = content.fields[`project${projectId}Tag`];
    const title = content.fields[`project${projectId}Title`];
    if (tag) PROJECT_DATA[projectId].tag = tag;
    if (title) PROJECT_DATA[projectId].title = title;
  });

  const projectCards = document.querySelectorAll('.project-card');
  const modal = document.getElementById('projectModal');
  const modalClose = document.getElementById('modalClose');
  const modalOverlay = document.querySelector('.modal-overlay');
  const modalBody = document.getElementById('modalBody');

  projectCards.forEach(card => {
    card.addEventListener('click', () => {
      const projectId = card.getAttribute('data-project');
      const data = PROJECT_DATA[projectId];

      if (data) {
        modalBody.innerHTML = `
          <span class="modal-project-tag">${data.tag}</span>
          <h3 class="modal-project-title">${data.title}</h3>
          ${data.content}
        `;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

/**
 * 6. Contact Form Handler (FormSubmit 연동)
 * - 수신 이메일: palard315@gmail.com
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clientEmail = document.getElementById('clientEmail').value.trim();
    const hiddenReplyTo = document.getElementById('hiddenReplyTo');
    if (hiddenReplyTo) {
      hiddenReplyTo.value = clientEmail;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    if (submitBtn) {
      submitBtn.textContent = '전송 중... 잠시만 기다려주세요';
      submitBtn.disabled = true;
    }

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const l = window.location;
        let path = l.pathname;
        if (!path.endsWith('/')) {
          if (path.includes('.html')) path = path.substring(0, path.lastIndexOf('/') + 1);
          else path += '/';
        }
        window.location.href = l.origin + path + 'thank-you.html?v=' + new Date().getTime();
      } else {
        throw new Error('서버 오류');
      }
    } catch (err) {
      const formStatus = document.getElementById('formStatus');
      if (formStatus) {
        formStatus.textContent = '메일 전송에 실패했습니다. 다시 시도해 주세요.';
        formStatus.className = 'form-status error show';
      }
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    }
  });
}

/* ══════════════════════════════════════════════════════════════
 * Admin Inline Edit Mode
 * · 푸터 ⚙ 클릭 → 비밀번호 모달 → admin-mode 활성화
 * · 비밀번호는 SHA-256 해시로만 검증 (평문 미보관)
 * · data-admin-field 텍스트: contenteditable 인라인 편집
 * · data-admin-field 이미지: 클릭 → URL 입력 프롬프트
 * · 저장 → localStorage  /  되돌리기 → applyAdminContent()
 * ══════════════════════════════════════════════════════════════ */
function initAdminMode() {
  /* SHA-256(비밀번호) — 평문 비밀번호는 코드에 저장하지 않음 */
  const ADMIN_PW_HASH = '96df84e18222aadf6b3598cc5e6d967d31b3cff0a13f266fcd53c0f4ee42f831';
  const SESSION_KEY = 'palardAdminLoggedIn';

  const toolbar    = document.getElementById('adminToolbar');
  const modal      = document.getElementById('adminLoginModal');
  const trigger    = document.getElementById('adminTrigger');
  if (!toolbar || !modal || !trigger) return;

  const pwInput    = document.getElementById('adminPwInput');
  const loginError = document.getElementById('adminLoginError');
  const saveBtn    = document.getElementById('adminSaveBtn');
  const cancelBtn  = document.getElementById('adminCancelBtn');
  const exitBtn    = document.getElementById('adminExitBtn');
  const modalClose = document.getElementById('adminModalClose');

  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* 세션 복원 */
  if (sessionStorage.getItem(SESSION_KEY) === 'true') _activate();

  /* URL ?admin 파라미터로도 진입 가능 */
  if (new URLSearchParams(location.search).has('admin')) _openLogin();

  trigger.addEventListener('click', e => { e.preventDefault(); _openLogin(); });
  modalClose?.addEventListener('click', _closeLogin);
  modal.addEventListener('click', e => { if (e.target === modal) _closeLogin(); });

  document.getElementById('adminLoginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    let hashed = '';
    try {
      hashed = await sha256Hex(pwInput.value);
    } catch (err) {
      loginError.textContent = '보안 컨텍스트(HTTPS)에서만 로그인할 수 있습니다.';
      return;
    }
    if (hashed === ADMIN_PW_HASH) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      _closeLogin();
      _activate();
    } else {
      loginError.textContent = '비밀번호가 올바르지 않습니다.';
      pwInput.select();
    }
  });

  saveBtn?.addEventListener('click',   _save);
  cancelBtn?.addEventListener('click', () => { applyAdminContent(); _toast('마지막 저장 상태로 되돌렸습니다.'); });
  exitBtn?.addEventListener('click',   _deactivate);

  /* ── 내부 헬퍼 ──────────────────────────────────────────── */
  function _openLogin() {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') { _activate(); return; }
    modal.hidden = false;
    pwInput.value = '';
    loginError.textContent = '';
    setTimeout(() => pwInput.focus(), 60);
  }
  function _closeLogin() { modal.hidden = true; }

  function _activate() {
    document.body.classList.add('admin-mode');
    toolbar.hidden = false;
    document.querySelectorAll('[data-admin-field]').forEach(el => {
      if (el.tagName === 'IMG') {
        el.title = '클릭하여 이미지 URL 변경';
        el.addEventListener('click', _onImgClick);
      } else {
        el.contentEditable = 'true';
        el.spellcheck = false;
      }
    });
  }

  function _deactivate() {
    document.body.classList.remove('admin-mode');
    toolbar.hidden = true;
    sessionStorage.removeItem(SESSION_KEY);
    document.querySelectorAll('[data-admin-field]').forEach(el => {
      el.removeAttribute('contenteditable');
      if (el.tagName === 'IMG') el.removeEventListener('click', _onImgClick);
    });
  }

  function _onImgClick(e) {
    const el = e.currentTarget;
    const cur = el.getAttribute('src') || '';
    const url = prompt('이미지 URL 입력:', cur);
    if (url && url.trim() && url.trim() !== cur) el.src = resolveImagePath(url.trim());
  }

  function _save() {
    const c = readAdminContent();
    document.querySelectorAll('[data-admin-field]').forEach(el => {
      const k = el.getAttribute('data-admin-field');
      if (!(k in c.fields)) return;
      if (el.tagName === 'IMG')                  c.fields[k] = el.getAttribute('src');
      else if (el.dataset.adminHtml === 'true')  c.fields[k] = el.innerHTML;
      else                                       c.fields[k] = el.innerText || el.textContent;
    });
    c._version = ADMIN_SCHEMA_VERSION;
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(c));
    _toast('저장했습니다! ✓ (이 브라우저에만 적용됩니다)');
  }

  function _toast(msg) {
    let t = document.getElementById('adminToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'adminToast';
      t.className = 'admin-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 2600);
  }
}
