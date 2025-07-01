<script lang="ts" setup>
import type { GraphDependency } from '@/codeclarity_components/results/graph.entity';
import * as d3 from 'd3';
import { onMounted } from 'vue';

/**
 * TreeChart Component Props
 * @param data - Array of GraphDependency objects representing nodes in the tree
 * @param id - Unique identifier for the SVG container element
 */
const props = defineProps<{
    data: Array<GraphDependency>;
    id: string;
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
        
        // Find root nodes (nodes without parents) for debugging
        const rootNodes = props.data.filter(d => 
            (!d.parentIds || d.parentIds.length === 0) && 
            !(d as any).parentId
        );
        console.log('Root nodes found:', rootNodes);
        
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
         * dx: Vertical spacing between sibling nodes
         * dy: Horizontal spacing between parent-child levels
         */
        const dx = 10;
        const dy = width / (root.height + 1); // Distribute width based on tree depth

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
     * Add padding (dx * 2) to ensure nodes don't touch edges
     */
    const height = x1 - x0 + dx * 2;

    // ===========================================
    // 4. CREATE SVG CONTAINER
    // ===========================================
    
    /**
     * Create the main SVG element and set up viewport
     * ViewBox allows the chart to be responsive while maintaining aspect ratio
     */
    const svg = d3.select('#' + props.id)
        .append('svg')
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-dy / 3, x0 - dx, width, height]) // [x, y, width, height]
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    // ===========================================
    // 5. DRAW CONNECTING LINES (LINKS)
    // ===========================================
    
    /**
     * Create group for all connection lines between nodes
     * These lines show the parent-child relationships in the tree
     */
    svg.append("g")
        .attr("fill", "none")           // No fill for lines
        .attr("stroke", "#555")         // Gray stroke color
        .attr("stroke-opacity", 0.4)    // Semi-transparent
        .attr("stroke-width", 1.5)      // Line thickness
        .selectAll()                    // Select all (initially empty)
        .data(root.links())             // Bind link data from tree
        .join("path")                   // Create path elements
        /**
         * Generate curved paths connecting parent to child nodes
         * linkHorizontal creates smooth horizontal curves
         * Note: x/y are swapped because tree extends horizontally, not vertically
         */
        .attr("d", d3.linkHorizontal<any, d3.HierarchyPointNode<GraphDependency>>()
            .x(d => d.y)  // Horizontal position (tree depth)
            .y(d => d.x)  // Vertical position (tree breadth)
        );

    // ===========================================
    // 6. DRAW NODES (CIRCLES AND LABELS)
    // ===========================================
    
    /**
     * Create group for all tree nodes
     * Each node consists of a circle and text label
     */
    const node = svg.append("g")
        .attr("stroke-linejoin", "round") // Smooth line joins
        .attr("stroke-width", 3)          // Text outline thickness
        .selectAll()                      // Select all (initially empty)
        .data(root.descendants())         // Bind all nodes in tree
        .join("g")                        // Create group for each node
        /**
         * Position each node group at its calculated coordinates
         * Note: x/y are swapped for horizontal tree layout
         */
        .attr("transform", d => `translate(${d.y},${d.x})`);

    /**
     * Add circular markers for each node
     * Different colors and sizes indicate different node types
     */
    node.append("circle")
        .attr("fill", d => {
            // Special styling for virtual root
            if (d.data.id === "__VIRTUAL_ROOT__") return "#2563eb"; // Blue for virtual root
            // Different colors for leaf vs parent nodes
            return d.children ? "#555" : "#999"; // Darker for parents, lighter for leaves
        })
        .attr("r", d => {
            // Larger circle for virtual root
            if (d.data.id === "__VIRTUAL_ROOT__") return 4;
            return 2.5; // Normal size for other nodes
        })
        .attr("stroke", d => d.data.id === "__VIRTUAL_ROOT__" ? "#1d4ed8" : "none")
        .attr("stroke-width", 2);

    /**
     * Add text labels showing the dependency ID
     * Labels are positioned relative to node type for better readability
     */
    node.append("text")
        .attr("dy", "0.31em")  // Vertical centering adjustment
        /**
         * Position text based on node type:
         * - Parent nodes: label on left (-6px)
         * - Leaf nodes: label on right (+6px)
         */
        .attr("x", d => d.children ? -6 : 6)
        .attr("text-anchor", d => d.children ? "end" : "start") // Text alignment
        .text(d => {
            // Show a friendlier name for virtual root
            if (d.data.id === "__VIRTUAL_ROOT__") return "ROOT";
            return d.data.id;
        })
        .attr("stroke", "white")     // White outline for better readability
        .attr("paint-order", "stroke") // Draw outline behind text
        .attr("font-weight", d => d.data.id === "__VIRTUAL_ROOT__" ? "bold" : "normal")
        .attr("fill", d => d.data.id === "__VIRTUAL_ROOT__" ? "#1d4ed8" : "black");
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
    <div>
        <div :id="id"></div>
    </div>
</template>
