import type { Plugin } from '@/codeclarity_components/organizations/analyzers/Plugin';
import * as lite from 'litegraph.js';
import * as d3 from 'd3';
import type { Ref } from 'vue';

export function setColor(slot: lite.INodeOutputSlot | lite.INodeInputSlot) {
    const color = d3.scaleSequential().domain([1, 10]).interpolator(d3.interpolateViridis);

    let code = 0;
    for (let i = 0; i < slot.name.length; i++) {
        code += slot.name.charCodeAt(i);
    }
    code = code % 10;
    console.log(slot.name, color(code));

    slot.color_off = color(code);
    slot.color_on = color(code);
}

export function getWidth() {
    return document.querySelector('#form')?.clientWidth ?? 0;
}

function getDepth(
    node: lite.SerializedLGraphNode<lite.LGraphNode>,
    links: Record<number, lite.LLink>,
    graph: lite.LGraph
): number {
    let depth = 0;
    for (const link in links) {
        if (links[link].target_id === node.id) {
            const source = graph.getNodeById(links[link].origin_id);
            if (source && source.type !== 'basic/string') {
                depth = Math.max(depth, getDepth(source.serialize(), links, graph) + 1);
            }
        }
    }
    return depth;
}

export function retrieveResult(
    serialized: lite.SerializedLGraphNode<lite.LGraphNode>[],
    links: Record<number, lite.LLink>,
    graphCopy: lite.LGraph,
    pluginsCopy: Plugin[],
    nodes: Map<string, lite.LGraphNode>
) {
    const order = new Map<string, number>();
    for (const node of serialized) {
        // Skip basic nodes
        if (
            node.type === 'basic/string' ||
            node.type === 'basic/number' ||
            node.type === 'basic/array'
        ) {
            continue;
        }
        order.set(node.properties['name'], getDepth(node, links, graphCopy));
    }

    const size = Math.max(...order.values());
    const arr = new Array<Array<object>>(size);
    for (const node of order) {
        if (arr[node[1]]) {
            arr[node[1]].push({
                name: node[0],
                version: nodes.get(node[0])?.properties['version'],
                config: pluginsCopy.find((plugin) => plugin.name === node[0])?.config
            });
        } else {
            arr[node[1]] = [
                {
                    name: node[0],
                    version: nodes.get(node[0])?.properties['version'],
                    config: pluginsCopy.find((plugin) => plugin.name === node[0])?.config
                }
            ];
        }
    }
    return arr;
}

export function createNode(
    title: string,
    element: Plugin,
    graph: Ref<lite.LGraph | undefined>,
    nodes: Map<string, lite.LGraphNode>,
    nodes_to_link: Map<string, string[]>
) {
    // Register a new type
    const new_type = class Basic extends lite.LGraphNode {
        constructor() {
            super();
            // Add inputs for configuration
            for (const conf in element.config) {
                let type = element.config[conf].type;
                if (type === 'Array<string>') {
                    type = 'array';
                }
                this.addInput(conf, type);
                const config_node = lite.LiteGraph.createNode('basic/' + type);
                config_node.title = conf;
                nodes.set(config_node.title, config_node);
                if (!nodes_to_link.has(title)) {
                    nodes_to_link.set(title, [config_node.title]);
                } else {
                    nodes_to_link.get(title)?.push(config_node.title);
                }
                graph.value?.add(config_node);
            }
            // Add inputs for dependencies
            for (const parent of element.depends_on) {
                const slot = this.addInput(parent, parent);
                setColor(slot);
            }
            // Add outputs for dependencies
            const slot = this.addOutput(title, title);
            setColor(slot);

            this.properties = {
                name: title,
                version: element.version,
                description: element.description
            };
            this.title = title;
        }
    };
    new_type.title = title;
    return new_type;
}
