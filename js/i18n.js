const STRINGS = {
  en: {
    'hero.eyebrow': 'Portfolio Hub',
    'hero.title': 'Interactive Experiments',
    'hero.lead': 'A growing collection of CSS, 3D, and motion demos — tested locally, published when ready.',
    'stats.projects': 'Projects',
    'stats.live': 'Live',
    'stats.goal': 'Goal',
    'search.placeholder': 'Search projects…',
    'filter.allCategories': 'All categories',
    'filter.allTags': 'All tags',
    'empty.eyebrow': 'Coming soon',
    'empty.title': 'No projects published yet',
    'empty.text': 'Demos are built and tested locally first. When ready, they appear here automatically.',
    'empty.hint': 'Add entries to projects.json after each demo passes local review.',
    'card.demo': 'Live demo',
    'card.repo': 'Source',
    'card.soon': 'Coming soon',
  },
  uz: {
    'hero.eyebrow': 'Portfolio markazi',
    'hero.title': 'Interaktiv tajribalar',
    'hero.lead': 'CSS, 3D va motion demolar to‘plami — avval localda test, keyin publish.',
    'stats.projects': 'Loyihalar',
    'stats.live': 'Live',
    'stats.goal': 'Maqsad',
    'search.placeholder': 'Loyihalarni qidirish…',
    'filter.allCategories': 'Barcha kategoriyalar',
    'filter.allTags': 'Barcha teglar',
    'empty.eyebrow': 'Tez orada',
    'empty.title': 'Hali loyiha publish qilinmagan',
    'empty.text': 'Demolar avval localda tayyorlanadi va test qilinadi. Tayyor bo‘lgach, shu yerda chiqadi.',
    'empty.hint': 'Har demo OK bo‘lgach projects.json ga qo‘shing.',
    'card.demo': 'Live demo',
    'card.repo': 'Manba',
    'card.soon': 'Tez orada',
  },
  ru: {
    'hero.eyebrow': 'Портфолио-хаб',
    'hero.title': 'Интерактивные эксперименты',
    'hero.lead': 'Коллекция CSS, 3D и motion демо — сначала локально, потом публикация.',
    'stats.projects': 'Проекты',
    'stats.live': 'Live',
    'stats.goal': 'Цель',
    'search.placeholder': 'Поиск проектов…',
    'filter.allCategories': 'Все категории',
    'filter.allTags': 'Все теги',
    'empty.eyebrow': 'Скоро',
    'empty.title': 'Проекты ещё не опубликованы',
    'empty.text': 'Демо сначала создаются и тестируются локально. После проверки они появятся здесь.',
    'empty.hint': 'Добавляйте записи в projects.json после локальной проверки.',
    'card.demo': 'Демо',
    'card.repo': 'Код',
    'card.soon': 'Скоро',
  },
};

let currentLang = localStorage.getItem('portfolio-lang') || 'en';

export function t(key) {
  return STRINGS[currentLang]?.[key] || STRINGS.en[key] || key;
}

export function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('portfolio-lang', lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.placeholder = t(key);
  });
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  window.dispatchEvent(new CustomEvent('langchange'));
}

export function initI18n() {
  setLanguage(currentLang);
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });
}
