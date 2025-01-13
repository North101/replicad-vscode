import { useThree } from '@react-three/fiber';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import {
  syncFaces,
  syncLines,
  syncLinesFromFaces,
} from 'replicad-threejs-helper';
import { BufferGeometry } from 'three';
import { Mesh } from '../types';

export default React.memo(function ShapeMeshes(mesh: Mesh<any>) {
  const {
    faces,
    edges,
    color,
    opacity,
  } = mesh
  const { invalidate } = useThree();

  const body = useRef(new BufferGeometry());
  const lines = useRef(new BufferGeometry());

  useLayoutEffect(() => {
    // We use the three helpers to synchronise the buffer geometry with the
    // new data from the parameters
    if (faces) syncFaces(body.current, faces);

    if (edges) syncLines(lines.current, edges);
    else if (faces) syncLinesFromFaces(lines.current, body.current);

    // We have configured the canvas to only refresh when there is a change,
    // the invalidate function is here to tell it to recompute
    invalidate();
  }, [faces, edges, invalidate]);

  useEffect(
    () => () => {
      body.current.dispose();
      lines.current.dispose();
      invalidate();
    },
    [invalidate]
  );

  return (
    <group>
      <mesh geometry={body.current} >
        {/* the offsets are here to avoid z fighting between the mesh and the lines */}
        <meshStandardMaterial
          color={color}
          opacity={opacity}
          polygonOffset
          polygonOffsetFactor={2.0}
          polygonOffsetUnits={1.0}
        />
      </mesh>
      <lineSegments geometry={lines.current}>
        <lineBasicMaterial color='#3c5a6e' />
      </lineSegments>
    </group>
  );
});
