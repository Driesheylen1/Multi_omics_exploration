import { zoom } from 'd3-zoom';
import { select, selectAll } from 'd3-selection';
import { drag } from 'd3-drag';
import { brush } from 'd3-brush';
import { mean } from 'd3-array';
import { get } from 'svelte/store';
import { toHighlight, nodeFilter, simulationPause, transformX, transformY, transformK, maxDepth, clusterIndices } from '../stores.js';

export function link_filter(links) {
    let links_filtered;
    // Remove self links
    links_filtered = links.filter(k => k.source !== k.target);
    // Remove symmetric links
    links_filtered.forEach((el, i) => { el.referenceID = i });
    links_filtered.forEach((el, i, arr) => {
        const symLink = arr.filter(k => k.source === el.target && k.target === el.source);
        if (symLink.length != 0) {
            el.symmetricLink = symLink[0].referenceID;
        }
    });
    let toKeep = links_filtered.map(d => d.referenceID);
    links_filtered.forEach((el, i, nodes) => {
        if (toKeep.includes(el.referenceID)) {
            toKeep = toKeep.filter(k => k !== el.symmetricLink);
        }
    });
    links_filtered = links_filtered.filter(k => toKeep.includes(k.referenceID));
    
    return links_filtered;
}

export function zoomFunction(w, h, filter_function, storeParameters) {
    function zoomed({transform}) {
        select(this).select('g').attr("transform", transform);
        if (storeParameters) {
            transformX.set(transform.x);
            transformY.set(transform.y);
            transformK.set(transform.k);
            select(this).select('.selection')._groups[0][0].attributes.style.value = "display: none";
        }
    }
    return zoom()
        .filter(filter_function)
        .extent([[0, 0], [w, h]])
        .on("zoom", zoomed);
}

export function dragFunction (node, simulation) {
    simulationPause.set(false);
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        node.fx = event.subject.x;
        node.fy = event.subject.y;
    }
    function dragged(event) {
        node.fx = event.x;
        node.fy = event.y;
    }
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        node.fx = null;
        node.fy = null;
    }
    return drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

export function highlight(data, self) {
    const current = self.label;
    toHighlight.set([...new Set(data.filter(k => k.source.label === current || k.target.label === current).map(d => [d.source.label,d.target.label]).flat())]); 
}
export function fade() {
    toHighlight.set([]);
}

export function brushFunction(element, filter_function_brush) {
    const cells = select(element).selectAll('rect');
    function brushed({selection}) {
        if (selection) {
            let [[x0,y0],[x1,y1]] = selection;
            const filter_function = (d, i, nodes) => (x0 <= get(transformX) + (get(transformK)*Number(nodes[i].attributes.x.value)) && get(transformX) + (get(transformK)*(Number(nodes[i].attributes.x.value))) < x1 && y0 <= get(transformY) + (get(transformK)*(Number(nodes[i].attributes.y.value))) && get(transformY) + (get(transformK)*(Number(nodes[i].attributes.y.value))) < y1 || x0 <= get(transformX) + (get(transformK)*(Number(nodes[i].attributes.x.value) + Number(nodes[i].attributes.width.value))) && get(transformX) + (get(transformK)*(Number(nodes[i].attributes.x.value))) < x1 && y0 <= get(transformY) + (get(transformK)*(Number(nodes[i].attributes.y.value) + Number(nodes[i].attributes.height.value))) && get(transformY) + (get(transformK)*(Number(nodes[i].attributes.y.value))) < y1)
            cells.filter((d, i, nodes) => !filter_function(d, i, nodes)).attr('opacity', .3);
            cells.filter((d, i, nodes) => filter_function(d, i, nodes)).attr('opacity', 1);    
            nodeFilter.set([...new Set(Array.from(cells.filter((d, i, nodes) => filter_function(d, i, nodes))).map(d => [d.attributes.source.value, d.attributes.target.value]).flat())]);
        } else {
            cells.attr('opacity', 1);
            nodeFilter.set([]);
        }
    }
    return brush()
        .filter(filter_function_brush)
        .on("brush end", brushed);
}

