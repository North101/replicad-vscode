import { GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei'
import React, { useRef } from 'react'
import Stage from './Stage'

const Controls = React.memo(
  React.forwardRef(function Controls(
    { hideGizmo, enableDamping }: any,
    controlsRef
  ) {
    return (
      <>
        <OrbitControls
          makeDefault
          ref={controlsRef as any}
          enableDamping={enableDamping}
        />
        {!hideGizmo && (
          <GizmoHelper alignment='bottom-right' margin={[80, 80]}>
            <GizmoViewport font='18px Inter var, HKGrotesk, sans-serif' />
          </GizmoHelper>
        )}
      </>
    )
  })
)

export default React.memo(function Scene({
  hideGizmo,
  center,
  enableDamping = true,
  children,
}: any) {
  const controlsRef = useRef(undefined)

  return (
    <>
      <Controls
        hideGizmo={hideGizmo}
        ref={controlsRef}
        enableDamping={enableDamping}
      />
      <Stage constrols={controlsRef} center={center}>
        {children}
      </Stage>
    </>
  )
})
