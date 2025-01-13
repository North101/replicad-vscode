import { expose } from 'comlink'
import * as replicad from 'replicad'
import opencascade from 'replicad-opencascadejs/src/replicad_single.js?inline'
import opencascadeWasm from 'replicad-opencascadejs/src/replicad_single.wasm?url'
import { InputShape, Mesh } from './types'
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
  inputShapes: unknown | unknown[] | InputShape[] | InputShape,
): InputShape[] {
  if (!inputShapes) return []

  // We accept a single shape or an array of shapes
  const shapes = Array.isArray(inputShapes)
    ? inputShapes
    : [inputShapes]

  return shapes
    .map((inputShape, index) =>
      // We accept shapes without additional configuration
      inputShape.shape
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

async function createBlob(code: string, params: object): Promise<Blob[]> {
  const shapes = await runCode(code, params)
  return createBasicShapeConfig(shapes)
    .map(shape => shape.shape.blobSTL())
}

async function createMesh(code: string, params: object): Promise<Mesh[]> {
  const shapes = await runCode(code, params)
  return createBasicShapeConfig(shapes)
    .map(({shape, ...rest}) => ({
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

async function runAsFunction(code: string, params: object) {
  await started;

  return runInContextAsOC(code, {
    oc: replicad.getOC(),
    replicad,
    __inputParams: params,
  });
}

async function runAsModule(code: string, params: object) {
  const module = await buildModuleEvaluator(code);

  if (module.default) return module.default(params || module.defaultParams);
  return module.main(replicad, params || module.defaultParams || {});
}

const runCode = async (code: string, params: object) => {
  if (code.match(/^\s*export\s+/m)) {
    return runAsModule(code, params);
  }
  return runAsFunction(code, params);
};

const extractDefaultParamsFromCode = async (code: string) => {
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

const extractDefaultNameFromCode = async (code: string) => {
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
    return {};
  }
};

(self as any).replicad = replicad

const service = {
  createBlob,
  createMesh,
  runAsFunction,
  runAsModule,
  runCode,
  extractDefaultParamsFromCode,
  extractDefaultNameFromCode,
}
expose(service, self as any);
export default service
