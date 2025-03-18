// Theme handling functions
window.applyTheme = function () {
  const metaThemeColorTag = document.querySelector('meta[name="theme-color"]');
  const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (!localStorage?.theme) {
    localStorage.theme = 'system';
  }

  // First clear any existing theme classes
  document.documentElement.classList.remove('dark', 'light', 'her');
  
  // Reset custom properties
  document.documentElement.style.removeProperty('--color-gray-800');
  document.documentElement.style.removeProperty('--color-gray-850');
  document.documentElement.style.removeProperty('--color-gray-900');
  document.documentElement.style.removeProperty('--color-gray-950');

  if (localStorage.theme === 'system') {
    document.documentElement.classList.add(prefersDarkTheme ? 'dark' : 'light');
    metaThemeColorTag.setAttribute('content', prefersDarkTheme ? '#171717' : '#ffffff');
  } else if (localStorage.theme === 'oled-dark') {
    document.documentElement.style.setProperty('--color-gray-800', '#101010');
    document.documentElement.style.setProperty('--color-gray-850', '#050505');
    document.documentElement.style.setProperty('--color-gray-900', '#000000');
    document.documentElement.style.setProperty('--color-gray-950', '#000000');
    document.documentElement.classList.add('dark');
    metaThemeColorTag.setAttribute('content', '#000000');
  } else if (localStorage.theme === 'light') {
    document.documentElement.classList.add('light');
    metaThemeColorTag.setAttribute('content', '#ffffff');
  } else if (localStorage.theme === 'her') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.add('her');
    metaThemeColorTag.setAttribute('content', '#983724');
  } else {
    document.documentElement.classList.add('dark');
    metaThemeColorTag.setAttribute('content', '#171717');
  }

  console.log('Theme applied:', localStorage.theme);
};

// Listen for theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (localStorage.theme === 'system') {
    window.applyTheme();
  }
});

// Call applyTheme when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.applyTheme();
});
