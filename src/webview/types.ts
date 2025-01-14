import * as replicad from 'replicad'
import { ReplicadMeshedEdges } from 'replicad-threejs-helper'

export type ShapeConfig = {
  shape: replicad.AnyShape
  color?: string
  opacity?: number
  name?: string
}

export type ShapeResult =
  | replicad.AnyShape
  | replicad.AnyShape[]
  | ShapeConfig
  | ShapeConfig[]

export type ShapeInput = {
  code: string
  name?: string
  params: {}
}

export type ShapeMeshResult = ShapeInput & {
  shapes: ShapeMesh[]
}

export type ShapeMesh = Omit<ShapeConfig, 'shape'> & {
  faces: replicad.ShapeMesh
  edges: ReplicadMeshedEdges
}

export type ShapeExportResult = ShapeInput & {
  fileType: string
  shapes: {
    blob: Blob
    name?: string
  }[]
}

export type SuccessResult<T> = {
  type: 'success'
  value: T
}

export type LoadingResult<T> = {
  type: 'loading'
  value?: T
}

export type ErrorResult<T> = {
  type: 'error'
  error: unknown
  value?: T
}

export type Result<T> =
  | SuccessResult<T>
  | LoadingResult<T>
  | ErrorResult<T>
