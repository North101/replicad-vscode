import { Endpoint, expose } from 'comlink'
import * as replicad from 'replicad'

import type { OpenCascadeInstance } from 'replicad-opencascadejs'
import initOpenCascade from './initOCSingle'
//import initOpenCascadeWithExceptions from './initOCWithExceptions'
import type { ShapeMeshResult, ShapeConfig, ShapeResult } from './types'
import { buildModuleEvaluator, runInContext } from './vm'
import normalizeColor from './normalizeColor'
import font from '../fonts/HKGrotesk-Regular.ttf?inline'

(self as any).replicad = replicad

function runInContextAsOC(code: string, context = {}): RunResult {
  const editedText = `
${code}

return (() => {
  let params
  try {
    params = defaultParams
  } catch (e) {}
  params = __inputParams ?? params ?? {}

  let name
  try {
    name = defaultName
  } catch (e) {}

  return {
    name,
    params,
    shapes: main(replicad, params)
  }
})()
`

  return {
    code,
    ...runInContext(editedText, context),
  }
}

type RunResult = {
  code: string
  name?: string
  params: {
    [key: string]: any
  }
  shapes: ShapeResult
}

async function runAsFunction(code: string, params?: {}): Promise<RunResult> {
  await OC

  return runInContextAsOC(code, {
    oc: replicad.getOC(),
    replicad,
    __inputParams: params,
  })
}

async function runAsModule(code: string, params?: {}): Promise<RunResult> {
  const module = await buildModuleEvaluator(code)

  const func = module.default
    ? module.default
    : module.main

  params = params ?? module.defaultParams ?? {}
  return {
    code,
    name: module.defaultName,
    params: params!,
    shapes: func(params),
  }
}

const isModule = (code: string) => code.match(/^\s*export\s+/m)

const runCode = async (code: string, params?: {}) => {
  if (isModule(code)) {
    return runAsModule(code, params)
  }
  return runAsFunction(code, params)
}

const extractDefaultParamsFromCode = async (code: string) => {
  if (isModule(code)) {
    const module = await buildModuleEvaluator(code)
    return module.defaultParams || null
  }

  const editedText = `
${code}

try {
  return defaultParams
} catch (e) {
  return null
}
`

  try {
    return runInContext(editedText, {})
  } catch (e) {
    return {}
  }
}

const extractDefaultNameFromCode = async (code: string) => {
  if (isModule(code)) {
    const module = await buildModuleEvaluator(code)
    return module.defaultName || null
  }

  const editedText = `
${code}

try {
  return defaultName
} catch (e) {
  return null
}
`

  try {
    return runInContext(editedText, {})
  } catch (e) {
    return null
  }
}

type CachedShape = {
  code: string
  name?: string
  params: {}
  shapes: ShapeConfig[]
}

const CACHED_SHAPES: {
  [key: string]: CachedShape
} = {}

const ocVersions: {
  withExceptions: Promise<OpenCascadeInstance> | null
  single: Promise<OpenCascadeInstance> | null
  current: 'withExceptions' | 'single' | null
} = {
  withExceptions: null,
  single: null,
  current: null,
}

let OC: Promise<OpenCascadeInstance> = (() => {
  const p = Promise.reject<OpenCascadeInstance>('OpenCascade not initialized')
  p.catch(() => {})
  return p
})()

function enableExceptions() {
  // if (!ocVersions.withExceptions) {
  //   ocVersions.withExceptions = initOpenCascadeWithExceptions()
  // }
  // ocVersions.current = 'withExceptions'
  // OC = ocVersions.withExceptions
}

function disableExceptions() {
  if (!ocVersions.single) {
    ocVersions.single = initOpenCascade()
  }
  ocVersions.current = 'single'
  OC = ocVersions.single
}

disableExceptions()

async function toggleExceptions() {
  if (ocVersions.current === 'single') {
    enableExceptions()
  } else {
    disableExceptions()
  }

  await OC
  return ocVersions.current
}


const formatException = (oc: any, e: any) => {
  let message = 'error'

  if (typeof e === 'number') {
    if (oc.OCJS) {
      const error = oc.OCJS.getStandard_FailureData(e)
      message = error.GetMessageString()
    } else {
      message = `Kernel error ${e}`
    }
  } else {
    message = e.message
    console.error(e)
  }

  return {
    error: true,
    message,
    stack: e.stack,
  }
}

const normalizeShapeConfig = (
  inputShapes: ShapeResult,
  baseName = 'Shape'
): ShapeConfig[] => {
  if (!inputShapes) return []

  // We accept a single shape or an array of shapes
  const shapes = Array.isArray(inputShapes)
    ? inputShapes
    : [inputShapes]

  return shapes
    .map((inputShape, index) =>
      // We accept shapes without additional configuration
      'shape' in inputShape
        ? {
          ...inputShape,
          name: inputShape.name ?? `${baseName} ${index}`,
        }
        : {
          name: `${baseName} ${index}`,
          shape: inputShape,
        }
    )
}

