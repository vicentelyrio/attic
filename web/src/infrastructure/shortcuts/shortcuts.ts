import { useOs } from '@mantine/hooks'

export type ShortcutDef = {
  keys: string[]
  hotkey?: string
}

export const SHORTCUTS = {
  search: { keys: ['mod', 'K'], hotkey: 'mod+K' },
  upload: { keys: ['mod', 'U'], hotkey: 'mod+U' },
  quickLook: { keys: ['mod', 'I'], hotkey: 'mod+I' },
  fullscreen: { keys: ['mod', 'Space'], hotkey: 'mod+Space' },
  open: { keys: ['↵'] },
  copy: { keys: ['mod', 'C'], hotkey: 'mod+C' },
  cut: { keys: ['mod', 'X'], hotkey: 'mod+X' },
  paste: { keys: ['mod', 'V'], hotkey: 'mod+V' },
  duplicate: { keys: ['mod', 'D'], hotkey: 'mod+D' },
  download: { keys: ['mod', '↓'] },
  trash: { keys: ['mod', '⌫'], hotkey: 'mod+Backspace' },
  showHidden: { keys: ['mod', '⇧', '.'], hotkey: 'mod+shift+.' },
  previewNav: { keys: ['←', '→'] },
  previewZoom: { keys: ['space'] },
  previewInfo: { keys: ['i'] },
  previewClose: { keys: ['esc'] },
} as const satisfies Record<string, ShortcutDef>

export type ShortcutId = keyof typeof SHORTCUTS

export function useShortcut(id: ShortcutId): string {
  const os = useOs()
  const apple = os === 'macos' || os === 'ios'
  const mod = apple ? '⌘' : 'Ctrl'
  return SHORTCUTS[id].keys
    .map((k) => (k === 'mod' ? mod : k))
    .join(apple ? '' : ' ')
}
