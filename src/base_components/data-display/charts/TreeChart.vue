<script lang="ts" setup>
import * as d3 from "d3";
import { onMounted, ref } from "vue";
import type { GraphDependency } from "@/codeclarity_components/results/graph.entity";
import TreeChartLegend from "./TreeChartLegend.vue";

/**
 * TreeChart Component Props
 * @param data - Array of GraphDependency objects representing nodes in the tree
 * @param id - Unique identifier for the SVG container element
 * @param targetDependency - Optional: The dependency to highlight in the tree (can appear multiple times)
 */
const props = defineProps<{
  data: GraphDependency[];
  id: string;
  targetDependency?: string;
}>();

// Add these refs to expose legend props for the legend component
interface LegendProps {
  svgSelector: string;
  marginLeft: number;
  x0: number;
  marginTop: number;
  legendSpace: number;
  hasPrunedNodes: boolean;
  prunedNodes: Set<string>;
  targetDependency?: string;
}

const legendProps = ref<LegendProps | null>(null);

onMounted(() => {
  try {
    // ===========================================
    // 1. CHART CONFIGURATION & SETUP
    // ===========================================

    /** Fixed width for the chart canvas */
    const width = 928;

    /**
     * Convert flat array of dependencies into hierarchical tree structure
     * Since the same dependency can appear multiple times with different parents,
     * we need to create unique node instances for each parent-child relationship
     */

    // First, create a map of all nodes for quick lookup
    const nodeMap = new Map<string, GraphDependency>();
    props.data.forEach((node) => {
      nodeMap.set(node.id, node);
    });

    // Create unique nodes for each parent-child relationship
    const expandedNodes: (GraphDependency & { uniqueId: string })[] = [];
    const processedRelationships = new Set<string>();

    /**
     * Process a single parent-child relationship and add to expanded nodes
     */
    const processParentRelationship = (
      node: GraphDependency,
      parentId: string,
      index: number,
      parentCount: number,
    ): void => {
      const relationshipKey = `${parentId}->${node.id}`;

      if (!processedRelationships.has(relationshipKey)) {
        const uniqueId =
          parentCount > 1 ? `${node.id}_instance_${index}` : node.id;

        expandedNodes.push({
          ...node,
          uniqueId: uniqueId ?? "",
          parentIds: [parentId],
          childrenIds: node.childrenIds ?? [],
        });

        processedRelationships.add(relationshipKey);
      }
    };

    /**
     * Process a node and create appropriate instances
     */
    const processNode = (node: GraphDependency): void => {
      if (!node.parentIds || node.parentIds.length === 0) {
        // Root node - create single instance
        expandedNodes.push({
          ...node,
          uniqueId: node.id,
          parentIds: [],
        });
        return;
      }

      // Node with parents - create instance for each parent
      const parentCount = node.parentIds.length;
      for (let i = 0; i < parentCount; i++) {
        const parentId = node.parentIds[i];
        if (parentId) {
          processParentRelationship(node, parentId, i, parentCount);
        }
      }
    };

    // Process each node and create instances for each parent relationship
    for (const node of props.data) {
      processNode(node);
    }

    /**
     * Update child IDs to reference the correct unique instances
     */
    const updateChildReferences = (
      node: GraphDependency & { uniqueId: string },
    ): GraphDependency & { uniqueId: string } => {
      if (!node.childrenIds || node.childrenIds.length === 0) {
        return node;
      }

      const updatedChildren: string[] = [];
      for (const childId of node.childrenIds) {
        // Find all instances of this child that have this node as parent
        const childInstances = expandedNodes.filter(
          (expanded) =>
            expanded.id === childId && expanded.parentIds?.includes(node.id),
        );

        if (childInstances.length > 0) {
          updatedChildren.push(...childInstances.map((ci) => ci.uniqueId));
        } else {
          // Fallback - use original child ID
          updatedChildren.push(childId);
        }
      }

      return { ...node, childrenIds: updatedChildren };
    };

    // Update child references to point to the correct unique instances
    const updatedNodes = expandedNodes.map(updateChildReferences);

    // Create the initial tree structure to determine which nodes should be pruned
    const tempRoot = d3
      .stratify<GraphDependency & { uniqueId: string }>()
      .id((d) => d.uniqueId)
      .parentId((d) => {
        if (d.parentIds && d.parentIds.length > 0) {
          const parentId = d.parentIds[0];
          const parentNode = updatedNodes.find((n) => n.id === parentId);
          return parentNode ? parentNode.uniqueId : parentId;
        }
        return null;
      })(updatedNodes);

    // Mark nodes that are pruned duplicates
    // Strategy: For nodes that appear multiple times, mark those that appear at greater depth
    // when the same node already appears at a shallower depth (closer to root)
    const prunedNodes = new Set<string>();
    const nodesByDepth = new Map<
      number,
      { nodeId: string; uniqueId: string }[]
    >();
    const seenNodes = new Set<string>(); // Track which nodeIds we've already seen

    // First, collect all nodes organized by depth using breadth-first traversal
    const queue = [tempRoot];
    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      const nodeId = currentNode.data.id;
      const uniqueId = currentNode.data.uniqueId;
      const depth = currentNode.depth;

      // Group nodes by depth
      if (!nodesByDepth.has(depth)) {
        nodesByDepth.set(depth, []);
      }
      nodesByDepth.get(depth)!.push({ nodeId, uniqueId });

      // Add children to queue for continued breadth-first traversal
      if (currentNode.children) {
        queue.push(...currentNode.children);
      }
    }

    /**
     * Process nodes at a specific depth level and mark duplicates as pruned
     */
    const processDepthLevel = (depth: number): void => {
      const nodesAtDepth = nodesByDepth.get(depth);
      if (!nodesAtDepth) {
        return;
      }

      for (const { nodeId, uniqueId } of nodesAtDepth) {
        if (seenNodes.has(nodeId)) {
          // We've seen this node before at a shallower depth - mark as pruned
          // BUT: Never prune the target dependency - users need to see all instances
          if (nodeId !== props.targetDependency) {
            prunedNodes.add(uniqueId);
          }
        } else {
          // First time seeing this node - record it
          seenNodes.add(nodeId);
        }
      }
    };

    // Process nodes level by level, marking duplicates at deeper levels as pruned
    const sortedDepths = Array.from(nodesByDepth.keys()).sort((a, b) => a - b);
    for (const depth of sortedDepths) {
      processDepthLevel(depth);
    }

    // Use the already created tree structure
    const root = tempRoot;

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
    const tree = d3
      .tree<GraphDependency & { uniqueId: string }>()
      .nodeSize([dx, dy]);

    // Sort children so that production branches come first
    root.sort((a, b) => {
      // Virtual root always first
      if (a.data.id === "__VIRTUAL_ROOT__") return -1;
      if (b.data.id === "__VIRTUAL_ROOT__") return 1;
      // Production first, then dev, then others
      if (a.data.prod && !b.data.prod) return -1;
      if (!a.data.prod && b.data.prod) return 1;
      if (a.data.dev && !b.data.dev) return -1;
      if (!a.data.dev && b.data.dev) return 1;
      // Otherwise, alphabetical
      return (a.data.id ?? "").localeCompare(b.data.id ?? "");
    });

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
    let x0 = Infinity; // Minimum x-coordinate (top of tree)
    let x1 = -x0; // Maximum x-coordinate (bottom of tree)

    root.each((d) => {
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
    const hasPrunedNodes = prunedNodes.size > 0;
    let legendSpace = 0;
    if (props.targetDependency) {
      legendSpace = hasPrunedNodes ? 140 : 120;
    }

    // ===========================================
    // 4. CREATE SVG CONTAINER
    // ===========================================

    /**
     * Create the main SVG element and set up viewport
     * ViewBox allows the chart to be responsive while maintaining aspect ratio
     */
    const svg = d3
      .select(`#${props.id}`)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height + marginTop + marginBottom + legendSpace)
      .attr("viewBox", [
        -marginLeft,
        x0 - marginTop - legendSpace,
        width + marginLeft + marginRight,
        height + marginTop + marginBottom + legendSpace,
      ])
      .attr(
        "style",
        "max-width: 100%; height: auto; font: 12px sans-serif; background: #fafafa; border-radius: 8px; overflow: visible;",
      );

    // Add background grid for better visual structure
    const defs = svg.append("defs");

    // Create gradient for links
    const linkGradient = defs
      .append("linearGradient")
      .attr("id", "linkGradient")
      .attr("gradientUnits", "userSpaceOnUse");

    linkGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#64748b")
      .attr("stop-opacity", 0.6);

    linkGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#94a3b8")
      .attr("stop-opacity", 0.3);

    // Create highlight gradient for target dependencies
    const highlightGradient = defs
      .append("radialGradient")
      .attr("id", "highlightGradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");

    highlightGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#fbbf24")
      .attr("stop-opacity", 0.8);

    highlightGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#f59e0b")
      .attr("stop-opacity", 1);

    // Create muted gradient for pruned target dependencies
    const prunedTargetGradient = defs
      .append("radialGradient")
      .attr("id", "prunedTargetGradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");

    prunedTargetGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#cbd5e1")
      .attr("stop-opacity", 0.8);

    prunedTargetGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#94a3b8")
      .attr("stop-opacity", 1);

    // ===========================================
    // 5. DRAW CONNECTING LINES (LINKS)
    // ===========================================

    /**
     * Create group for all connection lines between nodes
     * Enhanced styling for better visual hierarchy
     */
    svg
      .append("g")
      .attr("fill", "none")
      .selectAll()
      .data(root.links())
      .join("path")
      .attr("stroke", (d) => {
        // Highlight paths to target dependencies (all instances)
        if (
          props.targetDependency &&
          (d.source.data.id === props.targetDependency ||
            d.target.data.id === props.targetDependency)
        ) {
          return "#f59e0b"; // Orange for target paths
        }
        return "url(#linkGradient)"; // Gradient for normal paths
      })
      .attr("stroke-width", (d) => {
        // Thicker lines for target dependency paths (all instances)
        if (
          props.targetDependency &&
          (d.source.data.id === props.targetDependency ||
            d.target.data.id === props.targetDependency)
        ) {
          return 3;
        }
        return 2;
      })
      .attr("stroke-opacity", (d) => {
        // More opaque for target paths (all instances)
        if (
          props.targetDependency &&
          (d.source.data.id === props.targetDependency ||
            d.target.data.id === props.targetDependency)
        ) {
          return 0.8;
        }
        return 0.6;
      })
      /**
       * Generate curved paths connecting parent to child nodes
       * linkHorizontal creates smooth horizontal curves
       */
      .attr("d", (d) => {
        const link = d3
          .linkHorizontal<
            d3.HierarchyPointLink<GraphDependency & { uniqueId: string }>,
            d3.HierarchyPointNode<GraphDependency & { uniqueId: string }>
          >()
          .x((node) => node.y)
          .y((node) => node.x);
        return link(
          d as d3.HierarchyPointLink<GraphDependency & { uniqueId: string }>,
        );
      });

    // ===========================================
    // 6. DRAW NODES (CIRCLES AND LABELS)
    // ===========================================

    /**
     * Create group for all tree nodes with enhanced styling
     */
    const node = svg
      .append("g")
      .selectAll()
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .style("cursor", "pointer");

    // Add glow effect for target dependencies (all instances)
    node
      .filter(
        (d) =>
          props.targetDependency !== undefined &&
          d.data.id === props.targetDependency,
      )
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
    node
      .append("circle")
      .attr("fill", (d) => {
        // Check if this is a pruned duplicate node
        const isPruned = prunedNodes.has(d.data.uniqueId);

        // Special highlighting for target dependency (all instances)
        if (props.targetDependency && d.data.id === props.targetDependency) {
          return isPruned
            ? "url(#prunedTargetGradient)"
            : "url(#highlightGradient)";
        }

        // Special styling for pruned duplicates
        if (isPruned) {
          return "#94a3b8"; // Muted gray for pruned nodes
        }

        // Special styling for virtual root
        if (d.data.id === "__VIRTUAL_ROOT__") return "#3b82f6"; // Blue for virtual root
        // Different colors based on depth and node type
        if (d.children) {
          return "#374151"; // Dark gray for parent nodes
        }
        return "#9ca3af"; // Light gray for leaves
      })
      .attr("r", (d) => {
        // Smaller circles for pruned duplicates
        const isPruned = prunedNodes.has(d.data.uniqueId);
        if (isPruned) return 3;

        // Larger circles for important nodes
        if (props.targetDependency && d.data.id === props.targetDependency)
          return 8;
        if (d.data.id === "__VIRTUAL_ROOT__") return 6;
        return d.children ? 5 : 4;
      })
      .attr("stroke", (d) => {
        const isPruned = prunedNodes.has(d.data.uniqueId);

        if (props.targetDependency && d.data.id === props.targetDependency) {
          return isPruned ? "#64748b" : "#f59e0b";
        }
        if (isPruned) return "#64748b";
        if (d.data.id === "__VIRTUAL_ROOT__") return "#1d4ed8";
        return "#ffffff";
      })
      .attr("stroke-width", (d) => {
        const isPruned = prunedNodes.has(d.data.uniqueId);
        if (isPruned) return 1; // Thinner stroke for pruned nodes

        if (props.targetDependency && d.data.id === props.targetDependency)
          return 3;
        return 2;
      })
      .attr("stroke-dasharray", (d) => {
        // Add dashed border for pruned duplicates
        const isPruned = prunedNodes.has(d.data.uniqueId);
        return isPruned ? "3,3" : "none";
      })
      .attr("opacity", (d) => {
        // Reduced opacity for pruned duplicates
        const isPruned = prunedNodes.has(d.data.uniqueId);
        return isPruned ? 0.6 : 1;
      })
      .attr("filter", (d) => {
        const isPruned = prunedNodes.has(d.data.uniqueId);

        if (
          props.targetDependency &&
          d.data.id === props.targetDependency &&
          !isPruned
        ) {
          return "drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))";
        }
        return "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))";
      });

    /**
     * Add background rectangles for text labels for better readability
     */
    node
      .append("rect")
      .attr("x", (d) => {
        const text = d.data.id === "__VIRTUAL_ROOT__" ? "ROOT" : d.data.id;
        const displayText =
          text.length > 25 ? `${text.substring(0, 22)}...` : text;
        const textWidth = Math.max(displayText.length * 8 + 16, 60); // More generous width calculation

        // Position rect based on whether node has children (left vs right side)
        if (d.children) {
          return -textWidth - 20; // Left side for parent nodes
        } else {
          return 20; // Right side for leaf nodes
        }
      })
      .attr("y", -14)
      .attr("width", (d) => {
        const text = d.data.id === "__VIRTUAL_ROOT__" ? "ROOT" : d.data.id;
        const displayText =
          text.length > 25 ? `${text.substring(0, 22)}...` : text;
        return Math.max(displayText.length * 8 + 16, 60);
      })
      .attr("height", 28)
      .attr("rx", 6)
      .attr("fill", (d) => {
        const isPruned = prunedNodes.has(d.data.uniqueId);

        if (props.targetDependency && d.data.id === props.targetDependency) {
          return isPruned
            ? "rgba(203, 213, 225, 0.95)"
            : "rgba(251, 191, 36, 0.95)";
        }
        if (isPruned) return "rgba(248, 250, 252, 0.7)"; // More muted background for pruned
        if (d.data.id === "__VIRTUAL_ROOT__") return "rgba(59, 130, 246, 0.15)";
        return "rgba(255, 255, 255, 0.95)";
      })
      .attr("stroke", (d) => {
        const isPruned = prunedNodes.has(d.data.uniqueId);

        if (props.targetDependency && d.data.id === props.targetDependency) {
          return isPruned ? "#94a3b8" : "#f59e0b";
        }
        if (isPruned) return "#cbd5e1";
        if (d.data.id === "__VIRTUAL_ROOT__") return "#3b82f6";
        return "#e5e7eb";
      })
      .attr("stroke-width", (d) => {
        const isPruned = prunedNodes.has(d.data.uniqueId);
        if (isPruned) return 1;
        if (props.targetDependency && d.data.id === props.targetDependency)
          return 2;
        return 1;
      })
      .attr("stroke-dasharray", (d) => {
        // Add dashed border for pruned duplicates
        const isPruned = prunedNodes.has(d.data.uniqueId);
        return isPruned ? "2,2" : "none";
      })
      .attr("opacity", (d) => {
        const isPruned = prunedNodes.has(d.data.uniqueId);
        return isPruned ? 0.7 : 1;
      });

    /**
     * Add text labels with enhanced styling
     */
    node
      .append("text")
      .attr("dy", "0.32em")
      .attr("x", (d) => {
        const text = d.data.id === "__VIRTUAL_ROOT__" ? "ROOT" : d.data.id;
        const displayText =
          text.length > 25 ? `${text.substring(0, 22)}...` : text;
        const textWidth = Math.max(displayText.length * 8 + 16, 60);
        // Center text within the rectangle
        if (d.children) {
          return -textWidth / 2 - 20; // Center in left-side rect
        } else {
          return textWidth / 2 + 20; // Center in right-side rect
        }
      })
      .attr("text-anchor", "middle")
      .text((d) => {
        if (d.data.id === "__VIRTUAL_ROOT__") return "ROOT";
        // Truncate long dependency names for better layout
        const name = d.data.id;
        const isPruned = prunedNodes.has(d.data.uniqueId);
        const displayName =
          name.length > 25 ? `${name.substring(0, 22)}...` : name;
        // Add indicator for pruned nodes
        return isPruned ? `${displayName} (⋯)` : displayName;
      })
      .attr("font-size", (d) => {
        const isPruned = prunedNodes.has(d.data.uniqueId);
        if (isPruned) return "9px"; // Smaller font for pruned nodes
        if (props.targetDependency && d.data.id === props.targetDependency)
          return "13px";
        if (d.data.id === "__VIRTUAL_ROOT__") return "12px";
        return "10px";
      })
      .attr("font-weight", (d) => {
        const isPruned = prunedNodes.has(d.data.uniqueId);
        if (isPruned) return "normal"; // Normal weight for pruned nodes
        if (props.targetDependency && d.data.id === props.targetDependency)
          return "bold";
        if (d.data.id === "__VIRTUAL_ROOT__") return "bold";
        return d.children ? "600" : "normal";
      })
      .attr("fill", (d) => {
        const isPruned = prunedNodes.has(d.data.uniqueId);
        if (isPruned) return "#64748b"; // Muted text color for pruned nodes
        if (props.targetDependency && d.data.id === props.targetDependency)
          return "#92400e";
        if (d.data.id === "__VIRTUAL_ROOT__") return "#1e40af";
        return "#374151";
      })
      .attr("opacity", (d) => {
        const isPruned = prunedNodes.has(d.data.uniqueId);
        return isPruned ? 0.8 : 1;
      });

    // Dynamically sized and aligned dev/prod badge (small rectangle with text) next to the label
    // Only show the badge for the first dependency node (depth === 1, not virtual root)
    node
      .append("rect")
      .filter(
        (d) =>
          (d.data.dev ?? d.data.prod) &&
          d.depth === 1 &&
          d.data.id !== "__VIRTUAL_ROOT__",
      )
      .attr("x", (d) => {
        // Place badge just after the text label, with extra spacing
        const text = d.data.id === "__VIRTUAL_ROOT__" ? "ROOT" : d.data.id;
        const displayText =
          text.length > 25 ? `${text.substring(0, 22)}...` : text;
        const textWidth = Math.max(displayText.length * 8 + 16, 60);
        // Always place badge to the right of the label rect
        return (d.children ? -textWidth - 32 : 8) + textWidth;
      })
      .attr("y", -7)
      .attr("width", (d) => {
        const badgeText = d.data.dev ? "DEV" : "PROD";
        return badgeText.length * 8;
      })
      .attr("height", 13)
      .attr("rx", 8)
      .attr("fill", (d) => (d.data.dev ? "#f3e8ff" : "#bbf7d0"))
      .attr("stroke", (d) => (d.data.dev ? "#a855f7" : "#22c55e"))
      // .attr("stroke-width", 1)
      .attr("opacity", 0.98)
      .style("filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.07))");

    node
      .append("text")
      .filter(
        (d) =>
          (d.data.dev ?? d.data.prod) &&
          d.depth === 1 &&
          d.data.id !== "__VIRTUAL_ROOT__",
      )
      .attr("x", (d) => {
        // Center badge text inside the badge
        const text = d.data.id === "__VIRTUAL_ROOT__" ? "ROOT" : d.data.id;
        const displayText =
          text.length > 25 ? `${text.substring(0, 22)}...` : text;
        const textWidth = Math.max(displayText.length * 8 + 16, 60);
        const badgeText = d.data.dev ? "DEV" : "PROD";
        const badgeWidth = badgeText.length * 8 + 1;
        // Always place badge to the right of the label rect, center text in badge
        return (d.children ? -textWidth - 32 : 8) + textWidth + badgeWidth / 2;
      })
      .attr("y", 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "7px")
      .attr("font-weight", "bold")
      .attr("fill", (d) => (d.data.dev ? "#a855f7" : "#15803d"))
      .text((d) => (d.data.dev ? "DEV" : "PROD"));

    // Add tooltips on hover
    node.append("title").text((d) => {
      const isTarget =
        props.targetDependency && d.data.id === props.targetDependency;
      const isPruned = prunedNodes.has(d.data.uniqueId);
      const targetText = isTarget ? " [TARGET DEPENDENCY]" : "";
      const instanceText =
        d.data.uniqueId !== d.data.id ? ` (Instance: ${d.data.uniqueId})` : "";
      const prunedText = isPruned
        ? "\n[PRUNED] - Children shown elsewhere in tree"
        : "";
      return `${d.data.id}${targetText}${instanceText}\nDepth: ${d.depth}\nChildren: ${d.children?.length ?? 0}${prunedText}`;
    });

    // Prepare legendProps for the legend component
    legendProps.value = {
      svgSelector: `#${props.id} svg`,
      marginLeft,
      x0,
      marginTop,
      legendSpace,
      hasPrunedNodes,
      prunedNodes,
      ...(props.targetDependency !== undefined && {
        targetDependency: props.targetDependency,
      }),
    };

    // ===========================================
    // 7. ADD LEGEND FOR BETTER UNDERSTANDING
    // ===========================================
    // Legend is now rendered by TreeChartLegend component
    if (props.targetDependency) {
      // Import and mount the legend component, passing required props
      // The legend will render itself into the SVG
      // (see TreeChartLegend.vue)
      //
      // Usage in template:
      // <TreeChartLegend ... />
    }
  } catch (error) {
    console.error("Error rendering TreeChart:", error);
    console.error("Data that caused the error:", props.data);

    // Display error message in the container
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    d3.select(`#${props.id}`)
      .append("div")
      .style("color", "red")
      .style("padding", "20px")
      .text(`Error rendering tree chart: ${errorMessage}`);
  }
});
</script>
<template>
  <div class="tree-chart-container">
    <div v-if="targetDependency" class="tree-chart-header">
      <h3 class="tree-chart-title">
        Dependency Tree for:
        <span class="target-name">{{ targetDependency }}</span>
      </h3>
      <p class="tree-chart-description">
        Shows all paths that lead to this dependency, with multiple instances
        for different parent relationships
      </p>
    </div>
    <div :id="id" class="tree-chart"></div>
    <TreeChartLegend
      v-if="legendProps && legendProps.targetDependency"
      v-bind="legendProps"
    />
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
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
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
