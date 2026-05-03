import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '../../utils/cn';

interface AnimatedSphereProps {
  position: [number, number, number];
  color: string;
  speed: number;
  distort: number;
  scale: number;
}

interface Background3DProps {
  variant?: 'auth' | 'app';
  className?: string;
}

function AnimatedSphere({ position, color, speed, distort, scale }: AnimatedSphereProps) {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    mesh.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
    mesh.current.rotation.y = state.clock.elapsedTime * speed * 0.2;
  });
  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={1.5}>
      <mesh ref={mesh} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          distort={distort}
          speed={2}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  );
}

function OrbitRing({
  radius,
  color,
  speed,
  rotation,
}: {
  radius: number;
  color: string;
  speed: number;
  rotation: [number, number, number];
}) {
  const ring = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    ring.current.rotation.z = rotation[2] + state.clock.elapsedTime * speed;
  });

  return (
    <mesh ref={ring} rotation={rotation} position={[0, 0, -5]}>
      <torusGeometry args={[radius, 0.03, 18, 140]} />
      <meshBasicMaterial color={color} transparent opacity={0.22} />
    </mesh>
  );
}

function Particles({ color }: { color: string }) {
  const count = 260;
  const mesh = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 24;
    }
    return pos;
  }, []);

  useFrame((state) => {
    mesh.current.rotation.y = state.clock.elapsedTime * 0.03;
    mesh.current.rotation.x = state.clock.elapsedTime * 0.015;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color={color} transparent opacity={0.65} sizeAttenuation />
    </points>
  );
}

function ReactiveRig({ variant }: { variant: 'auth' | 'app' }) {
  const group = useRef<THREE.Group>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const palette =
    variant === 'auth'
      ? {
          primary: '#38bdf8',
          secondary: '#22d3ee',
          accent: '#34d399',
          tertiary: '#0f172a',
        }
      : {
          primary: '#2dd4bf',
          secondary: '#60a5fa',
          accent: '#f59e0b',
          tertiary: '#111827',
        };

  useFrame((state) => {
    const pointerX = state.pointer.x * 0.85;
    const pointerY = state.pointer.y * 0.55;

    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointerX * 0.18, 0.04);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, pointerY * 0.14, 0.04);
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, pointerX * 0.35, 0.05);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, pointerY * 0.25, 0.05);

    light.current.position.x = THREE.MathUtils.lerp(light.current.position.x, pointerX * 3, 0.05);
    light.current.position.y = THREE.MathUtils.lerp(light.current.position.y, pointerY * 2.5, 0.05);
  });

  return (
    <>
      <pointLight ref={light} position={[0, 0, 2]} intensity={1.2} color={palette.primary} />
      <group ref={group}>
        <AnimatedSphere position={[-3.4, 1.8, -2]} color={palette.primary} speed={0.45} distort={0.42} scale={1.35} />
        <AnimatedSphere position={[3.1, -1.1, -3]} color={palette.accent} speed={0.3} distort={0.34} scale={0.92} />
        <AnimatedSphere position={[0.4, -2.7, -4]} color={palette.secondary} speed={0.4} distort={0.5} scale={0.82} />
        <AnimatedSphere position={[-1.8, -1.4, -5.3]} color={palette.tertiary} speed={0.58} distort={0.3} scale={0.58} />
        <OrbitRing radius={2.9} color={palette.secondary} speed={0.18} rotation={[1.15, 0.4, 0]} />
        <OrbitRing radius={4.25} color={palette.accent} speed={-0.12} rotation={[0.9, -0.25, 0]} />
      </group>
      <Particles color={palette.secondary} />
    </>
  );
}

export const Background3D = ({ variant = 'auth', className }: Background3DProps) => {
  return (
    <div className={cn('pointer-events-none fixed inset-0 -z-10', className)}>
      <Canvas camera={{ position: [0, 0, 6], fov: 70 }} dpr={[1, 1.8]}>
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 4, 4]} intensity={0.9} />
        <pointLight position={[-4, -4, 4]} intensity={0.35} color="#e0f2fe" />
        <ReactiveRig variant={variant} />
      </Canvas>
    </div>
  );
};
