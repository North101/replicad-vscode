import React, { useEffect, useState } from 'react'

import Stack from 'react-bootstrap/esm/Stack'

import { MessageTypes } from '../../types'
import builderAPI from '../builderAPI'
import { ShapeMesh, ShapeMeshResult, Result } from '../types'
import Controls from './Controls'
import DownloadModal from './DownloadModal'
import InfiniteGrid from './InfiniteGrid'
import ReplicadMesh from './ShapeGeometry'
import ResultView from './ResultView'
import ThreeContext from './ThreeContext'
import ToolbarView from './ToolbarView'
import Loading from './Loading'

const ShapesView = React.memo(({
  shapes,
  selected,
}: { shapes: ShapeMesh[], selected: number | null }) => {
  return (
    <group>
      {shapes
        .map((shape, index) => <ReplicadMesh
          key={index}
          visible={(selected ?? index) == index}
          {...shape}
        />)
      }
    </group>
  )
})

export type FileType = {
  fileName: string
  text: string
  changed: boolean
}

type ShapesViewProps = {
  file: FileType | null
  shapes: ShapeMeshResult
  state: 'success' | 'loading' | 'error'
}

const ShapesContainerView = ({
  file,
  shapes,
  state,
}: ShapesViewProps) => {
  const [selected, setSelected] = useState<number | null>(null)
  const [showDialog, setShowDialog] = useState<boolean>(false)

  return (
    <Stack
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        backgroundColor: state == 'error'
          ? 'var(--vscode-inputValidation-errorBackground)'
          : 'var(--vscode-editor-background)',
      }}>
      {showDialog && <DownloadModal
        file={file}
        setShowDialog={setShowDialog}
      />}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}>
        <ThreeContext
          orthographic
          onCreated={(state) => (state.gl.localClippingEnabled = true)}
        >
          <InfiniteGrid />
          <Controls enableDamping={false}>
            <ShapesView shapes={shapes.shapes} selected={selected} />
          </Controls>
        </ThreeContext>
        {state == 'loading' &&
          <div className='navbar' style={{
            position: 'absolute',
            top: 'auto',
            right: 'auto',
            bottom: 'var(--bs-navbar-padding-y)',
            left: 'var(--bs-navbar-padding-x)',
          }}>
            <Loading size={'3em'} />
          </div>
        }
      </div>
      <ToolbarView
        shapes={shapes}
        setSelected={setSelected}
        setShowDialog={setShowDialog}
      />
    </Stack >
  )
}

export default function ReplicadApp() {
  const [file, setFile] = useState<FileType | null>(null)
  const [shapes, setShapes] = useState<Result<ShapeMeshResult> | null>(null)

  useEffect(() => {
    window.addEventListener('message', (e: MessageEvent) => {
      const msg: MessageTypes = e.data
      switch (msg.type) {
        case 'open': {
          setFile(state => {
            if (state?.fileName == msg.fileName && state?.text == msg.text) {
              return state
            }

            return {
              fileName: msg.fileName,
              text: msg.text,
              changed: state?.fileName != msg.fileName,
            }
          })
          return
        }
        case 'close': {
          setFile((state) => {
            return state?.fileName == msg.fileName
              ? null
              : state
          })
          builderAPI.clearCachedShape(msg.fileName)
          return
        }
      }
    })
  }, [])

  useEffect(() => {
    let isSubscribed = true

    const getShapes = async () => {
      try {
        if (!file) return

        await builderAPI.ready()
        const shapes = await builderAPI.buildShapesFromCode(file.fileName, file.text)
        if (!isSubscribed) return

        setShapes({
          type: 'success',
          value: shapes,
        })
      } catch (e) {
        if (!isSubscribed) return

        setShapes((state) => ({
          type: 'error',
          error: e,
          value: state?.value,
        }))
      }
    }

    if (file?.changed ?? true) {
      setShapes(null)
    } else {
      setShapes((state) => ({
        type: 'loading',
        value: state?.value,
      }))
    }
    getShapes()

    return () => {
      isSubscribed = false
    }
  }, [file?.fileName, file?.text, file?.changed])

  if (!shapes?.value) {
    return (
      <ResultView>
        {file
          ? shapes?.type == 'error'
            ? `${shapes.error}`
            : 'Loading...'
          : 'Invalid Model'
        }
      </ResultView>
    )
  }

  return (
    <ShapesContainerView
      file={file}
      shapes={shapes.value}
      state={shapes.type}
    />
  )
}
