import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Memory {
    id: string;
    content: string;
    createdAt: number;
    category?: string;
    priority?: string;
}

interface MemoryGraphProps {
    memories: Memory[];
}

interface Node {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    memory: Memory;
}

export const MemoryGraph: React.FC<MemoryGraphProps> = ({ memories }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
    const nodesRef = useRef<Node[]>([]);
    const reqRef = useRef<number>();

    // Initialize Nodes
    useEffect(() => {
        const colors = {
            'profile': '#3B82F6', // Blue
            'contact': '#10B981', // Green
            'location': '#F59E0B', // Amber
            'birthday': '#EC4899', // Pink
            'note': '#8B5CF6',     // Violet
            'default': '#6B7280'   // Gray
        };

        nodesRef.current = memories.map(m => ({
            id: m.id,
            x: Math.random() * 800,
            y: Math.random() * 600,
            vx: 0,
            vy: 0,
            radius: 5 + Math.min(m.content.length / 10, 15), // Size based on content length
            color: colors[(m.category as keyof typeof colors) || 'default'] || colors['default'],
            memory: m
        }));
    }, [memories]);

    // Simulation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const update = () => {
             // Handle resize
            const rect = canvas.getBoundingClientRect();
            if (canvas.width !== rect.width || canvas.height !== rect.height) {
                canvas.width = rect.width;
                canvas.height = rect.height;
            }
            const width = canvas.width;
            const height = canvas.height;
            const cx = width / 2;
            const cy = height / 2;

            ctx.clearRect(0, 0, width, height);

            const nodes = nodesRef.current;
            
            // Physics
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                
                // 1. Attraction to Center
                const dx = cx - node.x;
                const dy = cy - node.y;
                node.vx += dx * 0.001;
                node.vy += dy * 0.001;

                // 2. Repulsion from other nodes
                for (let j = 0; j < nodes.length; j++) {
                    if (i === j) continue;
                    const other = nodes[j];
                    const diffX = node.x - other.x;
                    const diffY = node.y - other.y;
                    const dist = Math.sqrt(diffX * diffX + diffY * diffY);
                    const minDist = node.radius + other.radius + 10;
                    
                    if (dist < minDist && dist > 0) {
                        const force = (minDist - dist) / dist; // Repel stronger if closer
                        const repelX = diffX * force * 0.05;
                        const repelY = diffY * force * 0.05;
                        node.vx += repelX;
                        node.vy += repelY;
                    }
                }

                // Apply Velocity
                node.vx *= 0.94; // Friction
                node.vy *= 0.94;
                node.x += node.vx;
                node.y += node.vy;

                // Draw Links (Category based)
                for (let j = i + 1; j < nodes.length; j++) {
                    const other = nodes[j];
                    if (node.memory.category === other.memory.category && node.memory.category) {
                         ctx.beginPath();
                         ctx.moveTo(node.x, node.y);
                         ctx.lineTo(other.x, other.y);
                         ctx.strokeStyle = node.color + '20'; // Very transparent
                         ctx.lineWidth = 1;
                         ctx.stroke();
                    }
                }
            }

            // Draw Nodes
            nodes.forEach(node => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = node.color + '80';
                ctx.fill();
                ctx.strokeStyle = node.color;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Highlight if hovered
                if (hoveredNode && hoveredNode.id === node.id) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
                    ctx.strokeStyle = 'white';
                    ctx.stroke();
                }
            });

            reqRef.current = requestAnimationFrame(update);
        };

        update();

        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        };
    }, [hoveredNode, memories]); 

    // Mouse Interaction
    const handleMouseMove = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Find slightly closer node
        let found: Node | null = null;
        for (const node of nodesRef.current) {
            const dx = node.x - mouseX;
            const dy = node.y - mouseY;
            if (Math.sqrt(dx*dx + dy*dy) < node.radius + 5) {
                found = node;
                break;
            }
        }
        setHoveredNode(found);
    };

    return (
        <div className="relative w-full h-[400px] bg-[#09090b] rounded-2xl border border-white/10 overflow-hidden group">
            <canvas 
                ref={canvasRef} 
                className="w-full h-full cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredNode(null)}
            />
            <div className="absolute top-4 left-4 text-xs text-gray-500 font-mono pointer-events-none">
                MEMORY PALACE v0.1
            </div>

            {/* Hover Tooltip */}
            <AnimatePresence>
                {hoveredNode && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 pointer-events-none"
                    >
                        <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-2xl">
                             <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: hoveredNode.color }} />
                                <span className="text-[10px] uppercase font-bold text-gray-400">{hoveredNode.memory.category || 'Memory'}</span>
                                <span className="text-[10px] text-gray-600 ml-auto">{new Date(hoveredNode.memory.createdAt).toLocaleDateString()}</span>
                             </div>
                             <p className="text-sm text-white font-medium leading-relaxed">
                                {hoveredNode.memory.content}
                             </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
