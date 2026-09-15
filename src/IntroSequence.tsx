import { Suspense, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface IntroSequenceProps {
    onComplete: () => void;
    mascotSrc: string;
}

const PASTELS = ['#f9c8dd', '#bcdcf7', '#c4ecd9', '#ffe0c2', '#ddd0f7', '#fdf3c0'];

function MascotCore({ mascotSrc }: { mascotSrc: string }) {
    const texture = useTexture(mascotSrc);
    const ringA = useRef<THREE.Mesh>(null);
    const ringB = useRef<THREE.Mesh>(null);
    const ringC = useRef<THREE.Mesh>(null);
    const core = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (ringA.current) {
            ringA.current.rotation.x = t * 0.35;
            ringA.current.rotation.y = t * 0.22;
        }
        if (ringB.current) {
            ringB.current.rotation.y = -t * 0.3;
            ringB.current.rotation.z = t * 0.18;
        }
        if (ringC.current) {
            ringC.current.rotation.z = -t * 0.24;
            ringC.current.rotation.x = Math.sin(t * 0.4) * 0.6;
        }
        if (core.current) {
            const s = 1 + Math.sin(t * 1.6) * 0.04;
            core.current.scale.setScalar(s);
        }
    });

    return (
        <group>
            <mesh ref={core}>
                <circleGeometry args={[1.55, 64]} />
                <meshBasicMaterial map={texture} toneMapped={false} />
            </mesh>
            <mesh ref={ringA} rotation={[0.6, 0, 0]}>
                <torusGeometry args={[2.1, 0.05, 24, 96]} />
                <meshStandardMaterial color="#f9a8d4" emissive="#f9a8d4" emissiveIntensity={0.5} roughness={0.2} />
            </mesh>
            <mesh ref={ringB} rotation={[0, 0.5, 0.4]}>
                <torusGeometry args={[2.5, 0.04, 24, 96]} />
                <meshStandardMaterial color="#a5b8f3" emissive="#a5b8f3" emissiveIntensity={0.5} roughness={0.2} />
            </mesh>
            <mesh ref={ringC} rotation={[0.2, 0, -0.5]}>
                <torusGeometry args={[2.9, 0.03, 24, 96]} />
                <meshStandardMaterial color="#9adfc0" emissive="#9adfc0" emissiveIntensity={0.5} roughness={0.2} />
            </mesh>
        </group>
    );
}

function OrbitBlob({ radius, height, color, scale, speed, offset }: {
    radius: number; height: number; color: string; scale: number; speed: number; offset: number;
}) {
    const ref = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.elapsedTime * speed + offset;
        ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 1.3) * height, Math.sin(t) * radius * 0.6);
        ref.current.rotation.x = t * 0.4;
        ref.current.rotation.y = t * 0.3;
    });

    return (
        <mesh ref={ref} scale={scale}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={color} roughness={0.3} emissive={color} emissiveIntensity={0.15} transparent opacity={0.9} />
        </mesh>
    );
}

function CinematicCamera({ reveal }: { reveal: boolean }) {
    useFrame((state, delta) => {
        const t = Math.min(state.clock.elapsedTime / 7, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        const targetZ = reveal ? 6.2 : 16 - ease * 8;
        const targetY = reveal ? 0.2 : 2.6 - ease * 2.2;
        state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 1.6, delta);
        state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 1.6, delta);
        state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.6;
        state.camera.lookAt(0, 0, 0);
    });
    return null;
}

function IntroScene({ mascotSrc, reveal }: { mascotSrc: string; reveal: boolean }) {
    return (
        <>
            <CinematicCamera reveal={reveal} />
            <ambientLight intensity={1.2} color="#fff2f9" />
            <directionalLight position={[5, 6, 8]} intensity={1.2} color="#ffe0ef" />
            <pointLight position={[-6, -3, 4]} intensity={0.7} color="#cfe3ff" />
            <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.6}>
                <MascotCore mascotSrc={mascotSrc} />
            </Float>
            {PASTELS.map((color, i) => (
                <OrbitBlob
                    key={i}
                    radius={4.5 + (i % 3) * 1.6}
                    height={1.4 + (i % 2) * 0.8}
                    color={color}
                    scale={0.35 + (i % 4) * 0.14}
                    speed={0.22 + (i % 5) * 0.05}
                    offset={i * 1.1}
                />
            ))}
            <Sparkles count={220} scale={[18, 10, 10]} size={4} speed={0.4} opacity={0.7} color="#d8b4fe" />
        </>
    );
}

export default function IntroSequence({ onComplete, mascotSrc }: IntroSequenceProps) {
    const [phase, setPhase] = useState<'cinematic' | 'reveal'>('cinematic');

    useEffect(() => {
        const t = setTimeout(() => setPhase('reveal'), 7000);
        return () => clearTimeout(t);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'linear-gradient(160deg, #fdf1f7 0%, #eef4ff 45%, #f0fbf4 100%)',
                zIndex: 1000,
                overflow: 'hidden',
            }}
        >
            {/* Real-time 3D cinematic — renders at native device resolution (true 4K on 4K displays) */}
            <Canvas
                dpr={[1, 3]}
                camera={{ position: [0, 2.6, 16], fov: 50 }}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            >
                <fog attach="fog" args={['#fdf4fa', 12, 30]} />
                <Suspense fallback={null}>
                    <IntroScene mascotSrc={mascotSrc} reveal={phase === 'reveal'} />
                </Suspense>
            </Canvas>

            {/* Reveal overlay */}
            <AnimatePresence>
                {phase === 'reveal' && (
                    <motion.div
                        key="reveal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingBottom: '9vh',
                            pointerEvents: 'none',
                        }}
                    >
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                fontSize: '3rem',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #b28af0, #ef8ab8, #6fc7ae)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                letterSpacing: '0.12em',
                                textShadow: '0 2px 24px rgba(255,255,255,0.6)',
                            }}
                        >
                            MNEMOSYNC
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            style={{ color: '#7d7591', fontSize: '1rem', letterSpacing: '0.32em', marginTop: '0.4rem', textTransform: 'uppercase', fontWeight: 600 }}
                        >
                            Your Eternal Companion
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.1 }}
                            style={{ color: '#8d86a0', fontStyle: 'italic', marginTop: '1.2rem', maxWidth: '420px', textAlign: 'center', lineHeight: 1.8 }}
                        >
                            "I am the keeper of memories. Let me be your eyes..."
                        </motion.p>
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.5 }}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onComplete}
                            style={{
                                pointerEvents: 'auto',
                                marginTop: '2rem',
                                padding: '1.1rem 3rem',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                color: 'white',
                                background: 'linear-gradient(135deg, #c4b5fd, #f9a8d4)',
                                border: 'none',
                                borderRadius: '999px',
                                cursor: 'pointer',
                                boxShadow: '0 18px 40px -14px rgba(178, 138, 240, 0.65)',
                                letterSpacing: '0.06em',
                            }}
                        >
                            Enter Mnemosync
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skip button — always visible */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                whileHover={{ opacity: 1, scale: 1.05 }}
                onClick={onComplete}
                style={{
                    position: 'absolute',
                    bottom: '2rem',
                    right: '2rem',
                    background: 'rgba(255,255,255,0.65)',
                    border: '1px solid rgba(167,139,250,0.4)',
                    color: '#6d6480',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '2rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    backdropFilter: 'blur(10px)',
                    zIndex: 100,
                }}
            >
                SKIP →
            </motion.button>

            {/* Soft vignette */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at center, transparent 55%, rgba(233, 221, 245, 0.5) 100%)',
                }}
            />
        </motion.div>
    );
}
