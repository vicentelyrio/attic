export interface SearchHit {
  root: string
  path: string
  name: string
  parent: string
  is_dir: boolean
  size: number
  modified: number | null
}
