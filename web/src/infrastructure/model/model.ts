import type * as THREE from 'three'

/** Cap the backing-store resolution so thumbnails stay cheap on hi-dpi screens. */
const MAX_DPR = 2
/** Camera vertical field of view, in degrees. */
const FOV = 40
/** Extra distance factor so the model doesn't touch the frame edges. */
const FIT_PADDING = 1.18
/** Neutral model colour that reads well on the dark card background. */
const MODEL_COLOR = 0xb8bcc4
/** Auto-spin speed, radians per frame. */
const SPIN_SPEED = 0.01
/** Drag sensitivity, radians per pixel. */
const DRAG_SPEED = 0.01
/** Clamp pitch so dragging can't flip the model upside down. */
const PITCH_LIMIT = 1.4
/** Resting orientation — a three-quarter view. */
const REST_YAW = -0.6
const REST_PITCH = 0.45

type ThreeModule = typeof import('three')
type Loaders = {
  STLLoader: typeof import('three/addons/loaders/STLLoader.js').STLLoader
}

/** Loads three.js + the STL loader once, shared across all previews. */
let libsPromise: Promise<{ three: ThreeModule } & Loaders> | null = null
function loadLibs() {
  libsPromise ??= Promise.all([
    import('three'),
    import('three/addons/loaders/STLLoader.js'),
  ]).then(([three, { STLLoader }]) => ({ three, STLLoader }))
  return libsPromise
}

/**
 * A single offscreen WebGL renderer is reused for every preview. Creating one
 * context per card would quickly hit the browser's WebGL context limit, so we
 * render offscreen and blit the pixels into each card's plain 2D canvas. Only
 * one card animates at a time, so sharing the renderer is safe.
 */
let renderer: THREE.WebGLRenderer | null = null
function getRenderer(three: ThreeModule): THREE.WebGLRenderer {
  renderer ??= new three.WebGLRenderer({ antialias: true, alpha: true })
  return renderer
}

export type ModelViewer = {
  /** Start the hover auto-spin loop. */
  startSpin: () => void
  /** Stop spinning and rest on the current orientation. */
  stopSpin: () => void
  /** Begin a drag-to-rotate gesture at the given pointer position. */
  beginDrag: (x: number, y: number) => void
  /** Update rotation from the current pointer position while dragging. */
  drag: (x: number, y: number) => void
  /** End the drag gesture. */
  endDrag: () => void
  /** Release GPU/geometry resources; call on unmount. */
  dispose: () => void
}

export type ModelViewerOptions = {
  /** CSS width the thumbnail is displayed at. */
  width?: number
  /** CSS height the thumbnail is displayed at. */
  height?: number
}

/**
 * Load an STL model and return an interactive viewer that renders into `target`
 * (a plain 2D canvas). Supports hover auto-spin and drag-to-rotate. Rejects if
 * the model fails to load or parse.
 */
export async function createModelViewer(
  target: HTMLCanvasElement,
  url: string,
  { width = 480, height = 300 }: ModelViewerOptions = {},
): Promise<ModelViewer> {
  const { three, STLLoader } = await loadLibs()

  const geometry = await new Promise<THREE.BufferGeometry>(
    (resolve, reject) => {
      new STLLoader().load(url, resolve, undefined, reject)
    },
  )

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  const pw = Math.round(width * dpr)
  const ph = Math.round(height * dpr)
  target.width = pw
  target.height = ph
  const ctx = target.getContext('2d')

  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  const box = geometry.boundingBox as THREE.Box3
  const center = box.getCenter(new three.Vector3())
  const radius = box.getBoundingSphere(new three.Sphere()).radius || 1

  const scene = new three.Scene()
  const pivot = new three.Group()
  pivot.rotation.order = 'YXZ' // yaw first, then pitch — natural turntable feel

  const material = new three.MeshStandardMaterial({
    color: MODEL_COLOR,
    metalness: 0.1,
    roughness: 0.65,
  })
  const mesh = new three.Mesh(geometry, material)
  mesh.position.sub(center) // recenter model at the origin
  pivot.add(mesh)
  scene.add(pivot)

  scene.add(new three.HemisphereLight(0xffffff, 0x2a2c31, 1.1))
  const key = new three.DirectionalLight(0xffffff, 1.8)
  key.position.set(1, 1.3, 1)
  scene.add(key)
  const fill = new three.DirectionalLight(0xffffff, 0.55)
  fill.position.set(-1, -0.4, -1)
  scene.add(fill)

  const camera = new three.PerspectiveCamera(
    FOV,
    pw / ph,
    radius * 0.01,
    radius * 100,
  )
  const dist = (radius / Math.sin((FOV / 2) * (Math.PI / 180))) * FIT_PADDING
  camera.position.set(0, 0, dist)
  camera.lookAt(0, 0, 0)

  let yaw = REST_YAW
  let pitch = REST_PITCH
  let raf = 0
  let spinning = false
  let dragging = false
  let lastX = 0
  let lastY = 0
  let disposed = false

  const size = new three.Vector2()

  function render() {
    if (disposed) return
    const engine = getRenderer(three)
    engine.getSize(size)
    if (size.x !== pw || size.y !== ph) engine.setSize(pw, ph, false)
    engine.setClearColor(0x000000, 0)

    pivot.rotation.y = yaw
    pivot.rotation.x = pitch
    engine.render(scene, camera)

    // The WebGL canvas has a transparent background, so clear before blitting
    // to avoid trails from the previous frame.
    ctx?.clearRect(0, 0, pw, ph)
    ctx?.drawImage(engine.domElement, 0, 0)
  }

  function loop() {
    yaw += SPIN_SPEED
    render()
    raf = requestAnimationFrame(loop)
  }

  render() // initial resting frame

  return {
    startSpin() {
      if (disposed || spinning || dragging) return
      spinning = true
      raf = requestAnimationFrame(loop)
    },
    stopSpin() {
      spinning = false
      cancelAnimationFrame(raf)
      render()
    },
    beginDrag(x, y) {
      if (disposed) return
      spinning = false
      cancelAnimationFrame(raf)
      dragging = true
      lastX = x
      lastY = y
    },
    drag(x, y) {
      if (!dragging) return
      yaw += (x - lastX) * DRAG_SPEED
      pitch += (y - lastY) * DRAG_SPEED
      pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch))
      lastX = x
      lastY = y
      render()
    },
    endDrag() {
      dragging = false
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      geometry.dispose()
      material.dispose()
    },
  }
}
