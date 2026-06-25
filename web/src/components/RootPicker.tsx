interface Props {
  roots: string[]
  current: string | null
  onChange: (root: string) => void
}

export function RootPicker({ roots, current, onChange }: Props) {
  return (
    <select
      className="rootpicker"
      value={current ?? ''}
      onChange={(e) => onChange(e.target.value)}
    >
      {roots.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  )
}
