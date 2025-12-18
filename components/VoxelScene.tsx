
import React, { useState, useRef, useEffect } from 'react';

interface Block {
  x: number;
  y: number;
  z: number;
  type: string;
}

interface Blueprint {
  blocks: Block[];
}

interface VoxelSceneProps {
  blueprint: Blueprint;
}

const BLOCK_COLORS: Record<string, string> = {
  'grass': '#5b8736',
  'dirt': '#79553a',
  'stone': '#7d7d7d',
  'plank': '#a07548',
  'redstone_wire': '#ff0000',
  'redstone_block': '#c41d1d',
  'piston': '#9c8c74',
  'piston_head': '#bfb196',
  'lamp_on': '#fffeb5',
  'lamp_off': '#4a3b25',
  'observer': '#3a3a3a',
  'glass': 'rgba(200, 240, 255, 0.5)',
  'default': '#ff00ff' // Magenta for missing textures
};

const VoxelScene: React.FC<VoxelSceneProps> = ({ blueprint }) => {
  const [rotation, setRotation] = useState({ x: -30, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    lastMousePos.current = { x: clientX, y: clientY };
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const deltaX = clientX - lastMousePos.current.x;
    const deltaY = clientY - lastMousePos.current.y;

    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));

    lastMousePos.current = { x: clientX, y: clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Center the scene
  const blocks = blueprint?.blocks || [];
  
  return (
    <div 
      ref={containerRef}
      className="w-full h-full cursor-move perspective-container touch-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      style={{ perspective: '800px', overflow: 'hidden' }}
    >
      <div 
        className="scene-root"
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
      >
         {/* Render Blocks */}
         {blocks.map((block, i) => {
             const size = 40; // Block size in px
             // Center offset: assuming 5x5 grid usually, offset by -2.5
             const x = (block.x - 2) * size;
             const y = (-(block.y) + 2) * size; // Invert Y for 3D logic
             const z = (block.z - 2) * size;
             const color = BLOCK_COLORS[block.type] || BLOCK_COLORS['default'];
             const isGlass = block.type === 'glass';

             return (
                 <div
                    key={i}
                    className="cube"
                    style={{
                        transform: `translate3d(${x}px, ${y}px, ${z}px)`,
                        width: `${size}px`,
                        height: `${size}px`,
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginTop: `-${size/2}px`,
                        marginLeft: `-${size/2}px`,
                        transformStyle: 'preserve-3d'
                    }}
                 >
                    {/* Faces */}
                    <div className="face front"  style={{ transform: `rotateY(0deg) translateZ(${size/2}px)`, background: color, opacity: isGlass ? 0.4 : 1 }} />
                    <div className="face back"   style={{ transform: `rotateY(180deg) translateZ(${size/2}px)`, background: color, opacity: isGlass ? 0.4 : 1 }} />
                    <div className="face right"  style={{ transform: `rotateY(90deg) translateZ(${size/2}px)`, background: color, opacity: isGlass ? 0.4 : 1 }} />
                    <div className="face left"   style={{ transform: `rotateY(-90deg) translateZ(${size/2}px)`, background: color, opacity: isGlass ? 0.4 : 1 }} />
                    <div className="face top"    style={{ transform: `rotateX(90deg) translateZ(${size/2}px)`, background: lighten(color, 20), opacity: isGlass ? 0.4 : 1 }} />
                    <div className="face bottom" style={{ transform: `rotateX(-90deg) translateZ(${size/2}px)`, background: darken(color, 20), opacity: isGlass ? 0.4 : 1 }} />
                 </div>
             );
         })}
      </div>
      <style>{`
        .face { position: absolute; width: 40px; height: 40px; border: 1px solid rgba(0,0,0,0.1); box-shadow: inset 0 0 10px rgba(0,0,0,0.2); }
      `}</style>
    </div>
  );
};

// Helper to lighten/darken hex color
function lighten(hex: string, percent: number) {
    const num = parseInt(hex.replace('#',''), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}
function darken(hex: string, percent: number) {
    const num = parseInt(hex.replace('#',''), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = (num >> 8 & 0x00FF) - amt,
    B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

export default VoxelScene;
