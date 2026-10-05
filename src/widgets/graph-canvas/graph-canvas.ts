import { canvasSetup, useSigma, type GraphRenderer, type Selection } from './canvas-setup.ts'

type GraphCanvasProps = {
  selection: Selection | undefined
  /** Hands the renderer to the parent at the mount. Its cleanup runs before the renderer is killed. */
  onMount?: (renderer: GraphRenderer) => () => void
}

export function graphCanvas({ selection, onMount }: GraphCanvasProps): void {
  useSigma({
    view: selection,
    setup: (view) => canvasSetup(() => ({ selection: view() })),
    onMount,
  })
}
