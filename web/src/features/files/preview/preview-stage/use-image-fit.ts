import type { SyntheticEvent } from 'react'

export function useImageFit(onFit: (fitScale: number) => void) {
  const handleLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const stage = img.parentElement
    if (!stage || !img.naturalWidth || !img.naturalHeight) return

    const style = getComputedStyle(stage)
    const availWidth =
      stage.clientWidth -
      Number.parseFloat(style.paddingLeft) -
      Number.parseFloat(style.paddingRight)
    const availHeight =
      stage.clientHeight -
      Number.parseFloat(style.paddingTop) -
      Number.parseFloat(style.paddingBottom)

    const fitScale = Math.min(
      availWidth / img.naturalWidth,
      availHeight / img.naturalHeight,
    )
    onFit(fitScale)
  }

  return handleLoad
}
