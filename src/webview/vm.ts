function buildFunctionWithContext(eval_string: string, context: object) {
  return `
  return function (context) {
    "use strict";
    ${Object.keys(context).length > 0
      ? `let ${Object.keys(context).map(
        (key) => ` ${key} = context['${key}']`
      )};`
      : ``
    }
    ${eval_string};
  }
  `
}

function buildEvaluator(eval_string: string, context: {}) {
  let template = buildFunctionWithContext(eval_string, context)
  let functor = Function(template)
  return functor()
}

export async function buildModuleEvaluator(moduleString: string) {
  const url = URL.createObjectURL(
    new Blob([moduleString], { type: "text/javascript" })
  )
  return await import(/* @vite-ignore */ `${url}`)
}

export function runInContext(text: string, context = {}) {
  let evaluator = buildEvaluator(text, context)
  return evaluator(context)
}
