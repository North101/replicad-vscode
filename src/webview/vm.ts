function buildFunctionWithContext(eval_string: string, context: object) {
  return `
  return function ({ ${Object.keys(context).join(', ')} }) {
    "use strict";
    ${eval_string};
  }
  `
}

function buildEvaluator(eval_string: string, context: {}) {
  const template = buildFunctionWithContext(eval_string, context)
  const functor = Function(template)
  return functor()
}

export async function buildModuleEvaluator(moduleString: string) {
  const url = URL.createObjectURL(
    new Blob([moduleString],
      { type: 'text/javascript' }),
  )
  return await import(/* @vite-ignore */ `${url}`)
}

export function runInContext(text: string, context = {}) {
  const evaluator = buildEvaluator(text, context)
  return evaluator(context)
}
