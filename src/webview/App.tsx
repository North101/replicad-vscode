import { useEffect, useState } from 'react'

import { wrap } from 'comlink'
import FileSaver from 'file-saver'

import ReplicadMesh from './ReplicadMesh'
import ThreeContext from './ThreeContext'

import { Shape } from 'replicad'
import ReplicadWorker from './worker.js?worker&inline'
import { MessageTypes } from '../types'

const worker = wrap(new ReplicadWorker()) as unknown as {
  createBlob: (code: string, params: object) => Promise<Blob>,
  createMesh: (code: string, params: object) => Promise<{}>,
  runCode: (code: string, params: object) => Promise<Shape<any>>,
  runAsFunction: (code: string, params: object) => Promise<Shape<any>>,
  runAsModule: (code: string, params: object) => Promise<Shape<any>>,
  extractDefaultParamsFromCode: (code: string) => Promise<object | null>,
  extractDefaultNameFromCode: (code: string) => Promise<string | null>,
}

export default function ReplicadApp() {
  const [code, setCode] = useState<string | null>(null)
  const [params, setParams] = useState<object | null>(null)
  const [mesh, setMesh] = useState<any | null>(null)

  const downloadModel = async () => {
    if (!(code && params)) return

    const name = await worker.extractDefaultNameFromCode(code)
    const blob = await worker.createBlob(code, params)
    FileSaver.saveAs(blob, `${name ?? 'shape'}.stl`)
  }

  useEffect(() => {
    window.addEventListener('message', (e: MessageEvent) => {
      const msg: MessageTypes = e.data
      switch (msg.type) {
        case 'code': {
          setCode(msg.value)
          return
        }
      }
    })
  }, [])

  useEffect(() => {
    setParams(null)
    if (code) {
      worker.extractDefaultParamsFromCode(code).then((params) => setParams(params))
    }
  }, [code])

  useEffect(() => {
    setMesh(null)
    if (code && params) {
      worker.createMesh(code, params).then(m => setMesh(m))
    }
  }, [code, params])

  return (
    mesh ? (
      <ThreeContext>
        <ReplicadMesh edges={mesh.edges} faces={mesh.faces} />
      </ThreeContext>
    ) : (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2em',
          width: '100vw',
          height: '100vh',
          background: 'var(--vscode-editor-background)',
          color: 'var(--vscode-editor-foreground)'
        }}
      >
        Loading...
      </div>
    )
  )
}
