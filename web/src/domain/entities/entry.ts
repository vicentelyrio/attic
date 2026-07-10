export interface Entry {
  name: string
  is_dir: boolean
  size: number
  created: number
  modified: number
  items: number
}

export interface Listing {
  writable: boolean
  entries: Entry[]
}
