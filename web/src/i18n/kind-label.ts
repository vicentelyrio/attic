import type { FileKind } from '@infrastructure'

import type { TranslationFunctions } from './i18n-types'

/** Resolves a file kind to its localized label, falling back to "{EXT} file"
 *  for extensions we don't have a name for. */
export function kindLabel(LL: TranslationFunctions, kind: FileKind): string {
  return kind.ext
    ? LL.kinds.genericExt({ ext: kind.ext })
    : LL.kinds[kind.key]()
}