export function links2Matrix(nodes, links) {
    const matrix = [];
    for (const source of nodes) {
        const row = [];
        for (const target of nodes) {
            const cell = links.filter(k => k.source === source.label && k.target === target.label);
            cell.length !== 0 ? row.push(cell[0].value) : row.push(0);
        }
        matrix.push(row);
    }
    return matrix;
}

//The other input data == the original data matrix, not the relation data. But check other data input
export function csvToArray(str, delimiter = ";") {

    // slice from \n index + 1 to the end of the text but not rading the end line (= blank values) in anymore, hence the -1
    //-1 very crucial for this!! 
    // use split to create an array of each csv value row
    // 
    const rows = str.slice(str.indexOf("\n") + 1, -1).split("\n");
  
    // Map the rows
    // split values from each row into an array
    // use headers.reduce to create an object
    // object properties derived from headers:values
    // the object passed as an element of the array
    const arr = rows.map(function (row) {
      const values = row.split(delimiter);
      const el = (function (object, index) {
        object = values[index];
        return object;
      }, {});
      return values;
    });

    // return the array
    return arr;
  }
  
export function cosine (a, b) {
    if (a.length !== b.length) return undefined;
    let n = a.length;
    let sum = 0;
    let sum_a = 0;
    let sum_b = 0;
    for (let i = 0; i < n; ++i) {
        sum += a[i] * b[i];
        sum_a += a[i] * a[i];
        sum_b += b[i] * b[i];
    }
    return Math.acos(sum / (Math.sqrt(sum_a) * Math.sqrt(sum_b)));
}

// Replacing cosine with "precomputed" works but then you need a square matrix 
export function hclust(adjMatrix, linkage) {
    let matrix = druid.Matrix.from(adjMatrix);
    let H = new druid.Hierarchical_Clustering(matrix, linkage, "precomputed");
    maxDepth.set(H.root["depth"])
    return H;
}

export function dendogram(nodes) {
    const leaves = nodes.filter(n => n.isLeaf);
    const links = [];
    leaves.forEach((node, i) => node.x = i)
    nodes.forEach((node, i) => {
        node.x = node.x ?? mean(node.leaves(), d => d.x);
        [node.left, node.right].forEach(child => {
        if (child) {
            links.push({
            "source": node,
            "target": child
            })
        }
        })
    })
    return {
        "nodes": nodes,
        "links":links,
    }
}

export function clusters(H, t, n) {
    const H_clusters = H.get_clusters(t, "depth");
    let I = Array.from({length: n});
    
    for (let cluster_index = 0; cluster_index < H_clusters.length; ++cluster_index) {
        H_clusters[cluster_index].forEach(({index}) => {
            if (H_clusters[cluster_index].length > 1) {
                I[index] = cluster_index
            } else {
                I[index] = null;
            }

        })    }
    
    clusterIndices.set([...new Set(I)].filter(k => k !== null));

    return I
}

export function pathGenerator(link, x, y, tf_x, tf_k) {
    const x1 = x(link.source.x * tf_k) + tf_x;
    const y1 = y(link.source["depth"]);
    const x2 = x(link.target.x * tf_k) +tf_x;
    const y2 = y(link.target["depth"]);
    const max_radius = 20;
    const x_dist = Math.abs(x1 - x2);
    const y_dist = Math.abs(y1 - y2);
    const radius = Math.min(x_dist, y_dist, max_radius);
    const cx = x1 < x2 ? radius : -radius;
    const counter_clockwise = cx < 0 ? 0 : 1;
    const xa = x2 - cx;
    return `M ${x1} ${y1} H ${xa} a ${radius} ${radius} 0 0 ${counter_clockwise} ${cx} ${radius} V ${y2}`;
}

export function toolTip (obj) {
    let tooltip = '';
    for (const [key, value] of Object.entries(obj)) {
        if (!(key === 'index' || key === 'x' || key === 'y' || key === 'vx' || key === 'vy' || key === 'fx' || key === 'fy')) {
           tooltip = tooltip + '\n' + `${key}: ${value}`;
        }
    }
    return tooltip
}