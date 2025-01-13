import { useEffect, useState } from 'react'

import { wrap } from 'comlink'
import FileSaver from 'file-saver'

import ReplicadMesh from './ReplicadMesh'
import ThreeContext from './ThreeContext'

import { MessageTypes } from '../../types'
import { Mesh, Result } from '../types'
import type { ReplicadWorkerType } from '../worker.js'
import ReplicadWorker from '../worker.js?worker&inline'

const worker = wrap<typeof ReplicadWorkerType>(new ReplicadWorker())

export default function ReplicadApp() {
  const [code, setCode] = useState<string | null>(null)
  const [params, setParams] = useState<{} | null>(null)
  const [mesh, setMesh] = useState<Result<Mesh<any>[]> | null>(null)

  const downloadModel = async () => {
    if (!(code && params)) return

    const name = await worker.extractDefaultNameFromCode(code)
    const blob = await worker.createBlob(code, params)
    FileSaver.saveAs(blob[0], `${name ?? 'shape'}.stl`)
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
    let isSubscribed = true

    const getParams = async () => {
      if (!code) return

      const params = await worker.extractDefaultParamsFromCode(code)
      if (!isSubscribed) return

      setParams(params)
    }

    setParams(null)
    getParams()

    return () => {
      isSubscribed = false
    }
  }, [code])

  useEffect(() => {
    let isSubscribed = true

    const getMesh = async () => {
      try {
        if (!(code && params)) return

        const mesh = await worker.createMesh(code, params)
        if (!isSubscribed) return

        setMesh({
          type: 'success',
          value: mesh,
        })
      } catch (e) {
        if (!isSubscribed) return

        setMesh({
          type: 'error',
          error: e,
        })
      }
    }

    setMesh(null)
    getMesh()

    return () => {
      isSubscribed = false
    }
  }, [code, params])

  return (
    mesh ? (
      mesh.type == 'success' ? (
        <ThreeContext>
          {mesh.value.map((shape, index) => <ReplicadMesh
            key={index}
            {...shape}
          />)}
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
            color: 'var(--vscode-editor-foreground)',
          }}
        >
          Error
        </div>
      )
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
          color: 'var(--vscode-editor-foreground)',
        }}
      >
        {code ? 'Loading...' : 'Invalid Model'}
      </div>
    )
  )
}
