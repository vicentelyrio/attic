import { createTheme, type MantineColorsTuple, rem } from '@mantine/core'

/* ------------------------------------------------------------------ */
/* Color tuples (index 0 = lightest, 9 = darkest)                     */
/* ------------------------------------------------------------------ */

// Primary accent. Base sits at index 6 so primaryShade.dark = 6 yields #5E6AD2.
const indigo: MantineColorsTuple = [
  '#eef0fb',
  '#d9ddf4',
  '#b2bcec',
  '#8b95e8', // light accent / glow highlight
  '#717ce0',
  '#626dd7',
  '#5e6ad2', // ← brand base
  '#4f5ac0',
  '#444ea8',
  '#373f8c',
]

// Override Mantine's built-in `dark` to match the layered surfaces.
// 0 = primary text … 9 = deepest background.
const dark: MantineColorsTuple = [
  '#ededf0', // text primary
  '#c9cad0', // text secondary-bright
  '#9a9ba2', // text muted
  '#8a8f98', // text muted (cooler)
  '#6b6d75', // text dimmed / icon
  '#2a2c31', // borders / hairlines (solid equiv. of white-alpha)
  '#0e0f12', // elevated cards, hover surfaces
  '#0a0b0d', // body / canvas background
  '#0c0d10', // side panels, inspector
  '#08090a', // deepest (auth / modal backdrop)
]

const green: MantineColorsTuple = [
  '#e7f8f1',
  '#cdeee2',
  '#a2e1cb',
  '#73d4b2',
  '#50caa0',
  '#3fc296',
  '#57b894',
  '#2f9a78',
  '#247f62',
  '#19654d',
]

const red: MantineColorsTuple = [
  '#fdecf0',
  '#f7d4dc',
  '#eea7b6',
  '#e57b90',
  '#df5b75',
  '#dc4868',
  '#e0697f',
  '#c73f5a',
  '#a8324a',
  '#8a273b',
]

const orange: MantineColorsTuple = [
  '#fdf1e6',
  '#f7dcc3',
  '#efbf90',
  '#e8a35f',
  '#e08f3f',
  '#dd842c',
  '#e0894b',
  '#c06d20',
  '#9e591a',
  '#7d4514',
]

const blue: MantineColorsTuple = [
  '#e9f2fe',
  '#cddffb',
  '#9dc1f6',
  '#6ba2f2',
  '#4b8def',
  '#3a82ee',
  '#5b9bf0',
  '#2f6dcb',
  '#2659a8',
  '#1d4585',
]

const violet: MantineColorsTuple = [
  '#f3eefb',
  '#e0d4f4',
  '#c2a9e8',
  '#a78bda',
  '#9170d0',
  '#8763cb',
  '#a78bda',
  '#6f4cb0',
  '#5b3f91',
  '#473174',
]

/* ------------------------------------------------------------------ */
/* Theme                                                              */
/* ------------------------------------------------------------------ */

export const theme = createTheme({
  primaryColor: 'indigo',
  // Filled indigo controls render #5E6AD2 in dark mode; slightly stronger in light.
  primaryShade: { light: 6, dark: 6 },

  colors: { indigo, dark, green, red, orange, blue, violet },

  // Semantic aliases used by Mantine internals.
  white: '#ededf0',
  black: '#08090a',

  fontFamily:
    "'Geist', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyMonospace:
    "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  headings: {
    fontFamily: "'Geist', system-ui, sans-serif",
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.2', fontWeight: '700' },
      h2: { fontSize: rem(24), lineHeight: '1.25' },
      h3: { fontSize: rem(20), lineHeight: '1.3' },
      h4: { fontSize: rem(16), lineHeight: '1.4' },
    },
  },

  fontSizes: {
    xs: rem(11),
    sm: rem(12.5),
    md: rem(13),
    lg: rem(15),
    xl: rem(18),
  },

  defaultRadius: 'md',
  radius: {
    xs: rem(4),
    sm: rem(6),
    md: rem(8),
    lg: rem(10),
    xl: rem(14),
  },

  shadows: {
    // Default elevations skew deep + tight, matching the dark frames.
    xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
    sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    md: '0 8px 24px rgba(0, 0, 0, 0.35)',
    lg: '0 16px 40px rgba(0, 0, 0, 0.4)',
    xl: '0 30px 70px rgba(0, 0, 0, 0.35)', // frame / modal shadow
  },

  // Vault uses a subtle indigo glow on the active accent. Exposed as a CSS var
  // you can reference anywhere: var(--mantine-accent-glow).
  other: {
    accentGlow: '0 2px 10px rgba(94, 106, 210, 0.45)',
    accentGlowLg: '0 4px 16px rgba(94, 106, 210, 0.4)',
    borderSubtle: 'rgba(255, 255, 255, 0.06)',
    surfaceHover: 'rgba(255, 255, 255, 0.035)',
  },

  /* ---------------------------------------------------------------- */
  /* Component defaults                                               */
  /* ---------------------------------------------------------------- */
  components: {
    Button: {
      defaultProps: { radius: 'md' },
      styles: (_theme: unknown, props: { variant?: string }) => ({
        root:
          props.variant === 'filled' || props.variant === undefined
            ? {
                // inner highlight + indigo glow, like the Vault primary buttons
                boxShadow:
                  'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 10px rgba(94, 106, 210, 0.35)',
                fontWeight: 600,
              }
            : { fontWeight: 500 },
      }),
    },

    Paper: {
      defaultProps: { radius: 'lg' },
      styles: {
        root: {
          backgroundColor: 'var(--mantine-color-dark-6)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
        },
      },
    },

    Card: {
      defaultProps: { radius: 'lg', withBorder: true },
      styles: {
        root: {
          backgroundColor: 'var(--mantine-color-dark-6)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
        },
      },
    },

    Input: {
      styles: {
        input: {
          backgroundColor: 'rgba(255, 255, 255, 0.035)',
          borderColor: 'rgba(255, 255, 255, 0.09)',
        },
      },
    },

    Kbd: {
      styles: {
        root: {
          fontFamily: "'Geist Mono', ui-monospace, monospace",
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
          color: 'var(--mantine-color-dark-4)',
        },
      },
    },

    Code: {
      styles: {
        root: { fontFamily: "'Geist Mono', ui-monospace, monospace" },
      },
    },

    Tooltip: {
      defaultProps: { radius: 'sm' },
    },

    Modal: {
      defaultProps: { radius: 'lg', shadow: 'xl' },
      styles: {
        content: { backgroundColor: 'var(--mantine-color-dark-8)' },
        header: { backgroundColor: 'var(--mantine-color-dark-8)' },
      },
    },
  },
})
