import { wrap } from 'comlink'
import type { BuilderWorkerType } from './builder.worker.js'
import BuilderWorker from './builder.worker.js?worker&inline'

export default wrap<typeof BuilderWorkerType>(new BuilderWorker())