const normalizeShape = (shape: RunResult): CachedShape => {
  const { shapes, ...rest } = shape
  return {
    ...rest,
    shapes: normalizeShapeConfig(shapes),
  }
}

const serializeShape = (cachedShape: CachedShape): ShapeMeshResult => {
  const { shapes, ...rest } = cachedShape
  return {
    ...rest,
    shapes: cachedShape.shapes
      .map(({ shape, color, opacity, ...rest }) => ({
        ...rest,
        faces: shape.mesh(),
        edges: shape.meshEdges(),
        ...normalizeColorAndOpacity(color, opacity),
      })),
  }
}

const normalizeColorAndOpacity = (color?: string, opacity?: number): {
  color?: string
  opacity?: number
} => {
  const normalizedColor = color ? normalizeColor(color) : null
  const configuredOpacity = opacity ?? normalizedColor?.alpha ?? 1

  return {
    color: normalizedColor?.color,
    opacity: configuredOpacity,
  }
}

const getCachedShape = (shapeId: string, code: string, params?: {}) => {
  const cachedShape = CACHED_SHAPES[shapeId]
  return cachedShape?.code == code && (params == undefined || cachedShape?.params == params)
    ? cachedShape
    : null
}

const buildShapesFromCode = async (shapeId: string, code: string, params?: {}): Promise<ShapeMeshResult> => {
  const oc = await OC
  replicad.setOC(oc)
  if (!replicad.getFont()) {
    await replicad.loadFont(font)
  }

  const cachedShape = getCachedShape(shapeId, code, params)
  if (cachedShape) {
    return serializeShape(cachedShape)
  }

  try {
    const cachedShape = normalizeShape(await runCode(code, params))
    CACHED_SHAPES[shapeId] = cachedShape

    return serializeShape(cachedShape)
  } catch (e) {
    //return formatException(oc, e)
    throw e
  }
}

const clearCachedShape = (shapeId: string) => {
  delete CACHED_SHAPES[shapeId]
}

const buildBlob = (
  shape: replicad.AnyShape,
  fileType: string,
  meshConfig: {
    tolerance?: number
    angularTolerance?: number
    binary?: boolean
  } = {
      tolerance: 0.01,
      angularTolerance: 30,
    }
) => {
  switch (fileType) {
    case 'stl':
      return shape.blobSTL(meshConfig)
    case 'stl-binary':
      return shape.blobSTL({ ...meshConfig, binary: true })
    case 'step':
      return shape.blobSTEP()
    default:
      throw new Error(`Filetype '${fileType}' unknown for export.`)
  }
}

const exportShape = async (
  shapeId: string,
  fileType = 'stl',
  meshConfig?: {
    tolerance?: number
    angularTolerance?: number
    binary?: boolean
  },
) => {
  const cachedShape = CACHED_SHAPES[shapeId]
  if (!cachedShape) {
    throw new Error(`Shape ${shapeId} not computed yet`)
  }

  const { shapes, name, ...rest } = cachedShape
  if (fileType === 'step-assembly') {
    return {
      ...rest,
      fileType,
      shapes: [
        {
          blob: replicad.exportSTEP(cachedShape.shapes),
          name,
        },
      ],
    }
  }

  return {
    ...rest,
    fileType,
    shapes: shapes.map(({ shape, name }) => ({
      blob: buildBlob(shape, fileType, meshConfig),
      name,
    })),
  }
}

const faceInfo = (subshapeIndex: number, faceIndex: number, shapeId: string) => {
  const face = CACHED_SHAPES[shapeId].shapes?.[subshapeIndex].shape.faces[faceIndex]
  if (!face) return null

  return {
    type: face.geomType,
    center: face.center.toTuple(),
    normal: face.normalAt().normalize().toTuple(),
  }
}

const edgeInfo = (subshapeIndex: number, edgeIndex: number, shapeId: string) => {
  const edge = CACHED_SHAPES[shapeId].shapes?.[subshapeIndex]?.shape.edges[edgeIndex]
  if (!edge) return null

  return {
    type: edge.geomType,
    start: edge.startPoint.toTuple(),
    end: edge.endPoint.toTuple(),
    direction: edge.tangentAt().normalize().toTuple(),
  }
}

const service = {
  ready: () => OC.then(() => true),
  clearCachedShape,
  buildShapesFromCode,
  extractDefaultParamsFromCode,
  extractDefaultNameFromCode,
  exportShape,
  edgeInfo,
  faceInfo,
  toggleExceptions,
  exceptionsEnabled: () => ocVersions.current === 'withExceptions',
}

expose(service, self as Endpoint)
export type {
  service as BuilderWorkerType
}
