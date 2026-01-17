"use client"

import { useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Line, Sphere } from "@react-three/drei"
import * as THREE from "three"
import { motion } from "framer-motion"
import { Zap, Lock, Sparkles } from "lucide-react"
import { EffectComposer, Bloom } from "@react-three/postprocessing"

// --- 3D Neural Network Component ---
function NeuralNetwork() {
    const groupRef = useRef<THREE.Group>(null)

    // Generate random points on a sphere
    const { points, connections } = useMemo(() => {
        const count = 50
        const radius = 2.5
        const pts: THREE.Vector3[] = []

        // 1. Generate Points
        for (let i = 0; i < count; i++) {
            // Use spherical coordinates for better distribution or just normalize random vectors
            const vec = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize().multiplyScalar(radius)
            pts.push(vec)
        }

        // 2. Generate Connections (Plexus effect)
        const lines: [THREE.Vector3, THREE.Vector3][] = []
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const dist = pts[i].distanceTo(pts[j])
                if (dist < 1.5) {
                    lines.push([pts[i], pts[j]])
                }
            }
        }

        return { points: pts, connections: lines }
    }, [])

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.1
            groupRef.current.rotation.x += delta * 0.05
        }
    })

    return (
        <group ref={groupRef}>
            {/* Nodes */}
            {points.map((pt, i) => (
                <mesh key={i} position={pt}>
                    <sphereGeometry args={[0.04, 16, 16]} />
                    <meshBasicMaterial color={i % 2 === 0 ? "#00F0FF" : "#FF3366"} />
                </mesh>
            ))}

            {/* Connections */}
            {connections.map((line, i) => (
                <Line
                    key={i}
                    points={line}
                    color="#ffffff"
                    transparent
                    opacity={0.15}
                    lineWidth={1}
                />
            ))}
        </group>
    )
}

// --- Main Component ---
export default function BrainFeatures() {
    return (
        <section className="relative w-full py-24 overflow-hidden bg-[#0A1320]" style={{ backgroundColor: '#0A1320' }}> {/* Hardcoded bg to prevent override */}
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: 3D Visual */}
                    <div className="relative h-[400px] lg:h-[500px] w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
                        <div className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur border border-white/10 px-3 py-1 rounded text-[10px] font-mono text-[#00F0FF] tracking-wider">
                            ENGINE: GEMINI-3.0 FLASH // STATUS: ONLINE
                        </div>

                        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                            <ambientLight intensity={0.5} />
                            <NeuralNetwork />
                            <EffectComposer>
                                <Bloom luminanceThreshold={0.2} intensity={1.5} mipmapBlur radius={0.4} />
                            </EffectComposer>
                        </Canvas>

                        {/* Vignette Overlay */}
                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#0A1320_120%)]"></div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                                Advanced Intelligence, <span className="text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">Simplified.</span>
                            </h2>
                            <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                                Leveraging Google's Gemini 3.0 Flash to detect deception with human-level reasoning.
                                We analyze patterns invisible to the naked eye.
                            </p>
                        </motion.div>

                        <div className="space-y-6">
                            <FeatureItem
                                icon={Zap}
                                title="Real-Time Analysis"
                                desc="Instant verification via high-speed API."
                                delay={0.2}
                            />
                            <FeatureItem
                                icon={Lock}
                                title="Privacy First"
                                desc="Ephemeral processing. No data storage."
                                delay={0.3}
                            />
                            <FeatureItem
                                icon={Sparkles}
                                title="Next-Gen LLM Engine"
                                desc="Context-aware reasoning powered by Gemini 3.0 Flash."
                                delay={0.4}
                            />
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
