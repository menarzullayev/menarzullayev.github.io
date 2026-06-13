import { STRINGS, getDescription } from './i18n.js';
import { initParticles } from './particles.js';

const state = {
  lang: localStorage.getItem('portfolio-lang') || 'en',
  theme: localStorage.getItem('portfolio-theme') || 'dark',
  projects: [],
  query: '',
  category: 'all',
  tag: 'all',
};

const els = {};

function t(key) {
  return STRINGS[state.lang]?.[key] || STRINGS.en[key] || key;
}

function applyI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.placeholder = t(key);
  });
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === state.lang);
  });
}

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('portfolio-theme', theme);
}

function setLang(lang) {
  state.lang = lang;
  localStorage.setItem('portfolio-lang', lang);
  applyI18n();
  populateFilters();
  render();
}

function filteredProjects() {
  const q = state.query.trim().toLowerCase();
  return state.projects.filter((p) => {
    if (state.category !== 'all' && p.category !== state.category) return false;
    if (state.tag !== 'all' && !(p.tags || []).includes(state.tag)) return false;
    if (!q) return true;
    const hay = [
      p.title,
      p.category,
      ...(p.tags || []),
      getDescription(p, state.lang),
      getDescription(p, 'en'),
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

function populateFilters() {
  const categories = [...new Set(state.projects.map((p) => p.category).filter(Boolean))];
  const tags = [...new Set(state.projects.flatMap((p) => p.tags || []))].sort();
  els.categoryFilter.innerHTML = `<option value="all">${t('filter.allCategories')}</option>`;
  els.tagFilter.innerHTML = `<option value="all">${t('filter.allTags')}</option>`;
  categories.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    if (c === state.category) opt.selected = true;
    els.categoryFilter.appendChild(opt);
  });
  tags.forEach((tag) => {
    const opt = document.createElement('option');
    opt.value = tag;
    opt.textContent = tag;
    if (tag === state.tag) opt.selected = true;
    els.tagFilter.appendChild(opt);
  });
}

function updateStats() {
  const live = state.projects.filter((p) => p.status === 'live' && p.demo).length;
  els.statTotal.textContent = String(state.projects.length);
  els.statLive.textContent = String(live);
}

function render() {
  const items = filteredProjects();
  const hasProjects = state.projects.length > 0;
  const hasFilters = state.query || state.category !== 'all' || state.tag !== 'all';

  els.emptyState.hidden = hasProjects;
  els.projectGrid.hidden = !hasProjects || items.length === 0;
  els.noResults.hidden = !hasProjects || items.length > 0;
  els.resultsLabel.hidden = !hasProjects;

  if (!hasProjects) {
    els.projectGrid.innerHTML = '';
    return;
  }

  if (items.length === 0) {
    els.projectGrid.innerHTML = '';
    return;
  }

  const label = hasFilters
    ? `${items.length} / ${state.projects.length} ${t('results')}`
    : `${items.length} ${t('results')}`;
  els.resultsLabel.textContent = label;

  els.projectGrid.innerHTML = items.map((p, index) => {
    const num = String(state.projects.indexOf(p) + 1).padStart(2, '0');
    const desc = getDescription(p, state.lang);
    const tags = (p.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('');
    const live = p.status === 'live' && p.demo;
    const demoLink = live
      ? `<a href="${p.demo}" target="_blank" rel="noopener noreferrer">${t('card.demo')} <span class="arrow">→</span></a>`
      : `<span class="tag">${t('card.soon')}</span>`;
    const repoLink = p.repo
      ? `<a class="muted" href="${p.repo}" target="_blank" rel="noopener noreferrer">${t('card.repo')} <span class="arrow">→</span></a>`
      : '';
    return `
      <article class="card">
        <div class="card__head">
          <span class="card__category">${p.category || 'Demo'}</span>
          <span class="card__num">${num}</span>
        </div>
        <h3 class="card__title">${p.title}</h3>
        <p class="card__desc">${desc}</p>
        <div class="card__tags">${tags}</div>
        <div class="card__links">${demoLink}${repoLink}</div>
      </article>
    `;
  }).join('');
}

async function loadProjects() {
  try {
    const res = await fetch('./projects.json', { cache: 'no-store' });
    state.projects = await res.json();
  } catch {
    state.projects = [];
  }
  updateStats();
  populateFilters();
  render();
}

function bindEvents() {
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  els.themeToggle.addEventListener('click', () => {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  });
  els.searchInput.addEventListener('input', (e) => {
    state.query = e.target.value;
    render();
  });
  els.categoryFilter.addEventListener('change', (e) => {
    state.category = e.target.value;
    render();
  });
  els.tagFilter.addEventListener('change', (e) => {
    state.tag = e.target.value;
    render();
  });
  els.clearFilters.addEventListener('click', () => {
    state.query = '';
    state.category = 'all';
    state.tag = 'all';
    els.searchInput.value = '';
    populateFilters();
    render();
  });
}

function init() {
  els.statTotal = document.getElementById('stat-total');
  els.statLive = document.getElementById('stat-live');
  els.searchInput = document.getElementById('search-input');
  els.categoryFilter = document.getElementById('category-filter');
  els.tagFilter = document.getElementById('tag-filter');
  els.projectGrid = document.getElementById('project-grid');
  els.emptyState = document.getElementById('empty-state');
  els.noResults = document.getElementById('no-results');
  els.resultsLabel = document.getElementById('results-label');
  els.clearFilters = document.getElementById('clear-filters');
  els.themeToggle = document.getElementById('theme-toggle');

  setTheme(state.theme);
  applyI18n();
  bindEvents();
  initParticles(() => state.theme);
  loadProjects();
}

init();
