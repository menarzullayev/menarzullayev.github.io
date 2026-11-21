import { STRINGS, getDescription } from './i18n.js';
import { initParticles } from './particles.js';

const state = {
  lang: localStorage.getItem('portfolio-lang') || 'en',
  theme: localStorage.getItem('portfolio-theme') || 'dark',
  populated: localStorage.getItem('portfolio-populated') !== 'false',
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
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === (state.populated ? 'populated' : 'empty'));
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

function setPopulated(populated) {
  state.populated = populated;
  localStorage.setItem('portfolio-populated', String(populated));
  applyI18n();
  updateStats();
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
  const count = state.populated ? state.projects.length : 0;
  els.statTotal.textContent = String(count);
  els.statLive.textContent = String(count);
}

function render() {
  const items = filteredProjects();
  const hasFilters = state.query || state.category !== 'all' || state.tag !== 'all';

  els.emptyState.hidden = state.populated;
  els.projectGrid.hidden = !state.populated || items.length === 0;
  els.noResults.hidden = !state.populated || items.length > 0;
  els.resultsLabel.hidden = !state.populated || items.length === 0;

  if (!state.populated) {
    els.projectGrid.innerHTML = '';
    els.resultsLabel.hidden = true;
    return;
  }

  if (items.length === 0) {
    els.projectGrid.innerHTML = '';
    return;
  }

  const suffix = hasFilters ? ` / ${state.projects.length}` : '';
  els.resultsLabel.textContent = `${items.length}${suffix} ${t('results')}`;

  els.projectGrid.innerHTML = items.map((p) => {
    const num = String(state.projects.indexOf(p) + 1).padStart(2, '0');
    const desc = getDescription(p, state.lang);
    const tags = (p.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('');
    const demoHref = p.demo || '#';
    const repoHref = p.repo || 'https://github.com/menarzullayev';
    return `
      <article class="card">
        <div class="card__head">
          <span class="card__category">${p.category || 'Demo'}</span>
          <span class="card__num">${num}</span>
        </div>
        <h3 class="card__title">${p.title}</h3>
        <p class="card__desc">${desc}</p>
        <div class="card__tags">${tags}</div>
        <div class="card__links">
          <a href="${demoHref}"${demoHref !== '#' ? ' target="_blank" rel="noopener noreferrer"' : ''}>${t('card.demo')} <span class="arrow">→</span></a>
          <a class="muted" href="${repoHref}" target="_blank" rel="noopener noreferrer">${t('card.repo')} <span class="arrow">→</span></a>
        </div>
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
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', () => setPopulated(btn.dataset.view === 'populated'));
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
