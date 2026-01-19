"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float, Stars, OrbitControls, Html, QuadraticBezierLine } from "@react-three/drei";

function Globe() {
    const meshRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState<number | null>(null);

    // Generate random "threat" points on the sphere surface
    const threatPoints = useMemo(() => {
        const points = [];
        const threatTypes = ["DDOS", "MALWARE", "PHISHING", "INTRUSION", "BOTNET"];
        for (let i = 0; i < 15; i++) {
            // Distribute points somewhat evenly but randomly
            const phi = Math.acos(-1 + (2 * i) / 15);
            const theta = Math.sqrt(15 * Math.PI) * phi;

            // Convert spherical to cartesian
            const r = 1.5;
            const x = r * Math.cos(theta) * Math.sin(phi);
            const y = r * Math.sin(theta) * Math.sin(phi);
            const z = r * Math.cos(phi);

            points.push({
                pos: new THREE.Vector3(x, y, z),
                color: i % 4 === 0 ? "#FF3366" : (i % 2 === 0 ? "#FFD700" : "#00F0FF"), // Red, Gold, Cyan
                size: Math.random() * 0.5 + 0.5,
                type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
                index: i
            });
        }
        return points;
    }, []);

    // Generate random "attack arcs" connecting points
    const attackArcs = useMemo(() => {
        const arcs = [];
        // Create 5 random connections
        for (let i = 0; i < 5; i++) {
            const startIdx = Math.floor(Math.random() * threatPoints.length);
            let endIdx = Math.floor(Math.random() * threatPoints.length);
            while (startIdx === endIdx) endIdx = Math.floor(Math.random() * threatPoints.length);

            const start = threatPoints[startIdx].pos;
            const end = threatPoints[endIdx].pos;
            const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.5); // Control point further out

            arcs.push({ start, end, mid, color: threatPoints[startIdx].color });
        }
        return arcs;
    }, [threatPoints]);

    useFrame((state, delta) => {
        if (meshRef.current && hovered === null) {
            // Only rotate if not hovering over a pin (optional, or just keep rotating slowly)
            meshRef.current.rotation.y += delta * 0.05;
        }
    });

    return (
        <group ref={meshRef}>
            {/* 1. Base Dark Sphere (Ocean) */}
            <mesh>
                <sphereGeometry args={[1.5, 64, 64]} />
                <meshPhongMaterial
                    color="#050a14"
                    emissive="#001a33"
                    emissiveIntensity={0.2}
                    shininess={30}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* 2. Wireframe Grid (Lat/Long Lines) */}
            <mesh>
                <sphereGeometry args={[1.505, 32, 32]} />
                <meshBasicMaterial color="#004466" wireframe transparent opacity={0.15} />
            </mesh>

            {/* 3. Atmosphere Glow (Rim Light Effect) */}
            <mesh>
                <sphereGeometry args={[1.65, 64, 64]} />
                <meshBasicMaterial color="#00F0FF" transparent opacity={0.05} side={THREE.BackSide} />
            </mesh>

            {/* 4. Detailed Threat Pins (Cyber Beacons) */}
            {threatPoints.map((point, i) => {
                // Calculate alignment to point OUTWARDS from center
                const up = new THREE.Vector3(0, 1, 0);
                const pos = point.pos.clone();
                const quaternion = new THREE.Quaternion().setFromUnitVectors(up, pos.clone().normalize());

                return (
                    <group
                        key={i}
                        position={pos}
                        quaternion={quaternion}
                        onPointerOver={(e) => { e.stopPropagation(); setHovered(i); document.body.style.cursor = 'pointer'; }}
                        onPointerOut={(e) => { setHovered(null); document.body.style.cursor = 'auto'; }}
                    >

                        {/* Tooltip on Hover */}
                        {hovered === i && (
                            <Html distanceFactor={10} zIndexRange={[100, 0]}>
                                <div className="pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4">
                                    <div className="bg-[#0A121F]/90 border border-[#00F0FF] p-2 rounded shadow-[0_0_15px_rgba(0,240,255,0.3)] backdrop-blur-sm">
                                        <div className="text-[#00F0FF] text-[10px] font-mono leading-none mb-1">THREAT DETECTED</div>
                                        <div className="text-white text-xs font-bold font-mono whitespace-nowrap">{point.type}</div>
                                        <div className="text-[9px] text-gray-400 font-mono mt-1">COORD: {point.pos.x.toFixed(1)}, {point.pos.y.toFixed(1)}</div>
                                    </div>
                                    {/* Connector line */}
                                    <div className="w-[1px] h-4 bg-[#00F0FF] mx-auto opacity-50"></div>
                                </div>
                            </Html>
                        )}

                        {/* A. Vertical Laser Beam (Fading) */}
                        <mesh position={[0, 0.3, 0]}>
                            <cylinderGeometry args={[0.005, 0.02, 0.6]} />
                            <meshBasicMaterial color={point.color} transparent opacity={0.8} />
                        </mesh>

                        {/* B. Floating Marker at Top */}
                        <mesh position={[0, 0.65, 0]}>
                            {/* Use Dodecahedron for more techy look than Octahedron, or just stick to simple shapes */}
                            <octahedronGeometry args={[0.06, 0]} />
                            <meshBasicMaterial color={point.color} wireframe />
                        </mesh>

                        {/* C. Glowing Core at Top */}
                        <mesh position={[0, 0.65, 0]}>
                            <sphereGeometry args={[0.03]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>

                        {/* D. Surface Impact Ring (Pulsing base) */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                            <ringGeometry args={[0.04, 0.12, 32]} />
                            <meshBasicMaterial color={point.color} transparent opacity={0.3} side={THREE.DoubleSide} />
                        </mesh>
                    </group>
                );
            })}

            {/* Connection Arcs */}
            {attackArcs.map((arc, i) => (
                <QuadraticBezierLine
                    key={`arc-${i}`}
                    start={arc.start}
                    end={arc.end}
                    mid={arc.mid}
                    color={arc.color}
                    lineWidth={1}
                    transparent
                    opacity={0.3}
                />
            ))}


            {/* 5. Orbital Rings */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.8, 1.82, 128]} />
                <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.1} />
            </mesh>
            <mesh rotation={[Math.PI / 3, Math.PI / 6, 0]}>
                <ringGeometry args={[2.0, 2.02, 128]} />
                <meshBasicMaterial color="#00F0FF" side={THREE.DoubleSide} transparent opacity={0.1} />
            </mesh>
        </group>
    );
}

