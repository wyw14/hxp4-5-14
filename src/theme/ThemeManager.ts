export interface Theme {
  id: string;
  name: string;
  icon: string;
  description: string;
  variables: Record<string, string>;
}

export const themes: Theme[] = [
  {
    id: 'bright-classroom',
    name: '明亮课堂',
    icon: '☀️',
    description: '清新明亮的教室风格',
    variables: {
      '--bg-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '--bg-secondary': '#ffffff',
      '--bg-panel': '#fafafa',
      '--bg-card': '#ffffff',
      '--text-primary': '#333333',
      '--text-secondary': '#666666',
      '--text-muted': '#999999',
      '--accent-primary': '#667eea',
      '--accent-secondary': '#764ba2',
      '--accent-success': '#4caf50',
      '--accent-error': '#f44336',
      '--accent-info': '#2196f3',
      '--border-color': '#f0f0f0',
      '--border-color-light': '#e8e8e8',
      '--shadow-primary': '0 20px 60px rgba(0, 0, 0, 0.3)',
      '--shadow-card': '0 8px 20px rgba(102, 126, 234, 0.2)',
      '--paper-fill': '#fff8e7',
      '--paper-stroke': '#d4a574',
      '--valley-line': '#2196f3',
      '--mountain-line': '#f44336',
      '--folded-line': '#4caf50',
      '--btn-primary-bg': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '--btn-secondary-bg': '#f0f0f0',
      '--btn-secondary-hover': '#e0e0e0',
      '--btn-next-bg': 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
      '--stat-bg': 'rgba(255, 255, 255, 0.2)',
      '--result-success-bg': '#e8f5e9',
      '--result-success-text': '#2e7d32',
      '--result-error-bg': '#ffebee',
      '--result-error-text': '#c62828',
      '--result-info-bg': '#e3f2fd',
      '--result-info-text': '#1565c0',
    }
  },
  {
    id: 'night-eye-care',
    name: '夜间护眼',
    icon: '🌙',
    description: '深色主题，保护眼睛',
    variables: {
      '--bg-primary': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      '--bg-secondary': '#1e1e3a',
      '--bg-panel': '#252542',
      '--bg-card': '#2a2a4a',
      '--text-primary': '#e0e0e0',
      '--text-secondary': '#b0b0b0',
      '--text-muted': '#808080',
      '--accent-primary': '#7c3aed',
      '--accent-secondary': '#6366f1',
      '--accent-success': '#10b981',
      '--accent-error': '#ef4444',
      '--accent-info': '#3b82f6',
      '--border-color': '#3a3a5a',
      '--border-color-light': '#404060',
      '--shadow-primary': '0 20px 60px rgba(0, 0, 0, 0.6)',
      '--shadow-card': '0 8px 20px rgba(124, 58, 237, 0.3)',
      '--paper-fill': '#2d2d4a',
      '--paper-stroke': '#6366f1',
      '--valley-line': '#3b82f6',
      '--mountain-line': '#ef4444',
      '--folded-line': '#10b981',
      '--btn-primary-bg': 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
      '--btn-secondary-bg': '#3a3a5a',
      '--btn-secondary-hover': '#4a4a6a',
      '--btn-next-bg': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      '--stat-bg': 'rgba(255, 255, 255, 0.1)',
      '--result-success-bg': '#064e3b',
      '--result-success-text': '#6ee7b7',
      '--result-error-bg': '#7f1d1d',
      '--result-error-text': '#fca5a5',
      '--result-info-bg': '#1e3a5f',
      '--result-info-text': '#93c5fd',
    }
  },
  {
    id: 'paper-texture',
    name: '纸张质感',
    icon: '📜',
    description: '复古纸张，温暖舒适',
    variables: {
      '--bg-primary': 'linear-gradient(135deg, #d4a574 0%, #b8860b 100%)',
      '--bg-secondary': '#f5f0e1',
      '--bg-panel': '#ebe3d0',
      '--bg-card': '#f8f4e8',
      '--text-primary': '#5c4033',
      '--text-secondary': '#7a5a4a',
      '--text-muted': '#a08060',
      '--accent-primary': '#8b4513',
      '--accent-secondary': '#cd853f',
      '--accent-success': '#228b22',
      '--accent-error': '#b22222',
      '--accent-info': '#1e90ff',
      '--border-color': '#d4c4a8',
      '--border-color-light': '#e0d4bc',
      '--shadow-primary': '0 20px 60px rgba(139, 69, 19, 0.3)',
      '--shadow-card': '0 8px 20px rgba(139, 69, 19, 0.15)',
      '--paper-fill': '#fffaf0',
      '--paper-stroke': '#8b4513',
      '--valley-line': '#1e90ff',
      '--mountain-line': '#b22222',
      '--folded-line': '#228b22',
      '--btn-primary-bg': 'linear-gradient(135deg, #8b4513 0%, #cd853f 100%)',
      '--btn-secondary-bg': '#e8dcc8',
      '--btn-secondary-hover': '#d4c4a8',
      '--btn-next-bg': 'linear-gradient(135deg, #228b22 0%, #32cd32 100%)',
      '--stat-bg': 'rgba(255, 255, 255, 0.25)',
      '--result-success-bg': '#e8f5e9',
      '--result-success-text': '#2e7d32',
      '--result-error-bg': '#ffebee',
      '--result-error-text': '#c62828',
      '--result-info-bg': '#e3f2fd',
      '--result-info-text': '#1565c0',
    }
  }
];

export class ThemeManager {
  private currentThemeId: string = 'bright-classroom';
  private rootElement: HTMLElement;
  private storageKey: string = 'origami-game-theme';

  constructor() {
    this.rootElement = document.documentElement;
    this.loadSavedTheme();
  }

  private loadSavedTheme(): void {
    const savedThemeId = localStorage.getItem(this.storageKey);
    if (savedThemeId && this.themeExists(savedThemeId)) {
      this.currentThemeId = savedThemeId;
    }
    this.applyTheme(this.currentThemeId);
  }

  private themeExists(themeId: string): boolean {
    return themes.some(theme => theme.id === themeId);
  }

  getCurrentTheme(): Theme {
    return themes.find(theme => theme.id === this.currentThemeId) || themes[0];
  }

  getAllThemes(): Theme[] {
    return [...themes];
  }

  setTheme(themeId: string): boolean {
    if (!this.themeExists(themeId)) return false;
    
    this.currentThemeId = themeId;
    this.applyTheme(themeId);
    localStorage.setItem(this.storageKey, themeId);
    return true;
  }

  private applyTheme(themeId: string): void {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    Object.entries(theme.variables).forEach(([key, value]) => {
      this.rootElement.style.setProperty(key, value);
    });

    this.rootElement.dataset.theme = themeId;
  }

  resetToDefault(): void {
    this.setTheme('bright-classroom');
  }

  onThemeChange(callback: (theme: Theme) => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key === this.storageKey && e.newValue) {
        const theme = themes.find(t => t.id === e.newValue);
        if (theme) {
          this.applyTheme(e.newValue);
          callback(theme);
        }
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

export const themeManager = new ThemeManager();
