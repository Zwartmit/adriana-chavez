import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

function AcModel() {
  const { scene } = useGLTF("/ac.glb");
  const modelRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.003;
    }
  });

  useEffect(() => {
    // Recorremos el modelo para cambiar sus materiales directamente desde el código
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          // Un dorado mucho más claro y brillante
          mat.color.set("#FFE885"); 
          mat.roughness = 0.15; // Menos rugoso = más brillante (refleja más)
          mat.metalness = 1.0;  // 100% metálico
          // Un toque de emisividad para que brille con luz propia
          mat.emissive.set("#4A3B00");
        }
      }
    });
  }, [scene]);

  return (
    <group ref={modelRef} position={[0, -2.0, 0]}>
      <primitive object={scene} scale={3.5} />
    </group>
  );
}

export function HeroModel3D() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", cursor: "grab" }} title="Arrastra para rotar">
      <Canvas
        camera={{ position: [0, 1, 5], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          <ambientLight intensity={1.2} />
          <directionalLight position={[10, 10, 5]} intensity={2} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          <AcModel />
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

useGLTF.preload("/ac.glb");
