import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows } from "@react-three/drei";
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
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          <ambientLight intensity={2} />
          {/* Luz principal simplificada para ahorrar rendimiento en móviles */}
          <directionalLight position={[0, 5, 10]} intensity={4} />
          
          <AcModel scale={scale} positionY={positionY} />
          
          {/* Sombra "cocinada" estática: de altísimo rendimiento */}
          <ContactShadows 
            position={[0, positionY - 0.5, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2} 
            resolution={256} 
            frames={1} 
          />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate={false}
            /* Limitar rotación para no atravesar el modelo */
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/ac-v2.glb");
