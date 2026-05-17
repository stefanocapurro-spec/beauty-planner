/**
 * 4 feminine colour palettes × 2 modes (light / dark).
 * Each palette exposes CSS custom-property values that are applied to :root.
 */

export const PALETTES = {
  rosa: {
    label: 'Rosa Antico',
    emoji: '🌸',
    light: {
      '--c-bg':          '#fdf6f7',
      '--c-surface':     '#fff9fa',
      '--c-surface-2':   '#fce8ec',
      '--c-border':      '#f5c9d3',
      '--c-primary':     '#c06080',
      '--c-primary-2':   '#a84f6c',
      '--c-accent':      '#e891a8',
      '--c-text':        '#3d1a24',
      '--c-text-2':      '#7a4a58',
      '--c-text-3':      '#b07888',
      '--c-success':     '#6aaa6a',
      '--c-warning':     '#d4942a',
      '--c-danger':      '#cc3355',
    },
    dark: {
      '--c-bg':          '#1e0d12',
      '--c-surface':     '#2b141a',
      '--c-surface-2':   '#3d1e27',
      '--c-border':      '#5a2d3a',
      '--c-primary':     '#e891a8',
      '--c-primary-2':   '#f0b0c2',
      '--c-accent':      '#c06080',
      '--c-text':        '#fce8ec',
      '--c-text-2':      '#d4a0b0',
      '--c-text-3':      '#a07080',
      '--c-success':     '#7bc97b',
      '--c-warning':     '#e5a84a',
      '--c-danger':      '#ff6680',
    },
  },

  lavanda: {
    label: 'Lavanda',
    emoji: '💜',
    light: {
      '--c-bg':          '#f7f5fd',
      '--c-surface':     '#fbfaff',
      '--c-surface-2':   '#eae4f8',
      '--c-border':      '#d0c4ef',
      '--c-primary':     '#7c5cbf',
      '--c-primary-2':   '#6648aa',
      '--c-accent':      '#b49ee0',
      '--c-text':        '#1e1430',
      '--c-text-2':      '#5a4878',
      '--c-text-3':      '#9880b8',
      '--c-success':     '#6aaa6a',
      '--c-warning':     '#c48c28',
      '--c-danger':      '#cc3355',
    },
    dark: {
      '--c-bg':          '#110d1e',
      '--c-surface':     '#1c1530',
      '--c-surface-2':   '#2c2248',
      '--c-border':      '#4a3870',
      '--c-primary':     '#b49ee0',
      '--c-primary-2':   '#cdbfee',
      '--c-accent':      '#7c5cbf',
      '--c-text':        '#eae4f8',
      '--c-text-2':      '#b8a8d8',
      '--c-text-3':      '#8878a8',
      '--c-success':     '#7bc97b',
      '--c-warning':     '#e5a84a',
      '--c-danger':      '#ff6680',
    },
  },

  pesca: {
    label: 'Pesca & Corallo',
    emoji: '🍑',
    light: {
      '--c-bg':          '#fdf8f4',
      '--c-surface':     '#fffcfa',
      '--c-surface-2':   '#fce8dc',
      '--c-border':      '#f5cdb8',
      '--c-primary':     '#c26040',
      '--c-primary-2':   '#a84f30',
      '--c-accent':      '#e8946a',
      '--c-text':        '#3d1e0d',
      '--c-text-2':      '#7a4828',
      '--c-text-3':      '#b07858',
      '--c-success':     '#5a9a5a',
      '--c-warning':     '#c48c28',
      '--c-danger':      '#cc3344',
    },
    dark: {
      '--c-bg':          '#1e0e06',
      '--c-surface':     '#2b160a',
      '--c-surface-2':   '#3d2012',
      '--c-border':      '#5a3020',
      '--c-primary':     '#e8946a',
      '--c-primary-2':   '#f0b090',
      '--c-accent':      '#c26040',
      '--c-text':        '#fce8dc',
      '--c-text-2':      '#d4a888',
      '--c-text-3':      '#a07858',
      '--c-success':     '#7bc97b',
      '--c-warning':     '#e5a84a',
      '--c-danger':      '#ff6680',
    },
  },

  salvia: {
    label: 'Salvia & Menta',
    emoji: '🌿',
    light: {
      '--c-bg':          '#f4faf6',
      '--c-surface':     '#f9fdfb',
      '--c-surface-2':   '#d8f0e2',
      '--c-border':      '#b0d8c0',
      '--c-primary':     '#4a8c64',
      '--c-primary-2':   '#367850',
      '--c-accent':      '#78c098',
      '--c-text':        '#0d2818',
      '--c-text-2':      '#385848',
      '--c-text-3':      '#688878',
      '--c-success':     '#3a9a3a',
      '--c-warning':     '#c48c28',
      '--c-danger':      '#cc3355',
    },
    dark: {
      '--c-bg':          '#061410',
      '--c-surface':     '#0c1e18',
      '--c-surface-2':   '#162e22',
      '--c-border':      '#2a4e38',
      '--c-primary':     '#78c098',
      '--c-primary-2':   '#98d8b4',
      '--c-accent':      '#4a8c64',
      '--c-text':        '#d8f0e2',
      '--c-text-2':      '#98c8a8',
      '--c-text-3':      '#688878',
      '--c-success':     '#7bc97b',
      '--c-warning':     '#e5a84a',
      '--c-danger':      '#ff6680',
    },
  },
}

export const DEFAULT_PALETTE = 'rosa'
export const PALETTE_KEYS = Object.keys(PALETTES)

/** Apply a palette to the document root */
export function applyTheme(paletteKey, mode) {
  const palette = PALETTES[paletteKey] || PALETTES[DEFAULT_PALETTE]
  const vars = mode === 'dark' ? palette.dark : palette.light
  const root = document.documentElement
  for (const [prop, value] of Object.entries(vars)) {
    root.style.setProperty(prop, value)
  }
}

/** Returns 'light' | 'dark' for a given preference */
export function resolveMode(preference) {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}
