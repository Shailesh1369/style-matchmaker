import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

interface OutfitMannequinProps {
  colors: string[];
  gender?: string | null;
  className?: string;
}

function Head({ skinColor }: { skinColor: string }) {
  return (
    <mesh position={[0, 2.05, 0]}>
      <sphereGeometry args={[0.28, 16, 16]} />
      <meshStandardMaterial color={skinColor} />
    </mesh>
  );
}

function Neck({ skinColor }: { skinColor: string }) {
  return (
    <mesh position={[0, 1.72, 0]}>
      <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
      <meshStandardMaterial color={skinColor} />
    </mesh>
  );
}

function Torso({ color }: { color: string }) {
  return (
    <mesh position={[0, 1.25, 0]}>
      <boxGeometry args={[0.7, 0.8, 0.35]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function LeftArm({ skinColor }: { skinColor: string }) {
  return (
    <group position={[-0.5, 1.35, 0]} rotation={[0, 0, 0.15]}>
      <mesh position={[0, -0.2, 0]}>
        <capsuleGeometry args={[0.08, 0.35, 4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <capsuleGeometry args={[0.07, 0.3, 4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
    </group>
  );
}

function RightArm({ skinColor }: { skinColor: string }) {
  return (
    <group position={[0.5, 1.35, 0]} rotation={[0, 0, -0.15]}>
      <mesh position={[0, -0.2, 0]}>
        <capsuleGeometry args={[0.08, 0.35, 4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <capsuleGeometry args={[0.07, 0.3, 4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
    </group>
  );
}

function Legs({ color }: { color: string }) {
  return (
    <>
      <mesh position={[-0.16, 0.45, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.16, 0.45, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </>
  );
}

function Shoes({ color }: { color: string }) {
  return (
    <>
      <mesh position={[-0.16, 0.05, 0.06]}>
        <boxGeometry args={[0.18, 0.12, 0.32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.16, 0.05, 0.06]}>
        <boxGeometry args={[0.18, 0.12, 0.32]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </>
  );
}

function MannequinBody({ colors, gender }: { colors: string[]; gender?: string | null }) {
  const skinColor = "#D4A574";
  const topColor = colors[0] || "#888888";
  const bottomColor = colors[1] || "#333333";
  const shoeColor = colors[2] || "#222222";

  return (
    <group position={[0, -1, 0]}>
      <Head skinColor={skinColor} />
      <Neck skinColor={skinColor} />
      <Torso color={topColor} />
      <LeftArm skinColor={skinColor} />
      <RightArm skinColor={skinColor} />
      <Legs color={bottomColor} />
      <Shoes color={shoeColor} />
    </group>
  );
}

export default function OutfitMannequin({ colors, gender, className = "" }: OutfitMannequinProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas camera={{ position: [0, 0.5, 3.5], fov: 40 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 3]} intensity={0.8} />
        <directionalLight position={[-3, 3, -2]} intensity={0.3} />
        <MannequinBody colors={colors} gender={gender} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate
          autoRotateSpeed={1.5}
        />
      </Canvas>
    </div>
  );
}
