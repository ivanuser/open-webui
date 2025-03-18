// Theme Fix Script
(() => {
  // Apply theme immediately to avoid FOUC (Flash of Unstyled Content)
  const applyTheme = () => {
    const metaThemeColorTag = document.querySelector('meta[name="theme-color"]');
    const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Get the theme from localStorage or default to system
    const theme = localStorage.getItem('theme') || 'system';
    
    // Clear any existing theme classes
    document.documentElement.classList.remove('dark', 'light', 'her');
    
    // Reset custom properties
    document.documentElement.style.removeProperty('--color-gray-800');
    document.documentElement.style.removeProperty('--color-gray-850');
    document.documentElement.style.removeProperty('--color-gray-900');
    document.documentElement.style.removeProperty('--color-gray-950');

    // Apply the appropriate theme
    if (theme === 'system') {
      document.documentElement.classList.add(prefersDarkTheme ? 'dark' : 'light');
      metaThemeColorTag?.setAttribute('content', prefersDarkTheme ? '#171717' : '#ffffff');
    } else if (theme === 'oled-dark') {
      document.documentElement.style.setProperty('--color-gray-800', '#101010');
      document.documentElement.style.setProperty('--color-gray-850', '#050505');
      document.documentElement.style.setProperty('--color-gray-900', '#000000');
      document.documentElement.style.setProperty('--color-gray-950', '#000000');
      document.documentElement.classList.add('dark');
      metaThemeColorTag?.setAttribute('content', '#000000');
    } else if (theme === 'light') {
      document.documentElement.classList.add('light');
      metaThemeColorTag?.setAttribute('content', '#ffffff');
    } else if (theme === 'her') {
      document.documentElement.classList.add('dark', 'her');
      metaThemeColorTag?.setAttribute('content', '#983724');
    } else {
      // Default to dark if theme is not recognized
      document.documentElement.classList.add('dark');
      metaThemeColorTag?.setAttribute('content', '#171717');
    }

    console.log('Theme applied:', theme);
  };

  // Make the function available globally
  window.applyTheme = applyTheme;

  // Apply theme immediately
  applyTheme();

  // Set up listener for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('theme') === 'system') {
      applyTheme();
    }
  });
})();
