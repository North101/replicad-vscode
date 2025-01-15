import { Canvas, CanvasProps } from '@react-three/fiber'
import { Suspense } from 'react'
import * as THREE from 'three'

// We change the default orientation - threejs tends to use Y are the height,
// while replicad uses Z. This is mostly a representation default.
THREE.Object3D.DEFAULT_UP.set(0, 0, 1)

// This is the basics to render a nice looking model user react-three-fiber
//
// The camera is positioned for the model we present (that cannot change size.
// You might need to adjust this with something like the autoadjust from the
// `Stage` component of `drei`
//
// Depending on your needs I would advice not using a light and relying on
// a matcap material instead of the meshStandardMaterial used here.
export default function ThreeContext({ children, ...props }: CanvasProps) {
  const dpr = Math.min(window.devicePixelRatio, 2)

  return (
    <Suspense fallback={null}>
      <Canvas
        style={{
          width: '100%',
          height: '100%',
        }}
        dpr={dpr}
        frameloop='demand'
        {...props}
      >
        <ambientLight intensity={4} />
        <pointLight position={[100, 100, 100]} />
        {children}
      </Canvas>
    </Suspense>
  )
}
