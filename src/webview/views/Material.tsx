import { useTexture } from '@react-three/drei'

export default function Material(props: any) {
  const [matcap1] = useTexture(['/textures/matcap-1.png'])
  return <meshMatcapMaterial color='#5a8296' matcap={matcap1} {...props} />
}
