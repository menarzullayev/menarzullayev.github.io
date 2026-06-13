import { initI18n, t } from './i18n.js';
import { initParticles } from './particles.js';

const state = {
  projects: [],
  query: '',
  category: 'all',
  tag: 'all',
};

async function loadProjects() {
  try {
    const res = await fetch('./projects.json', { cache: 'no-store' });
    state.projects = await res.json();
  } catch {
    state.projects = [];
  }
  document.getElementById('stat-total').textContent = String(state.projects.length);
  document.getElementById('stat-live').textContent = String(
    state.projects.filter((p) => p.demo && p.status === 'live').length,
  );
  populateFilters();
  render();
}

function populateFilters() {
  const categories = [...new Set(state.projects.map((p) => p.category).filter(Boolean))];
  const tags = [...new Set(state.projects.flatMap((p) => p.tags || []))];
  const catSelect = document.getElementById('category-filter');
  const tagSelect = document.getElementById('tag-filter');

  catSelect.innerHTML = `<option value="all">${t('filter.allCategories')}</option>`;
  tagSelect.innerHTML = `<option value="all">${t('filter.allTags')}</option>`;

  categories.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  });
  tags.forEach((tag) => {
    const opt = document.createElement('option');
    opt.value = tag;
    opt.textContent = tag;
    tagSelect.appendChild(opt);
  });
}

function filteredProjects() {
  return state.projects.filter((p) => {
    const q = state.query.toLowerCase();
    const matchesQuery = !q || [p.title, p.description, ...(p.tags || [])].join(' ').toLowerCase().includes(q);
    const matchesCategory = state.category === 'all' || p.category === state.category;
    const matchesTag = state.tag === 'all' || (p.tags || []).includes(state.tag);
    return matchesQuery && matchesCategory && matchesTag;
  });
}

function render() {
  const grid = document.getElementById('project-grid');
  const items = filteredProjects();
  grid.innerHTML = '';

  items.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.style.animationDelay = `${i * 0.05}s`;
    card.innerHTML = `
      <p class="card__category">${p.category || 'Demo'}</p>
      <h3 class="card__title">${p.title}</h3>
      <p class="card__desc">${p.description || ''}</p>
      <div class="card__tags">${(p.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>
      <div class="card__links">
        ${p.demo && p.status === 'live' ? `<a href="${p.demo}" target="_blank" rel="noopener noreferrer">${t('card.demo')} →</a>` : `<span class="tag">${t('card.soon')}</span>`}
        ${p.repo ? `<a href="${p.repo}" target="_blank" rel="noopener noreferrer">${t('card.repo')} →</a>` : ''}
      </div>
    `;
    grid.appendChild(card);
  });
}

function bindControls() {
  document.getElementById('search-input').addEventListener('input', (e) => {
    state.query = e.target.value;
    render();
  });
  document.getElementById('category-filter').addEventListener('change', (e) => {
    state.category = e.target.value;
    render();
  });
  document.getElementById('tag-filter').addEventListener('change', (e) => {
    state.tag = e.target.value;
    render();
  });
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    localStorage.setItem('portfolio-theme', next);
  });
  window.addEventListener('langchange', () => {
    populateFilters();
    render();
  });
}

function initTheme() {
  const saved = localStorage.getItem('portfolio-theme');
  if (saved) document.documentElement.dataset.theme = saved;
}

async function init() {
  document.getElementById('year').textContent = String(new Date().getFullYear());
  initTheme();
  initI18n();
  initParticles();
  bindControls();
  await loadProjects();
}

init();
