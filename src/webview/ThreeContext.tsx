import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
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
export default function ThreeContext({ children, ...props }: any) {
  const dpr = Math.min(window.devicePixelRatio, 2)

  return (
    <Suspense fallback={null}>
      <Canvas
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: 'var(--vscode-editor-background)',
        }}
        dpr={dpr}
        frameloop='demand'
        camera={{
          position: [-20, 50, 20]
        }}
        {...props}
      >
        <OrbitControls />
        <ambientLight intensity={4} />
        <pointLight position={[100, 100, 100]} />
        {children}
      </Canvas>
    </Suspense>
  )
}
