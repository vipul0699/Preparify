import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Float, Line, Sphere, PerspectiveCamera, Billboard } from '@react-three/drei';
import * as THREE from 'three';

// --- Graph Data Generation ---
const generateGraphData = () => {
  const nodeCount = 70; // Increased density from 40 to 70
  const nodes = [];
  const edgeCount = Math.floor(nodeCount * 1.8); // Create more connections
  const edges = [];
  
  // Create random nodes in a spherical volume
  for (let i = 0; i < nodeCount; i++) {
    // Math.random() - 0.5 gives range [-0.5, 0.5], * 20 gives [-10, 10]
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    // Increased radius to spread out and cover 80% of screen
    const radius = 10 + Math.random() * 8; // Distance from center
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    nodes.push(new THREE.Vector3(x, y, z));
  }
  
  // Create edges by connecting nearby nodes
  for (let i = 0; i < edgeCount; i++) {
    const sourceIdx = Math.floor(Math.random() * nodeCount);
    let bestTargetIdx = 0;
    let minDistance = Infinity;
    
    // Find a relatively close node to connect to
    for (let j = 0; j < nodeCount; j++) {
      if (i === j) continue;
      const d = nodes[sourceIdx].distanceTo(nodes[j]);
      if (d < minDistance && d > 2 && Math.random() > 0.3) {
        minDistance = d;
        bestTargetIdx = j;
      }
    }
    
    edges.push([nodes[sourceIdx], nodes[bestTargetIdx]]);
  }

  return { nodes, edges };
};

const labels = [
  "Calculus", "Quantum Physics", "Machine Learning", 
  "Organic Chemistry", "GRE", "GMAT", "SAT", "JEE",
  "Data Structures", "Anatomy", "Macroeconomics", "Astronomy",
  "Finance", "Civil Engineering", "Mechanics", "CFA",
  "CPA", "FE Exam", "PE Exam", "Thermodynamics"
];

// --- Sub-components ---

// Individual Node with optional Text
const GraphNode = ({ position, label, isHighlight }) => {
  return (
    <group position={position}>
      <Sphere args={[isHighlight ? 0.25 : 0.15, 16, 16]}>
        <meshBasicMaterial color={isHighlight ? "#3b82f6" : "#cbd5e1"} />
      </Sphere>
      
      {/* Floating billboard text labels attached to specific nodes */}
      {label && (
        <Float speed={2} rotationIntensity={0} floatIntensity={1} floatingRange={[-0.2, 0.2]}>
          <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
            <Text
              position={[0, 0.6, 0]}
              color="#1e293b"
              fontSize={0.4}
              maxWidth={4}
              lineHeight={1}
              letterSpacing={0.02}
              textAlign={'center'}
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.04}
              outlineColor="#ffffff"
            >
              {label}
            </Text>
          </Billboard>
        </Float>
      )}
    </group>
  );
};

// The rotating graph structure
const NetworkGraph = ({ scrollRotationSpeed, customLabels }) => {
  const groupRef = useRef();
  const { nodes, edges } = useMemo(() => generateGraphData(), []);
  
  const currentLabels = useMemo(() => {
    return (customLabels && customLabels.length > 0) ? customLabels : labels;
  }, [customLabels]);
  
  // Assign labels to outer nodes
  let labelIdx = 0;
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Base rotation + Scroll induced acceleration
      groupRef.current.rotation.y += delta * 0.05 + scrollRotationSpeed.current * delta;
      groupRef.current.rotation.x += delta * 0.02 + scrollRotationSpeed.current * 0.5 * delta;
      
      // Decay the scroll speed
      scrollRotationSpeed.current = THREE.MathUtils.lerp(scrollRotationSpeed.current, 0, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Render Edges */}
      {edges.map((edge, idx) => (
        <Line 
          key={`edge-${idx}`} 
          points={edge} 
          color="#e2e8f0" 
          lineWidth={1} 
          transparent
          opacity={0.6}
        />
      ))}
      
      {/* Render Nodes */}
      {nodes.map((pos, idx) => {
        // Decide if this node gets a label
        let label = null;
        let isHighlight = false;
        if (idx % 3 === 0 && labelIdx < currentLabels.length && pos.distanceTo(new THREE.Vector3(0,0,0)) > 9) {
           label = currentLabels[labelIdx];
           isHighlight = true;
           labelIdx++;
        }
        
        return (
          <GraphNode 
            key={`node-${idx}`} 
            position={pos} 
            label={label}
            isHighlight={isHighlight}
          />
        );
      })}
    </group>
  );
};

// Scene Controller (handles mouse parallax and scroll tracking)
const SceneController = ({ customLabels }) => {
  const { camera, pointer } = useThree();
  const scrollRotationSpeed = useRef(0);
  const lastScrollY = useRef(window.scrollY);

  // Handle scroll events to increase rotation speed
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY.current;
      
      // Add speed proportional to scroll delta
      scrollRotationSpeed.current += Math.abs(scrollDiff) * 0.0005;
      
      // Cap the speed
      if (scrollRotationSpeed.current > 2.0) scrollRotationSpeed.current = 2.0;

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parallax effect based on mouse movement
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    // target represents the offset looking position based on mouse pointer [-1, 1]
    const targetX = (pointer.x * Math.PI) * 0.1 * 10;
    const targetY = (pointer.y * Math.PI) * 0.1 * 10;
    
    targetPos.set(targetX, targetY, 25);
    camera.position.lerp(targetPos, 0.02);
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {/* Zoom camera back slightly to capture the expanded 80% screen radius */}
      <PerspectiveCamera makeDefault position={[0, 0, 32]} fov={50} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
      <NetworkGraph scrollRotationSpeed={scrollRotationSpeed} customLabels={customLabels} />
    </>
  );
};

// Main Export Component
export default function AnimatedBackground({ customLabels }) {
  return (
    <div className="fixed inset-0 z-[-10] w-full h-full pointer-events-none bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
      <Canvas dpr={[1, 2]}>
        <color attach="background" args={['#f8fafc']} />
        <fog attach="fog" args={['#f8fafc', 20, 40]} />
        <SceneController customLabels={customLabels} />
      </Canvas>
    </div>
  );
}
