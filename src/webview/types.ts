import * as replicad from 'replicad'
import { TopoDS_Shape } from 'replicad-opencascadejs'

export interface InputShape<T extends TopoDS_Shape> {
  shape: replicad.Shape<T>
  name?: string
  color?: string
  opacity?: number
  highlight?: any
  highlightEdge?: any
  highlightFace?: any
  strokeType?: string
}

export type ShapeResult<T extends TopoDS_Shape> = 
  | replicad.Shape<T>
  | replicad.Shape<T>[]
  | InputShape<T>
  | InputShape<T>[]

export interface Mesh<T extends TopoDS_Shape> extends Omit<InputShape<T>, 'shape'> {
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

export interface SuccessResult<T> {
  type: 'success'
  value: T
}

export interface ErrorResult {
  type: 'error'
  error: unknown
}

export type Result<T> = SuccessResult<T> | ErrorResult
