import { Endpoint, expose } from 'comlink'
import * as replicad from 'replicad'
import opencascade from 'replicad-opencascadejs/src/replicad_single.js?inline'
import opencascadeWasm from 'replicad-opencascadejs/src/replicad_single.wasm?url'
import { InputShape, Mesh, ShapeResult } from './types'
import { buildModuleEvaluator, runInContext } from './vm'

// This is the logic to load the web assembly code into replicad
let loaded = false;
const init = async () => {
  if (loaded) {
    return Promise.resolve(true);
  }

  const OC = await (opencascade as any)({
    locateFile: () => opencascadeWasm,
  });

  loaded = true;
  replicad.setOC(OC);

  return true;
};
const started = init();

function createBasicShapeConfig(
  inputShapes: ShapeResult<any>,
): InputShape<any>[] {
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
          name: inputShape.name ?? `shape ${index}`,
        }
        : {
          name: `shape ${index}`,
          shape: inputShape,
        }
    )
}

async function createBlob(code: string, params: {}): Promise<Blob[]> {
  const shapes = await runCode(code, params)
  return createBasicShapeConfig(shapes)
    .map(shape => shape.shape.blobSTL())
}

async function createMesh(code: string, params: {}): Promise<Mesh<any>[]> {
  const shapes = await runCode(code, params)
  return createBasicShapeConfig(shapes)
    .map(({ shape, ...rest }) => ({
      ...rest,
      faces: shape.mesh(),
      edges: shape.meshEdges(),
    }))
}

function runInContextAsOC(code: string, context = {}) {
  const editedText = `
${code}
let dp = {}
try {
  dp = defaultParams;
} catch (e) {}
return main(replicad, __inputParams || dp)
  `;

  return runInContext(editedText, context);
}

async function runAsFunction(code: string, params: {}): Promise<ShapeResult<any>> {
  await started;

  return runInContextAsOC(code, {
    oc: replicad.getOC(),
    replicad,
    __inputParams: params,
  });
}

async function runAsModule(code: string, params: {}): Promise<ShapeResult<any>> {
  const module = await buildModuleEvaluator(code);

  if (module.default) return module.default(params || module.defaultParams);
  return module.main(replicad, params || module.defaultParams || {});
}

const runCode = async (code: string, params: {}): Promise<ShapeResult<any>> => {
  if (code.match(/^\s*export\s+/m)) {
    return runAsModule(code, params);
  }
  return runAsFunction(code, params);
};

const extractDefaultParamsFromCode = async (code: string): Promise<{} | null> => {
  if (code.match(/^\s*export\s+/m)) {
    const module = await buildModuleEvaluator(code);
    return module.defaultParams || null;
  }

  const editedText = `
${code}
try {
  return defaultParams;
} catch (e) {
  return null;
}
  `;

  try {
    return runInContext(editedText, {});
  } catch (e) {
    return {};
  }
};

const extractDefaultNameFromCode = async (code: string): Promise<string | null> => {
  if (code.match(/^\s*export\s+/m)) {
    const module = await buildModuleEvaluator(code);
    return module.defaultName || null;
  }

  const editedText = `
${code}
try {
  return defaultName;
} catch (e) {
  return null;
}
  `;

  try {
    return runInContext(editedText, {});
  } catch (e) {
    return null;
  }
};

(self as any).replicad = replicad

const ReplicadWorker = {
  createBlob,
  createMesh,
  runAsFunction,
  runAsModule,
  runCode,
  extractDefaultParamsFromCode,
  extractDefaultNameFromCode,
}
expose(ReplicadWorker, self as Endpoint);

export type {
  ReplicadWorker as ReplicadWorkerType
}
