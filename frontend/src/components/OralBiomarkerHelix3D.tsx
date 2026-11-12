import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Dna, Info, RotateCw } from 'lucide-react';

interface BiomarkerData {
  name: string;
  fullName: string;
  role: string;
  clinicalSignificance: string;
  color: string;
}

const BIOMARKERS: BiomarkerData[] = [
  {
    name: 'p53',
    fullName: 'Tumor Suppressor Protein p53',
    role: 'Cell Cycle & Apoptosis Regulator',
    clinicalSignificance: 'Overexpression/mutation strongly correlates with malignant transformation of Leukoplakia in reverse smokers.',
    color: '#F59E0B'
  },
  {
    name: 'EGFR',
    fullName: 'Epidermal Growth Factor Receptor',
    role: 'Cell Proliferation & Survival Kinase',
    clinicalSignificance: 'Upregulated in oral mucosal dysplasia and early oral squamous cell carcinoma (OSCC).',
    color: '#10B981'
  },
  {
    name: 'Ki-67',
    fullName: 'Nuclear Antigen Ki-67',
    role: 'Cellular Proliferation Index',
    clinicalSignificance: 'Marks suprabasal epithelial proliferation depth; critical for grading oral epithelial dysplasia.',
    color: '#F59E0B'
  },
  {
    name: 'CD44',
    fullName: 'Cancer Stem Cell Marker CD44',
    role: 'Cell Adhesion & Invasive Metastasis',
    clinicalSignificance: 'High levels indicate aggressive premalignant potential and resistance to conservative therapy.',
    color: '#0D9488'
  },
  {
    name: 'CK-19',
    fullName: 'Cytokeratin 19',
    role: 'Intermediate Filament Cytoskeleton',
    clinicalSignificance: 'Aberrant expression in upper epithelial strata signifies loss of normal mucosal differentiation.',
    color: '#EAB308'
  }
];

export const OralBiomarkerHelix3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedMarker, setSelectedMarker] = useState<BiomarkerData>(BIOMARKERS[0]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 24;
    camera.position.y = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const bluePointLight = new THREE.PointLight(0x2563eb, 3.0, 50);
    bluePointLight.position.set(10, 15, 15);
    scene.add(bluePointLight);

    const cyanPointLight = new THREE.PointLight(0x0284c7, 2.0, 50);
    cyanPointLight.position.set(-10, -10, 12);
    scene.add(cyanPointLight);

    // 3. Helix Group Construction
    const helixGroup = new THREE.Group();
    scene.add(helixGroup);

    const pointsCount = 42;
    const radius = 3.6;
    const heightSpan = 16;
    const turns = 2.4;

    const strand1Geometry = new THREE.BufferGeometry();
    const strand2Geometry = new THREE.BufferGeometry();

    const strand1Points: THREE.Vector3[] = [];
    const strand2Points: THREE.Vector3[] = [];

    const sphereGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const biomarkerGeom = new THREE.SphereGeometry(0.55, 24, 24);

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x78350f,
      emissiveIntensity: 0.25
    });

    const emeraldMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x064e3b,
      emissiveIntensity: 0.3
    });

    const rungMaterial = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      metalness: 0.4,
      roughness: 0.4,
      transparent: true,
      opacity: 0.8
    });

    for (let i = 0; i <= pointsCount; i++) {
      const t = (i / pointsCount) * (Math.PI * 2 * turns);
      const y = (i / pointsCount - 0.5) * heightSpan;

      const x1 = Math.cos(t) * radius;
      const z1 = Math.sin(t) * radius;
      const p1 = new THREE.Vector3(x1, y, z1);
      strand1Points.push(p1);

      const x2 = Math.cos(t + Math.PI) * radius;
      const z2 = Math.sin(t + Math.PI) * radius;
      const p2 = new THREE.Vector3(x2, y, z2);
      strand2Points.push(p2);

      // Node on Strand 1
      const isSpecial = i % 8 === 0;
      const node1 = new THREE.Mesh(
        isSpecial ? biomarkerGeom : sphereGeom,
        isSpecial ? goldMaterial : emeraldMaterial
      );
      node1.position.copy(p1);
      helixGroup.add(node1);

      // Node on Strand 2
      const node2 = new THREE.Mesh(
        isSpecial ? biomarkerGeom : sphereGeom,
        isSpecial ? emeraldMaterial : goldMaterial
      );
      node2.position.copy(p2);
      helixGroup.add(node2);

      // Connecting rungs (base pairs)
      if (i % 2 === 0) {
        const rungCurve = new THREE.LineCurve3(p1, p2);
        const rungTubeGeom = new THREE.TubeGeometry(rungCurve, 8, 0.08, 8, false);
        const rungMesh = new THREE.Mesh(rungTubeGeom, rungMaterial);
        helixGroup.add(rungMesh);
      }
    }

    // Floating Ambient Molecular Particles
    const particleCount = 70;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 22;
      particlePositions[i + 1] = (Math.random() - 0.5) * 22;
      particlePositions[i + 2] = (Math.random() - 0.5) * 16;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.18,
      transparent: true,
      opacity: 0.65
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 4. Mouse Interactive Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0.1;
    let targetRotationY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch support for mobile/tablet
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => {
      isDragging = false;
    };

    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 5. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous gentle rotation when not actively dragging
      if (!isDragging) {
        targetRotationY += 0.007;
      }

      helixGroup.rotation.y += (targetRotationY - helixGroup.rotation.y) * 0.08;
      helixGroup.rotation.x += (targetRotationX - helixGroup.rotation.x) * 0.08;

      // Floating wave motion
      helixGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.45;
      particleSystem.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    // 6. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, []);

  return (
    <div
      className="relative w-full h-[400px] sm:h-[440px] rounded-3xl bg-gradient-to-b from-white via-slate-50 to-blue-50/40 border border-slate-200 shadow-luxury overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Overlay Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-blue-200 shadow-sm">
        <Dna className="w-4 h-4 text-royal-600 animate-spin" style={{ animationDuration: '8s' }} />
        <span className="text-[11px] font-extrabold text-slate-900 tracking-wide uppercase">
          Oral Onco-Biomarker 3D Helix
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* Rotate hint badge */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center space-x-1.5 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] text-slate-600 border border-slate-200 shadow-sm">
        <RotateCw className="w-3 h-3 text-royal-600" />
        <span>Drag 360°</span>
      </div>

      {/* Interactive Biomarker Selector Chips */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col space-y-2 pointer-events-auto">
        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
          {BIOMARKERS.map((marker) => (
            <button
              key={marker.name}
              onClick={() => setSelectedMarker(marker)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm flex items-center space-x-1 ${
                selectedMarker.name === marker.name
                  ? 'bg-royal-600 text-white shadow-blue-card scale-105'
                  : 'bg-white hover:bg-blue-50 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{marker.name}</span>
              {selectedMarker.name === marker.name && <Sparkles className="w-3 h-3 ml-0.5 text-amber-300" />}
            </button>
          ))}
        </div>

        {/* Selected Biomarker Information Card */}
        {selectedMarker && (
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-md transition-all text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-royal-600" />
                <span>{selectedMarker.fullName}</span>
              </span>
              <span className="text-[10px] font-semibold bg-blue-50 text-royal-800 px-2 py-0.5 rounded-full border border-blue-200">
                {selectedMarker.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {selectedMarker.clinicalSignificance}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OralBiomarkerHelix3D;

