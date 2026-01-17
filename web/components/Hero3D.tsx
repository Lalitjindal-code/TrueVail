"use client";
import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Icosahedron, MeshTransmissionMaterial, Torus } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";

const BG_COLOR = "#0A1320";

// --- SYSTEM 1: CHAOS (Left Side - Red Cubes) ---
const ChaosStream = ({ count = 200 }) => {
    const mesh = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            t: Math.random() * 100,
            speed: 0.05 + Math.random() * 0.05,
            yOffset: (Math.random() - 0.5) * 8,
            zOffset: (Math.random() - 0.5) * 8,
            // UPDATED: Increased random scale base (Bade size ke liye)
            randomScale: 0.4 + Math.random() * 0.6,
            rotationSpeed: (Math.random() - 0.5) * 2,
        }));
    }, [count]);

    useFrame((state) => {
        if (!mesh.current) return;

        tempColor.set("#FF3366");

        particles.forEach((particle, i) => {
            particle.t += particle.speed;

            // Loop Logic: Left to Center
            const range = 22.5;
            const startX = -25;
            let x = (particle.t % range) + startX;

            // Funnel Effect
            const distToCenter = Math.abs(x);
            const pinch = Math.max(0.1, Math.min(1, (distToCenter - 2) / 10));

            const y = (Math.sin(particle.t * 0.2) + particle.yOffset) * pinch;
            const z = (Math.cos(particle.t * 0.3) + particle.zOffset) * pinch;

            // Rotation
            dummy.rotation.set(
                particle.t * particle.rotationSpeed,
                particle.t * particle.rotationSpeed,
                particle.t
            );

            // Scale application
            dummy.scale.setScalar(particle.randomScale * pinch);
            dummy.position.set(x, y, z);
            dummy.updateMatrix();

            mesh.current.setMatrixAt(i, dummy.matrix);
            mesh.current.setColorAt(i, tempColor);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            {/* UPDATED: Increased geometry size from 0.3 to 0.5 */}
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshBasicMaterial toneMapped={false} color="#FF3366" />
        </instancedMesh>
    );
};

// --- SYSTEM 2: ORDER (Right Side - Cyan Spheres) ---
const OrderStream = ({ count = 200 }) => {
    const mesh = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            t: Math.random() * 100,
            speed: 0.05 + Math.random() * 0.05,
            yOffset: (Math.random() - 0.5) * 5,
            zOffset: (Math.random() - 0.5) * 5,
        }));
    }, [count]);

    useFrame((state) => {
        if (!mesh.current) return;

        tempColor.set("#00F0FF");

        particles.forEach((particle, i) => {
            particle.t += particle.speed;

            // Loop Logic: Center to Right
            const range = 22.5;
            const startX = 2.5;
            let x = (particle.t % range) + startX;

            const spread = 1 + (x - 2.5) * 0.05;

            const y = (Math.sin(particle.t * 0.1) + particle.yOffset) * 0.3 * spread;
            const z = (Math.cos(particle.t * 0.1) + particle.zOffset) * 0.3 * spread;

            dummy.rotation.set(0, 0, 0);
            dummy.scale.setScalar(0.2);
            dummy.position.set(x, y, z);
            dummy.updateMatrix();

            mesh.current.setMatrixAt(i, dummy.matrix);
            mesh.current.setColorAt(i, tempColor);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial toneMapped={false} color="#00F0FF" />
        </instancedMesh>
    );
};

// --- THE CRYSTAL FILTER ---
const CrystalFilter = () => {
    return (
        <group>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>

                {/* Inner Core */}
                <Icosahedron args={[1.2, 0]}>
                    <meshStandardMaterial
                        color="#050505"
                        roughness={0.1}
                        metalness={0.9}
                        emissive="#001133"
                        emissiveIntensity={4.0}
                    />
                </Icosahedron>

                {/* Wireframe Cage */}
                <Icosahedron args={[2.05, 1]}>
                    <meshBasicMaterial color="#00F0FF" wireframe transparent opacity={0.3} />
                </Icosahedron>

                {/* Gem Glass */}
                <Icosahedron args={[2, 0]}>
                    <MeshTransmissionMaterial
                        backside={false}
                        samples={6}
                        thickness={2.5}
                        chromaticAberration={1.5}
                        anisotropy={0.5}
                        distortion={0.2}
                        distortionScale={0.3}
                        temporalDistortion={0.1}
                        iridescence={1}
                        iridescenceIOR={1.3}
                        roughness={0.0}
                        clearcoat={1}
                        color="#ffffff"
                        flatShading={true}
                    />
                </Icosahedron>

                {/* Entry Ring */}
                <group rotation={[0, Math.PI / 2, 0]} position={[-2.8, 0, 0]}>
                    <Torus args={[1.5, 0.1, 16, 32]}>
                        <meshBasicMaterial color="#FF3366" toneMapped={false} />
                    </Torus>
                    {/* Extra Glow for Red Opening */}
                    <pointLight distance={5} intensity={5} color="#FF3366" />
                </group>

                {/* Exit Ring */}
                <group rotation={[0, Math.PI / 2, 0]} position={[2.8, 0, 0]}>
                    <Torus args={[1.5, 0.05, 16, 32]}>
                        <meshBasicMaterial color="#00F0FF" toneMapped={false} />
                    </Torus>
                </group>

            </Float>
        </group>
    );
};

// --- SCENE WRAPPER ---
const Scene = () => {
    return (
        <>
            <Environment preset="city" />
            <ambientLight intensity={0.2} />

            <pointLight position={[-10, 2, 5]} intensity={30} color="#FF3366" distance={30} />
            <pointLight position={[10, 2, 5]} intensity={5} color="#00F0FF" distance={20} />

            <CrystalFilter />
            <ChaosStream count={300} />
            <OrderStream count={150} />

            <fog attach="fog" args={[BG_COLOR, 8, 30]} />

            <EffectComposer disableNormalPass>
                <Bloom
                    luminanceThreshold={0.2}
                    intensity={2.5}
                    mipmapBlur
                    radius={0.6}
                />
                <ToneMapping />
            </EffectComposer>
        </>
    );
};

export default function Hero3D() {
    return (
        <div
            className="w-full h-full min-h-[600px] relative z-0"
            style={{ backgroundColor: BG_COLOR }}
        >
            <Canvas
                camera={{ position: [0, 0, 14], fov: 35 }}
                gl={{ antialias: true, alpha: false }}
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