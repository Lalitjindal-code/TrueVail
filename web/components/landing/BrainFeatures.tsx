"use client"

import { useMemo, useRef, useLayoutEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { motion } from "framer-motion"
import { Zap, Lock, Sparkles } from "lucide-react"
// REMOVED: EffectComposer & Bloom (Yehi Lag ka main reason tha)

// --- OPTIMIZATION: Shared Resources ---
const sphereGeometry = new THREE.SphereGeometry(0.04, 8, 8) // Reduced segments 12->8
const mainMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false })
const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()

// Helper to create a soft glow texture
const getGlowTexture = () => {
    if (typeof document === 'undefined') return null; // SSR Check
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

const glowTexture = getGlowTexture();


function NeuralNetwork() {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const pointsRef = useRef<THREE.Points>(null)
    const groupRef = useRef<THREE.Group>(null)

    const count = 40
    const radius = 2.5

    const { particles, linesGeometry, colors } = useMemo(() => {
        const particlePositions = new Float32Array(count * 3)
        const vectors: THREE.Vector3[] = []
        const colorArray = new Float32Array(count * 3)
        const c1 = new THREE.Color("#00F0FF")
        const c2 = new THREE.Color("#FF3366")

        for (let i = 0; i < count; i++) {
            const vec = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize().multiplyScalar(radius)

            vec.toArray(particlePositions, i * 3)
            vectors.push(vec)

            // Colors for Points
            if (i % 2 === 0) {
                c1.toArray(colorArray, i * 3)
            } else {
                c2.toArray(colorArray, i * 3)
            }
        }

        const linePos: number[] = []
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const dist = vectors[i].distanceTo(vectors[j])
                if (dist < 1.5) {
                    linePos.push(vectors[i].x, vectors[i].y, vectors[i].z)
                    linePos.push(vectors[j].x, vectors[j].y, vectors[j].z)
                }
            }
        }

        const linesGeo = new THREE.BufferGeometry()
        linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3))

        return {
            particles: vectors,
            linesGeometry: linesGeo,
            colors: colorArray
        }
    }, [])

    useLayoutEffect(() => {
        if (!meshRef.current) return
        particles.forEach((vec, i) => {
            tempObject.position.copy(vec)
            tempObject.updateMatrix()
            meshRef.current!.setMatrixAt(i, tempObject.matrix)
            if (i % 2 === 0) tempColor.set("#00F0FF")
            else tempColor.set("#FF3366")
            meshRef.current!.setColorAt(i, tempColor)
        })
        meshRef.current.instanceMatrix.needsUpdate = true
        meshRef.current.instanceColor!.needsUpdate = true

        // Points (Glow) Geometry Update
        if (pointsRef.current) {
            const geo = pointsRef.current.geometry
            geo.setAttribute('position', new THREE.Float32BufferAttribute(particles.flatMap(v => [v.x, v.y, v.z]), 3))
            geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
        }

    }, [particles, colors])

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.05
            groupRef.current.rotation.x += delta * 0.02
        }
    })

    return (
        <group ref={groupRef}>
            <instancedMesh ref={meshRef} args={[sphereGeometry, mainMaterial, count]} />

            {/* Glow Layer using Points */}
            <points ref={pointsRef}>
                <bufferGeometry />
                <pointsMaterial
                    map={glowTexture || undefined}
                    alphaMap={glowTexture || undefined}
                    transparent={true}
                    vertexColors={true}
                    size={0.6} // Size of the glow
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    opacity={0.8}
                />
            </points>

            <lineSegments geometry={linesGeometry}>
                <lineBasicMaterial color="#ffffff" transparent opacity={0.1} />
            </lineSegments>
        </group>
    )
}

export default function BrainFeatures() {
    return (
        <section className="relative w-full py-12 md:py-24 overflow-hidden bg-[#0A1320]" style={{ backgroundColor: '#0A1320' }}>
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

                    {/* Left Column: 3D Visual */}
                    {/* OPTIMIZATION: Removed backdrop-blur here too */}
                    <div className="relative h-[400px] md:h-[500px] w-full rounded-2xl border border-white/10 bg-[#0F1724] overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.3)] border-[#00F0FF]/20">
                        <div className="absolute top-4 right-4 z-10 bg-black/50 border border-white/10 px-3 py-1 rounded text-[10px] font-mono text-[#00F0FF] tracking-wider">
                            ENGINE: GEMINI-3.0 FLASH // STATUS: ONLINE
                        </div>

                        <Canvas
                            camera={{ position: [0, 0, 6], fov: 45 }}
                            dpr={[1, 1]} // Strict 1x resolution
                            gl={{ antialias: true, alpha: false }} // Alpha false helps performance
                        >
                            {/* Solid Background for performance */}
                            <color attach="background" args={['#0F1724']} />
                            <ambientLight intensity={0.5} />
                            <NeuralNetwork />
                        </Canvas>

                        {/* FAKE VIGNETTE using CSS instead of PostProcessing */}
                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#0F1724_100%)]"></div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-5xl font-bold text-white leading-tight">
                                Advanced Intelligence, <span className="text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">Simplified.</span>
                            </h2>
                            <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                                Leveraging Google's Gemini 3.0 Flash to detect deception with human-level reasoning.
                            </p>
                        </motion.div>

                        <div className="space-y-6">
                            <FeatureItem icon={Zap} title="Real-Time Analysis" desc="Instant verification via high-speed API." delay={0.2} />
                            <FeatureItem icon={Lock} title="Privacy First" desc="Ephemeral processing. No data storage." delay={0.3} />
                            <FeatureItem icon={Sparkles} title="Next-Gen LLM Engine" desc="Context-aware reasoning powered by Gemini 3.0 Flash." delay={0.4} />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

function FeatureItem({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) {
    return (
        <motion.div
            className="flex items-start gap-4 p-4 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-colors group"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay }}
            viewport={{ once: true }}
        >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-[#00F0FF] transition-colors">{title}</h3>
                <p className="text-slate-400">{desc}</p>
            </div>
        </motion.div>
    )
}