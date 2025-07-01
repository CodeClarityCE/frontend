<script lang="ts" setup>
import type { GraphDependency } from '@/codeclarity_components/results/graph.entity';
import * as d3 from 'd3';
import { onMounted } from 'vue';

/**
 * TreeChart Component Props
 * @param data - Array of GraphDependency objects representing nodes in the tree
 * @param id - Unique identifier for the SVG container element
 * @param targetDependency - Optional: The dependency to highlight in the tree (can appear multiple times)
 */
const props = defineProps<{
    data: Array<GraphDependency>;
    id: string;
    targetDependency?: string;
}>();

onMounted(() => {
    try {
        // ===========================================
        // 1. CHART CONFIGURATION & SETUP
        // ===========================================
        
        /** Fixed width for the chart canvas */
        const width = 928;

        // Debug: Log the data structure to help identify issues
        console.log('TreeChart data:', props.data);
        console.log('Target dependency to highlight:', props.targetDependency);
        
        // Find root nodes (nodes without parents) for debugging
        const rootNodes = props.data.filter(d => 
            (!d.parentIds || d.parentIds.length === 0) && 
            !(d as any).parentId
        );
        console.log('Root nodes found:', rootNodes);
        
        // Find target dependency instances
        const targetInstances = props.targetDependency 
            ? props.data.filter(d => d.id === props.targetDependency)
            : [];
        console.log('Target dependency instances found:', targetInstances.length);
        
        // Debug: Show parent-child relationships
        props.data.forEach(node => {
            if (node.childrenIds && node.childrenIds.length > 0) {
                console.log(`Node ${node.id} has children:`, node.childrenIds);
            }
            if (node.parentIds && node.parentIds.length > 0) {
                console.log(`Node ${node.id} has parents:`, node.parentIds);
            }
        });

        /**
         * Convert flat array of dependencies into hierarchical tree structure
         * d3.stratify() creates a tree from tabular data by linking children to parents
         * We need to handle the new parentIds array structure and ensure single root
         * 
         * We'll build the tree using both parentIds and childrenIds to ensure all relationships are captured
         */
        
        // First, create a map of all nodes for quick lookup
        const nodeMap = new Map<string, GraphDependency>();
        props.data.forEach(node => {
            nodeMap.set(node.id, node);
        });
        
        // Enhance the data with complete parent-child relationships
        const enhancedData = props.data.map(node => {
            const enhanced = { ...node };
            
            // Ensure we have all children listed based on what nodes point to this as parent
            const childrenFromParentRefs = props.data
                .filter(d => d.parentIds && d.parentIds.includes(node.id))
                .map(d => d.id);
            
            // Combine children from childrenIds and those found via parent references
            const allChildren = new Set([
                ...(enhanced.childrenIds || []),
                ...childrenFromParentRefs
            ]);
            
            enhanced.childrenIds = Array.from(allChildren);
            
            return enhanced;
        });
        
        const root = d3.stratify<GraphDependency>()
            .id((d: GraphDependency) => d.id)           // Unique identifier for each node
            .parentId((d: GraphDependency) => {
                // Handle the new parentIds array structure
                if (d.parentIds && d.parentIds.length > 0) {
                    // Use the first parent for tree structure (d3.stratify requires single parent)
                    return d.parentIds[0];
                }
                // Handle legacy parentId for backward compatibility
                if ((d as any).parentId) {
                    return (d as any).parentId;
                }
                // No parent (root node)
                return null;
            })
            (enhancedData);

        // Debug: Log the tree structure
        console.log('Enhanced data used for tree:', enhancedData);
        console.log('Tree root:', root);
        console.log('Tree height:', root.height);
        console.log('Tree descendants:', root.descendants().map(d => ({ 
            id: d.data.id, 
            depth: d.depth, 
            children: d.children?.map(c => c.data.id) || []
        })));

        /**
         * Tree layout spacing configuration
         * Increased spacing for better readability
         */
        const dx = 40; // Increased vertical spacing between sibling nodes
        const dy = 250; // Increased horizontal spacing between parent-child levels

    // ===========================================
    // 2. TREE LAYOUT CALCULATION
    // ===========================================
    
    /**
     * Create D3 tree layout generator with specified node spacing
     * This calculates x,y coordinates for all nodes in the tree
     */
    const tree = d3.tree<GraphDependency>().nodeSize([dx, dy]);
    
    // Optional: Sort nodes alphabetically (currently commented out)
    // root.sort((a, b) => d3.ascending(a.data.name, b.data.name));

    /**
     * Apply the tree layout to calculate positions
     * After this, each node has x,y coordinates relative to tree structure
     */
    tree(root);
    
    // ===========================================
    // 3. CALCULATE CHART DIMENSIONS
    // ===========================================
    
    /**
     * Find the vertical extent (min/max x-coordinates) of all nodes
     * Note: In D3 tree layout, 'x' represents vertical position (breadth)
     * and 'y' represents horizontal position (depth)
     */
    let x0 = Infinity;  // Minimum x-coordinate (top of tree)
    let x1 = -x0;       // Maximum x-coordinate (bottom of tree)
    
    root.each(d => {
        const dxVal = d.x ?? 0; // Get x-coordinate with fallback
        if (dxVal > x1) x1 = dxVal; // Track maximum
        if (dxVal < x0) x0 = dxVal; // Track minimum
    });

    /**
     * Calculate total height needed for the SVG
     * Add extra padding for better visual appearance
     */
    const height = x1 - x0 + dx * 8; // Increased padding even further

    // Calculate proper margins to prevent clipping
    const marginTop = dx * 3; // Top margin
    const marginBottom = dx * 3; // Bottom margin
    const marginLeft = dy * 0.6; // Left margin for labels
    const marginRight = dy * 0.4; // Right margin
    
    // Reserve extra space for legend if present
    const legendSpace = props.targetDependency ? 120 : 0; // Extra space for legend

    // Debug: Log layout calculations
    console.log('Tree extent - x0:', x0, 'x1:', x1);
    console.log('Calculated height:', height);
    console.log('Margins - top:', marginTop, 'bottom:', marginBottom, 'left:', marginLeft, 'right:', marginRight);

    // ===========================================
    // 4. CREATE SVG CONTAINER
    // ===========================================
    
    /**
     * Create the main SVG element and set up viewport
     * ViewBox allows the chart to be responsive while maintaining aspect ratio
     */
    const svg = d3.select('#' + props.id)
        .append('svg')
        .attr("width", "100%")
        .attr("height", height + marginTop + marginBottom + legendSpace)
        .attr("viewBox", [-marginLeft, x0 - marginTop - legendSpace, width + marginLeft + marginRight, height + marginTop + marginBottom + legendSpace])
        .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif; background: #fafafa; border-radius: 8px; overflow: visible;");

    // Add background grid for better visual structure
    const defs = svg.append("defs");
    
    // Create gradient for links
    const linkGradient = defs.append("linearGradient")
        .attr("id", "linkGradient")
        .attr("gradientUnits", "userSpaceOnUse");
    
    linkGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#64748b")
        .attr("stop-opacity", 0.6);
    
    linkGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#94a3b8")
        .attr("stop-opacity", 0.3);

    // Create highlight gradient for target dependencies
    const highlightGradient = defs.append("radialGradient")
        .attr("id", "highlightGradient")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%");
    
    highlightGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#fbbf24")
        .attr("stop-opacity", 0.8);
    
    highlightGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#f59e0b")
        .attr("stop-opacity", 1);

    // ===========================================
    // 5. DRAW CONNECTING LINES (LINKS)
    // ===========================================
    
    /**
     * Create group for all connection lines between nodes
     * Enhanced styling for better visual hierarchy
     */
    svg.append("g")
        .attr("fill", "none")
        .selectAll()
        .data(root.links())
        .join("path")
        .attr("stroke", d => {
            // Highlight paths to target dependencies
            if (props.targetDependency && 
                (d.source.data.id === props.targetDependency || d.target.data.id === props.targetDependency)) {
                return "#f59e0b"; // Orange for target paths
            }
            return "url(#linkGradient)"; // Gradient for normal paths
        })
        .attr("stroke-width", d => {
            // Thicker lines for target dependency paths
            if (props.targetDependency && 
                (d.source.data.id === props.targetDependency || d.target.data.id === props.targetDependency)) {
                return 3;
            }
            return 2;
        })
        .attr("stroke-opacity", d => {
            // More opaque for target paths
            if (props.targetDependency && 
                (d.source.data.id === props.targetDependency || d.target.data.id === props.targetDependency)) {
                return 0.8;
            }
            return 0.6;
        })
        /**
         * Generate curved paths connecting parent to child nodes
         * linkHorizontal creates smooth horizontal curves
         */
        .attr("d", d3.linkHorizontal<any, d3.HierarchyPointNode<GraphDependency>>()
            .x(d => d.y)
            .y(d => d.x)
        );

    // ===========================================
    // 6. DRAW NODES (CIRCLES AND LABELS)
    // ===========================================
    
    /**
     * Create group for all tree nodes with enhanced styling
     */
    const node = svg.append("g")
        .selectAll()
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .style("cursor", "pointer");

    // Add glow effect for target dependencies
    node.filter((d: any) => props.targetDependency !== undefined && d.data.id === props.targetDependency)
        .append("circle")
        .attr("r", 12)
        .attr("fill", "none")
        .attr("stroke", "#fbbf24")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.6)
        .attr("filter", "blur(2px)");

    /**
     * Add circular markers for each node with enhanced styling
     */
    node.append("circle")
        .attr("fill", d => {
            // Special highlighting for target dependency
            if (props.targetDependency && d.data.id === props.targetDependency) {
                return "url(#highlightGradient)"; // Highlighted gradient
            }
            // Special styling for virtual root
            if (d.data.id === "__VIRTUAL_ROOT__") return "#3b82f6"; // Blue for virtual root
            // Different colors based on depth and node type
            if (d.children) {
                return d.depth === 1 ? "#059669" : "#374151"; // Green for level 1, dark gray for deeper
            }
            return "#9ca3af"; // Light gray for leaves
        })
        .attr("r", d => {
            // Larger circles for important nodes
            if (props.targetDependency && d.data.id === props.targetDependency) return 8;
            if (d.data.id === "__VIRTUAL_ROOT__") return 6;
            return d.children ? 5 : 4;
        })
        .attr("stroke", d => {
            if (props.targetDependency && d.data.id === props.targetDependency) return "#f59e0b";
            if (d.data.id === "__VIRTUAL_ROOT__") return "#1d4ed8";
            return "#ffffff";
        })
        .attr("stroke-width", d => {
            if (props.targetDependency && d.data.id === props.targetDependency) return 3;
            return 2;
        })
        .attr("filter", d => {
            if (props.targetDependency && d.data.id === props.targetDependency) {
                return "drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))";
            }
            return "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))";
        });

    /**
     * Add background rectangles for text labels for better readability
     */
    node.append("rect")
        .attr("x", d => {
            const text = d.data.id === "__VIRTUAL_ROOT__" ? "ROOT" : d.data.id;
            const displayText = text.length > 25 ? text.substring(0, 22) + "..." : text;
            const textWidth = Math.max(displayText.length * 8 + 16, 60); // More generous width calculation
            
            // Position rect based on whether node has children (left vs right side)
            if (d.children) {
                return -textWidth - 20; // Left side for parent nodes
            } else {
                return 20; // Right side for leaf nodes
            }
        })
        .attr("y", -14)
        .attr("width", d => {
            const text = d.data.id === "__VIRTUAL_ROOT__" ? "ROOT" : d.data.id;
            const displayText = text.length > 25 ? text.substring(0, 22) + "..." : text;
            return Math.max(displayText.length * 8 + 16, 60);
        })
        .attr("height", 28)
        .attr("rx", 6)
        .attr("fill", d => {
            if (props.targetDependency && d.data.id === props.targetDependency) {
                return "rgba(251, 191, 36, 0.95)"; // Yellow background for target
            }
            if (d.data.id === "__VIRTUAL_ROOT__") return "rgba(59, 130, 246, 0.15)";
            return "rgba(255, 255, 255, 0.95)";
        })
        .attr("stroke", d => {
            if (props.targetDependency && d.data.id === props.targetDependency) return "#f59e0b";
            if (d.data.id === "__VIRTUAL_ROOT__") return "#3b82f6";
            return "#e5e7eb";
        })
        .attr("stroke-width", d => {
            if (props.targetDependency && d.data.id === props.targetDependency) return 2;
            return 1;
        });

    /**
     * Add text labels with enhanced styling
     */
    node.append("text")
        .attr("dy", "0.32em")
        .attr("x", d => {
            const text = d.data.id === "__VIRTUAL_ROOT__" ? "ROOT" : d.data.id;
            const displayText = text.length > 25 ? text.substring(0, 22) + "..." : text;
            const textWidth = Math.max(displayText.length * 8 + 16, 60);
            
            // Center text within the rectangle
            if (d.children) {
                return -textWidth/2 - 20; // Center in left-side rect
            } else {
                return textWidth/2 + 20; // Center in right-side rect
            }
        })
        .attr("text-anchor", "middle")
        .text(d => {
            if (d.data.id === "__VIRTUAL_ROOT__") return "ROOT";
            // Truncate long dependency names for better layout
            const name = d.data.id;
            return name.length > 25 ? name.substring(0, 22) + "..." : name;
        })
        .attr("font-size", d => {
            if (props.targetDependency && d.data.id === props.targetDependency) return "13px";
            if (d.data.id === "__VIRTUAL_ROOT__") return "12px";
            return "10px";
        })
        .attr("font-weight", d => {
            if (props.targetDependency && d.data.id === props.targetDependency) return "bold";
            if (d.data.id === "__VIRTUAL_ROOT__") return "bold";
            return d.children ? "600" : "normal";
        })
        .attr("fill", d => {
            if (props.targetDependency && d.data.id === props.targetDependency) return "#92400e";
            if (d.data.id === "__VIRTUAL_ROOT__") return "#1e40af";
            return "#374151";
        });

    // Add tooltips on hover
    node.append("title")
        .text(d => {
            const isTarget = props.targetDependency && d.data.id === props.targetDependency;
            const targetText = isTarget ? " [TARGET DEPENDENCY]" : "";
            return `${d.data.id}${targetText}\nDepth: ${d.depth}\nChildren: ${d.children?.length || 0}`;
        });

    // ===========================================
    // 7. ADD LEGEND FOR BETTER UNDERSTANDING
    // ===========================================
    
    if (props.targetDependency) {
        const legend = svg.append("g")
            .attr("transform", `translate(${-marginLeft + 20}, ${x0 - marginTop - legendSpace + 20})`); // Position relative to viewBox

        // Legend background
        legend.append("rect")
            .attr("x", -15)
            .attr("y", -15)
            .attr("width", 220)
            .attr("height", 90)
            .attr("fill", "rgba(255, 255, 255, 0.95)")
            .attr("stroke", "#e5e7eb")
            .attr("stroke-width", 1)
            .attr("rx", 6);

        // Legend title
        legend.append("text")
            .attr("x", 0)
            .attr("y", 5)
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "#374151")
            .text("Legend");

        // Target dependency indicator
        legend.append("circle")
            .attr("cx", 10)
            .attr("cy", 25)
            .attr("r", 6)
            .attr("fill", "url(#highlightGradient)")
            .attr("stroke", "#f59e0b")
            .attr("stroke-width", 2);

        legend.append("text")
            .attr("x", 25)
            .attr("y", 30)
            .attr("font-size", "11px")
            .attr("fill", "#374151")
            .text("Target Dependency");

        // Root indicator
        legend.append("circle")
            .attr("cx", 10)
            .attr("cy", 45)
            .attr("r", 5)
            .attr("fill", "#3b82f6")
            .attr("stroke", "#1d4ed8")
            .attr("stroke-width", 2);

        legend.append("text")
            .attr("x", 25)
            .attr("y", 50)
            .attr("font-size", "11px")
            .attr("fill", "#374151")
            .text("Root Node");

        // Parent/Child indicator
        legend.append("circle")
            .attr("cx", 10)
            .attr("cy", 65)
            .attr("r", 4)
            .attr("fill", "#059669")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2);

        legend.append("text")
            .attr("x", 25)
            .attr("y", 70)
            .attr("font-size", "11px")
            .attr("fill", "#374151")
            .text("Parent/Child Nodes");
    }
    } catch (error) {
        console.error('Error rendering TreeChart:', error);
        console.error('Data that caused the error:', props.data);
        
        // Display error message in the container
        d3.select('#' + props.id)
            .append('div')
            .style('color', 'red')
            .style('padding', '20px')
            .text(`Error rendering tree chart: ${error}`);
    }
});
</script>
<template>
    <div class="tree-chart-container">
        <div v-if="targetDependency" class="tree-chart-header">
            <h3 class="tree-chart-title">
                Dependency Tree for: <span class="target-name">{{ targetDependency }}</span>
            </h3>
            <p class="tree-chart-description">
                The highlighted nodes show where this dependency appears in the tree structure
            </p>
        </div>
        <div :id="id" class="tree-chart"></div>
    </div>
</template>

<style scoped>
.tree-chart-container {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px; /* Increased padding */
    background: #ffffff;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    width: 100%;
    overflow: visible;
    min-width: 0; /* Allow container to shrink */
}

.tree-chart-header {
    margin-bottom: 24px; /* Increased margin */
    text-align: center;
}

.tree-chart-title {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #374151;
}

.target-name {
    color: #f59e0b;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    background: rgba(251, 191, 36, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
}

.tree-chart-description {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
}

.tree-chart {
    width: 100%;
    overflow: visible;
    min-height: 400px;
    /* Add horizontal scrolling if needed */
    overflow-x: auto;
    overflow-y: visible;
}

/* Add some responsive behavior */
@media (max-width: 768px) {
    .tree-chart-container {
        padding: 16px;
    }
    
    .tree-chart-title {
        font-size: 16px;
    }
    
    .tree-chart-description {
        font-size: 13px;
    }
}
</style>
