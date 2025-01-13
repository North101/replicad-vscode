import * as replicad from 'replicad'

export interface InputShape {
  shape: replicad.Shape<any>
  name?: string
  color?: string
  opacity?: number
  highlight?: any
  highlightEdge?: any
  highlightFace?: any
  strokeType?: string
}

export interface Mesh extends Omit<InputShape, 'shape'> {
  faces: replicad.ShapeMesh
  edges: {
    lines: number[]
    edgeGroups: {
      start: number
      count: number
      edgeId: number
    }[]
  }
}
