import type { NodeHoverDrawingFunction } from 'sigma/rendering'
import { fitViewportToNodes } from '@sigma/utils'
import type Sigma from 'sigma'
import type { Settings } from 'sigma/settings'

/** What the caller does with a renderer at its mount. */
export type SigmaSetup<N extends object, E extends object> = {
  settings: Partial<Settings<N, E>>
}

export type SigmaBinding<N extends object, E extends object, V> = {
  /** The state that the reducers draw. */
  view: V
  /** Builds the settings at the mount. `view` answers the value of the last render. */
  setup: (view: () => V) => SigmaSetup<N, E>
  onMount?: (sigma: Sigma<N, E>) => () => void
}

export function useSigma<N extends object, E extends object, V>(binding: SigmaBinding<N, E, V>): void {
  binding.setup(() => binding.view)
}

/** The attributes of a node of the graph. */
export type NodeAttributes = {
  x: number
  y: number
  size: number
  label: string
}

/** The attributes of an edge of the graph. */
export type EdgeAttributes = {
  size: number
}

/** The renderer of the graph of the app. */
export type GraphRenderer = Sigma<NodeAttributes, EdgeAttributes>

/** What the canvas draws as selected: one node, or one edge. */
export type Selection = { kind: 'node'; id: string } | { kind: 'edge'; id: string }

/** The view state that the reducers draw. */
export type CanvasView = { selection: Selection | undefined }

const emptyDrawer: NodeHoverDrawingFunction<NodeAttributes, EdgeAttributes> = () => {}

export function canvasSetup(view: () => CanvasView): SigmaSetup<NodeAttributes, EdgeAttributes> {
  void view()
  return { settings: { defaultDrawNodeHover: emptyDrawer } }
}

/**
 * Fits the camera to each node of the graph. Sigma rescales the graph into the viewport at each
 * refresh, thus the camera at its home state shows each node.
 */
export function fitToGraph(renderer: GraphRenderer): void {
  void fitViewportToNodes(renderer, [])
}
