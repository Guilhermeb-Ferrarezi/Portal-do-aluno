import { useEffect } from 'react';

const SETTINGS_KEY = 'perfil_settings';

type Theme = 'sistema' | 'claro' | 'escuro';

export function useTheme() {
  useEffect(() => {
    // Load theme preference from settings
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    let theme: Theme = 'sistema';

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        theme = settings.temaPreferido || 'sistema';
      } catch (e) {
        console.error('Erro ao carregar tema:', e);
      }
    }

    // Apply theme
    applyTheme(theme);

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SETTINGS_KEY && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue);
          applyTheme(settings.temaPreferido || 'sistema');
        } catch (err) {
          console.error('Erro ao aplicar tema:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event when settings are saved in same tab
    const handleSettingsChange = (e: any) => {
      const theme = e.detail?.temaPreferido || 'sistema';
      applyTheme(theme);
    };

    window.addEventListener('perfil-settings-changed', handleSettingsChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('perfil-settings-changed', handleSettingsChange);
    };
  }, []);
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;

  if (theme === 'escuro') {
    html.setAttribute('data-theme', 'dark');
    html.style.colorScheme = 'dark';
  } else if (theme === 'claro') {
    html.removeAttribute('data-theme');
    html.style.colorScheme = 'light';
  } else {
    // sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      html.setAttribute('data-theme', 'dark');
      html.style.colorScheme = 'dark';
    } else {
      html.removeAttribute('data-theme');
      html.style.colorScheme = 'light';
    }
  }
}
