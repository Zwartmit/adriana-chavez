import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from "@react-three/drei";
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

/** Spinner dorado puro CSS — sin Three.js */
function LoadingSpinner() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "2.5px solid rgba(232,201,122,0.2)",
        borderTopColor: "var(--color-primary)",
        animation: "spin 0.8s linear infinite",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function HeroModel3D({ scale = 3.5, positionY = -2.0 }: { scale?: number; positionY?: number }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", cursor: "grab" }} title="Arrastra para rotar">
      <Canvas
        camera={{ position: [0, 1, 5], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: "high-performance" }}
        dpr={isMobile ? 1 : [1, 1.5]}
        /**
         * Renderizado continuo para que gire automáticamente en todas las pantallas.
         */
        frameloop="always"
      >
        <Suspense 
          fallback={
            <Html center>
              <LoadingSpinner />
            </Html>
          }
        >
          <Environment preset="city" />
          <ambientLight intensity={isMobile ? 3 : 2} />
          {/* Única luz direccional — el entorno hace el trabajo pesado */}
          <directionalLight position={[0, 5, 10]} intensity={4} />

          <AcModel scale={scale} positionY={positionY} />

          {/* Sombra "cocinada" estática: se calcula una sola vez */}
          {!isMobile && (
            <ContactShadows
              position={[0, positionY - 0.5, 0]}
              opacity={0.4}
              scale={10}
              blur={2}
              resolution={256}
              frames={1}
            />
          )}

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/ac-v2.glb");
