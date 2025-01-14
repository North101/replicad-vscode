import { complement, darken, lighten } from 'polished'
import React from 'react'
import { ShapeMesh } from '../types'

import {
  ReplicadEdgesMesh,
  ReplicadFacesMesh
} from './replicadMesh'

const colorVariants = (baseColor = '#5a8296') => {
  return {
    base: baseColor,
    line: darken(0.2, baseColor),
    selected: lighten(0.15, baseColor),
    lineselected: lighten(0.25, baseColor),
    sideColor: complement(baseColor),
  }
}

type ShapeGeometryProps = {
  visible: boolean
} & ShapeMesh

export default React.memo(function ShapeMeshes({
  faces,
  edges,
  color,
  opacity,
  visible,
}: ShapeGeometryProps) {
  const colors = colorVariants(color)
  const transparent = (opacity ?? 1) !== 1

  return (
    <group visible={visible}>
      <ReplicadFacesMesh
        faces={faces}
      >
        <meshBasicMaterial
          attach='material-0'
          transparent={transparent}
          opacity={opacity}
          color={colors.base}
          polygonOffset
          polygonOffsetFactor={2.0}
          polygonOffsetUnits={1.0}
        />
        <meshBasicMaterial
          attach='material-1'
          transparent={transparent}
          opacity={opacity}
          color={colors.selected}
          polygonOffset
          polygonOffsetFactor={2.0}
          polygonOffsetUnits={1.0}
        />
      </ReplicadFacesMesh>
      <ReplicadEdgesMesh
        edges={edges}
      >
        <lineBasicMaterial
          attach='material-0'
          transparent={transparent}
          opacity={opacity}
          color={colors.line}
        />
        <lineBasicMaterial
          attach='material-1'
          transparent={transparent}
          opacity={opacity}
          color={colors.lineselected}
        />
      </ReplicadEdgesMesh>
    </group>
  )
})
