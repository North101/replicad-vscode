import {
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'
import {
  ThreeEvent,
  useThree,
} from '@react-three/fiber'
import * as replicad from 'replicad'
import {
  getEdgeIndex,
  getFaceIndex,
  highlightInGeometry,
  ReplicadMeshedEdges,
  syncFaces,
  syncLines,
} from 'replicad-threejs-helper'
import { BufferGeometry } from 'three'

export const useApplyHighlights = (geometry: BufferGeometry, highlight: number | number[] | undefined) => {
  const { invalidate } = useThree()

  useLayoutEffect(() => {
    let toHighlight: number[]

    if (!highlight && highlight !== 0) {
      toHighlight = []
    } else if (!Array.isArray(highlight)) {
      toHighlight = [highlight]
    } else {
      toHighlight = highlight
    }

    highlightInGeometry(toHighlight, geometry as any)
    invalidate()
  }, [geometry, highlight, invalidate])
}

export const getEdgeIndexFromEvent = (event: ThreeEvent<MouseEvent>) => {
  return getEdgeIndex(event.index!, (event.object as any).geometry)
}

export const getFaceIndexFromEvent = (event: ThreeEvent<MouseEvent>) => {
  return getFaceIndex(event.faceIndex!, (event.object as any).geometry)
}

export const useWrappedEdgeEvent = (onEvent?: (e: ThreeEvent<MouseEvent>, edgeIndex: number) => void) => {
  return useMemo(() => {
    if (!onEvent) return null

    return (e: ThreeEvent<MouseEvent>) => {
      onEvent(e, getEdgeIndexFromEvent(e))
    }
  }, [onEvent])
}

export const useWrappedFaceEvent = (onEvent?: (e: ThreeEvent<MouseEvent>, faceIndex: number) => void) => {
  return useMemo(() => {
    if (!onEvent) return null

    return (e: ThreeEvent<MouseEvent>) => {
      onEvent(e, getFaceIndexFromEvent(e))
    }
  }, [onEvent])
}

export const useFaceGeometry = (faces: replicad.ShapeMesh, highlight: number[] | undefined) => {
  const { invalidate } = useThree()

  const body = useRef(new BufferGeometry())

  useLayoutEffect(() => {
    if (!faces) return
    syncFaces(body.current, faces, highlight)
    invalidate()
  }, [faces, highlight, invalidate])

  useEffect(
    () => () => {
      body.current.dispose()
      invalidate()
    },
    [invalidate]
  )

  return body.current
}

export const useLinesGeometry = (edges: ReplicadMeshedEdges, highlight: number[] | undefined) => {
  const { invalidate } = useThree()

  const lines = useRef(new BufferGeometry())

  useLayoutEffect(() => {
    syncLines(lines.current, edges, highlight)
    invalidate()
  }, [edges, highlight, invalidate])

  useEffect(
    () => () => {
      lines.current.dispose()
      invalidate()
    },
    [invalidate]
  )

  return lines.current
}

type ReplicadFacesMeshProps = {
  faces: replicad.ShapeMesh
  defaultHighlight?: number[]
  highlight?: number | number[]
} & PropsWithChildren

export const ReplicadFacesMesh = ({
  faces,
  defaultHighlight,
  highlight,
  children,
  ...props
}: ReplicadFacesMeshProps) => {
  const faceGeometry = useFaceGeometry(faces, defaultHighlight)
  useApplyHighlights(faceGeometry, highlight)

  return (
    <mesh {...props}>
      <primitive object={faceGeometry} attach='geometry' />
      {children}
    </mesh>
  )
}

type ReplicadEdgesMeshProps = {
  edges: ReplicadMeshedEdges
  defaultHighlight?: number[]
  highlight?: number | number[]
} & PropsWithChildren

export const ReplicadEdgesMesh = ({
  edges,
  defaultHighlight,
  highlight,
  children,
  ...props
}: ReplicadEdgesMeshProps) => {
  const linesGeometry = useLinesGeometry(edges, defaultHighlight)
  useApplyHighlights(linesGeometry, highlight)

  return (
    <lineSegments {...props}>
      <primitive object={linesGeometry} attach='geometry' />
      {children}
    </lineSegments>
  )
}