export function ThreatGlobe({ className = "" }: { className?: string }) {
    return (
        <div className={`relative w-full h-[300px] md:h-[400px] bg-[#0A121F] rounded-xl overflow-hidden border border-[#00F0FF]/20 shadow-[0_0_30px_rgba(0,240,255,0.1)] ${className}`}>

            {/* UI Overlay */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h3 className="text-[#00F0FF] font-bold text-lg font-mono flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#00F0FF] rounded-full animate-pulse" />
                    GLOBAL THREAT MONITOR
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-1">LIVE FEED // SECURE LINK ESTABLISHED</p>
            </div>

            <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-1 pointer-events-none">
                <div className="flex items-center gap-2 text-xs font-mono text-[#FF3366]">
                    <span className="animate-ping w-1.5 h-1.5 bg-[#FF3366] rounded-full" />
                    CRITICAL: 5 DETECTED
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#00F0FF]">
                    <span className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full" />
                    ACTIVE: 12 MONITORING
                </div>
            </div>

            {/* Canvas */}
            <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
                <color attach="background" args={['#0A121F']} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />

                {/* User Controls */}
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI * 0.75}
                    autoRotate
                    autoRotateSpeed={0.5}
                />

                {/* Float animation makes the whole globe bob gently */}
                <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                    <Globe />
                </Float>

                <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
            </Canvas>
        </div>
    );
}

