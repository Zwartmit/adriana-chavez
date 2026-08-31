import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

function AcModel({ scale, positionY }: { scale: number; positionY: number }) {
  const { scene } = useGLTF("/ac-v2.glb");
  const modelRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={modelRef} position={[0, positionY, 0]}>
      <primitive object={scene} scale={scale} />
    </group>
  );
}

export function HeroModel3D({ scale = 3.5, positionY = -2.0 }: { scale?: number; positionY?: number }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", cursor: "grab" }} title="Arrastra para rotar">
      <Canvas
        camera={{ position: [0, 1, 5], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          <ambientLight intensity={2} />
          {/* Luz principal directa de frente para sacarle el brillo */}
          <directionalLight position={[0, 5, 10]} intensity={4} />
          {/* Luz lateral cálida */}
          <directionalLight position={[10, 10, 5]} intensity={2} color="#ffeedd" />
          {/* Luz de relleno desde abajo/atrás */}
          <directionalLight position={[-10, -10, -5]} intensity={2} />
          <AcModel scale={scale} positionY={positionY} />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate={false}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/ac-v2.glb");
