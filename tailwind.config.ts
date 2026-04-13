import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── Surfaces ────────────────────────────────────────
        'background':                '#08080F',
        'surface':                   '#08080F',
        'surface-dim':               '#13131a',
        'surface-container-lowest':  '#0e0d15',
        'surface-container-low':     '#1b1b23',
        'surface-container':         '#1f1f27',
        'surface-container-high':    '#2a2931',
        'surface-container-highest': '#34343c',
        'surface-bright':            '#393841',
        'surface-variant':           '#34343c',
        'surface-tint':              '#7ad0ff',

        // ─── Primary — cyan ──────────────────────────────────
        'primary':                   '#00BFFF',
        'primary-fixed':             '#c3e8ff',
        'primary-fixed-dim':         '#7ad0ff',
        'primary-container':         '#00bfff',
        'inverse-primary':           '#00668a',
        'on-primary':                '#003549',
        'on-primary-fixed':          '#001e2c',
        'on-primary-fixed-variant':  '#004c69',
        'on-primary-container':      '#004a65',

        // ─── Secondary — gold ────────────────────────────────
        'secondary':                 '#F5A623',
        'secondary-fixed':           '#ffddb4',
        'secondary-fixed-dim':       '#ffb955',
        'secondary-container':       '#dc9100',
        'on-secondary':              '#452b00',
        'on-secondary-fixed':        '#291800',
        'on-secondary-fixed-variant':'#633f00',
        'on-secondary-container':    '#4f3100',

        // ─── Tertiary — rose ─────────────────────────────────
        'tertiary':                  '#ffbdbf',
        'tertiary-fixed':            '#ffdada',
        'tertiary-fixed-dim':        '#ffb3b5',
        'tertiary-container':        '#ff9399',
        'on-tertiary':               '#680019',
        'on-tertiary-fixed':         '#40000c',
        'on-tertiary-fixed-variant': '#920027',
        'on-tertiary-container':     '#8d0025',

        // ─── Error ───────────────────────────────────────────
        'error':                     '#FF4560',
        'error-container':           '#93000a',
        'on-error':                  '#690005',
        'on-error-container':        '#ffdad6',

        // ─── On-colors ───────────────────────────────────────
        'on-surface':                '#e4e1ec',
        'on-surface-variant':        '#bcc8d1',
        'on-background':             '#e4e1ec',

        // ─── Outline ─────────────────────────────────────────
        'outline':                   '#87929b',
        'outline-variant':           '#3d4850',

        // ─── Inverse ─────────────────────────────────────────
        'inverse-surface':           '#e4e1ec',
        'inverse-on-surface':        '#303038',
      },

      fontFamily: {
        'display':  ['var(--font-display)', 'sans-serif'],
        'headline': ['var(--font-headline)', 'sans-serif'],
        'body':     ['var(--font-body)', 'sans-serif'],
        'label':    ['var(--font-label)', 'monospace'],
        'mono':     ['var(--font-mono)', 'monospace'],
        'syne':     ['var(--font-syne)', 'sans-serif'],
      },

      borderRadius: {
        DEFAULT: '0.125rem',
        'sm':    '0.125rem',
        'md':    '0.375rem',
        'lg':    '0.5rem',
        'xl':    '0.75rem',
        '2xl':   '1rem',
        '3xl':   '1.5rem',
        'card':  '0.75rem',
        'pill':  '9999px',
        'full':  '9999px',
      },
    },
  },
  plugins: [],
}

export default config
