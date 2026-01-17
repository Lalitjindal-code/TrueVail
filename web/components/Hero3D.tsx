"use client";

import { useRef, useMemo, Suspense, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Icosahedron, Torus } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";

const BG_COLOR = "#0A1320";

// --- MEMORY OPTIMIZATION ---
const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const sphereGeometry = new THREE.SphereGeometry(1, 8, 8);
const redMaterial = new THREE.MeshBasicMaterial({ color: "#FF3366", toneMapped: false });
const cyanMaterial = new THREE.MeshBasicMaterial({ color: "#00F0FF", toneMapped: false });

// --- MOBILE SCALING ---
const ResponsiveGroup = ({ children }: { children: React.ReactNode }) => {
  const { width } = useThree((state) => state.viewport);
  const isMobile = width < 5;
  return (
    <group scale={isMobile ? 0.55 : 1} position={isMobile ? [0, 0, 0] : [0, 0, 0]}>
      {children}
    </group>
  );
};

// --- SYSTEM 1: CHAOS (Particles) ---
const ChaosStream = ({ count = 80 }) => { 
    const mesh = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            t: Math.random() * 100,
            speed: 0.03 + Math.random() * 0.03,
            yOffset: (Math.random() - 0.5) * 8,
            zOffset: (Math.random() - 0.5) * 8,
            randomScale: 0.4 + Math.random() * 0.6,
            rotationSpeed: (Math.random() - 0.5) * 2,
        }));
    }, [count]);

    useFrame(() => {
        if (!mesh.current) return;
        let i = 0;
        for (const particle of particles) {
            particle.t += particle.speed;
            const range = 22.5; const startX = -25;
            let x = (particle.t % range) + startX;
            if(x > -2) { particle.t -= range; x = startX; }
            const distToCenter = Math.abs(x);
            const pinch = distToCenter < 12 ? Math.max(0.1, (distToCenter - 2) / 10) : 1;
            const y = (Math.sin(particle.t * 0.2) + particle.yOffset) * pinch;
            const z = (Math.cos(particle.t * 0.3) + particle.zOffset) * pinch;

            dummy.rotation.set(particle.t * particle.rotationSpeed, particle.t, particle.t);
            dummy.scale.setScalar(particle.randomScale * pinch);
            dummy.position.set(x, y, z);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i++, dummy.matrix);
        }
        mesh.current.instanceMatrix.needsUpdate = true;
    });
    return <instancedMesh ref={mesh} args={[boxGeometry, redMaterial, count]} frustumCulled={false} />;
};

// --- SYSTEM 2: ORDER (Particles) ---
const OrderStream = ({ count = 60 }) => { 
    const mesh = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            t: Math.random() * 100,
            speed: 0.03 + Math.random() * 0.03,
            yOffset: (Math.random() - 0.5) * 5,
            zOffset: (Math.random() - 0.5) * 5,
        }));
    }, [count]);

    useFrame(() => {
        if (!mesh.current) return;
        let i = 0;
        for (const particle of particles) {
            particle.t += particle.speed;
            const range = 22.5; const startX = 2.5;
            let x = (particle.t % range) + startX;
            if(x < 2.5) { particle.t += range; x = startX + range; }
            const spread = 1 + (x - 2.5) * 0.05;
            const y = (Math.sin(particle.t * 0.1) + particle.yOffset) * 0.3 * spread;
            const z = (Math.cos(particle.t * 0.1) + particle.zOffset) * 0.3 * spread;
            dummy.rotation.set(0, 0, 0);
            dummy.scale.setScalar(0.2);
            dummy.position.set(x, y, z);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i++, dummy.matrix);
        }
        mesh.current.instanceMatrix.needsUpdate = true;
    });
    return <instancedMesh ref={mesh} args={[sphereGeometry, cyanMaterial, count]} frustumCulled={false} />;
};

// --- STATIC CRYSTAL (No Rotation Logic) ---
const CrystalFilter = () => {
    // REMOVED: useFrame hook completely. No calculations per frame.
    // Added static rotation so it looks nice at an angle.
    return (
        <group rotation={[0.2, 0.5, 0]}> 
            {/* Core */}
            <Icosahedron args={[1.2, 0]}>
                <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.9} emissive="#001133" emissiveIntensity={4.0} />
            </Icosahedron>

            {/* Wireframe */}
            <Icosahedron args={[2.05, 1]}>
                <meshBasicMaterial color="#00F0FF" wireframe transparent opacity={0.3} />
            </Icosahedron>

            {/* Glass */}
            <Icosahedron args={[2, 0]}>
                <meshStandardMaterial
                    transparent
                    opacity={0.15}
                    roughness={0}
                    metalness={0.9}
                    color="#ffffff"
                    side={THREE.DoubleSide}
                />
            </Icosahedron>

            {/* Rings */}
            <group rotation={[0, Math.PI / 2, 0]} position={[-2.8, 0, 0]}>
                <Torus args={[1.5, 0.1, 16, 32]}>
                    <meshBasicMaterial color="#FF3366" toneMapped={false} />
                </Torus>
            </group>

            <group rotation={[0, Math.PI / 2, 0]} position={[2.8, 0, 0]}>
                <Torus args={[1.5, 0.05, 16, 32]}>
                    <meshBasicMaterial color="#00F0FF" toneMapped={false} />
                </Torus>
            </group>
        </group>
    );
};

const Scene = () => {
    return (
        <>
            <Environment preset="city" />
            <ambientLight intensity={0.2} />
            <pointLight position={[-10, 2, 5]} intensity={30} color="#FF3366" distance={30} />
            <pointLight position={[10, 2, 5]} intensity={5} color="#00F0FF" distance={20} />

            <ResponsiveGroup>
                <CrystalFilter />
                <ChaosStream count={80} />
                <OrderStream count={60} />
            </ResponsiveGroup>

            <fog attach="fog" args={[BG_COLOR, 8, 30]} />

            <EffectComposer enableNormalPass={false} multisampling={0}>
                <Bloom 
                    luminanceThreshold={0.2} 
                    intensity={1.5} 
                    mipmapBlur 
                    radius={0.6}
                    resolutionScale={0.5} 
                />
                <ToneMapping />
            </EffectComposer>
        </>
    );
};

export default function Hero3D() {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    if (!isMounted) return <div className="w-full h-full min-h-[600px] bg-[#0A1320]" />;

    return (
        <div
            className="w-full h-full min-h-[600px] relative z-0"
            style={{ 
                backgroundColor: BG_COLOR,
                backgroundImage: 'url("/hero-bg.jpg")', // Ensure this image exists in public folder
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <Canvas
                camera={{ position: [0, 0, 14], fov: 35 }}
                dpr={[1, 1]} 
                gl={{ 
                    antialias: false,
                    powerPreference: "high-performance",
                    stencil: false,
                    depth: true,
                    alpha: true 
                }}
                onCreated={(state) => { state.gl.toneMappingExposure = 1.2; }}
            >
                <color attach="background" args={[BG_COLOR]} />
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>
        </div>
    );
}
