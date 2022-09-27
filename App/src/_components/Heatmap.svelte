<script>

    // Dependencies
    import { scaleBand } from 'd3-scale';
    import { select } from 'd3-selection';
    import { onMount } from 'svelte';
    import Dendogram from './Dendogram.svelte';

    // External JS
    import { zoomFunction, brushFunction, links2Matrix, hclust, clusters, dendogram } from '../_js/functions';
    import { colorScale_edges } from '../_js/scales';
    import { domain_min, domain_center, domain_max, linkage, threshold_clust, _data_2 } from '../stores.js';
   
    // Props , links and nodes can be called because they get their variable in app.svelte.
    export let nodes = [];
    export let links = [];
    // Matrix is just a regular dataframe, can be replaced with other input but check how it links to non matrix dat
    let matrix = links2Matrix(nodes, links);
    console.log(matrix);
    
    let othermatrix = $_data_2;
    $:console.log(othermatrix);
    // Dimensions
    const width = 500;
    const height = 500;
    // Scales
    const rowScale = scaleBand().domain(nodes.map(d => d.label)).range([0, height]);
    const colScale = scaleBand().domain(nodes.map(d => d.label)).range([0, width]);
    const bandWidth = colScale.bandwidth();

    $: {
        colorScale_edges.domain([$domain_min, $domain_center, $domain_max]);
        links = links;
    }

    // Clustering, the matrix is the actual data that is used for the hclust on line 37 (defined in 17)
    // in orer for the order of the matrix to switch the imported node names need to be the same as the one from the other matrix
    const h_clustering = {nodes: [], links: [], clusters: []};
    $: {
        if ($linkage !== 'none') {
            let clustering = hclust(othermatrix, $linkage);
            h_clustering.nodes = clustering.root.descendants();
            h_clustering.links = dendogram(h_clustering.nodes).links;
            h_clustering.clusters = clusters(clustering, $threshold_clust, nodes.length);
            // The line below might be a cause of the wrong colour cluster
            nodes.forEach((d, i) => d.cluster = h_clustering.clusters[d.id]);
            let order = clustering.root.index;
            nodes.sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
        } else {
            nodes.sort((a,b) => a.id - b.id);
        }
        rowScale.domain(nodes.map(d => d.label));
        colScale.domain(nodes.map(d => d.label));
        links = links; 
    }  

    // To compare the difference between h_clustering.nodes data and the normal nodes data
    // $:console.log(h_clustering.nodes);
    $:console.log(nodes);
    // $:console.log(h_clustering.links);
    $:console.log(links);
    $:console.log(h_clustering);




    // Binds
    let svg, g_heatmap;
    onMount(() => {
		select(svg).call(brushFunction(g_heatmap, () => !event.shiftKey));
        select(svg).call(zoomFunction(width, height, () => event.shiftKey, true));
	});

</script>
<!-- the data created in dendrogram.svelte is filled here with the h_clustering variable, so that needs to be adjusted -->
{#if $linkage !== "none"}
    <div>
        <Dendogram data={h_clustering} n={nodes.length} bandwidth={bandWidth}></Dendogram>
    </div>
{/if}
<div class="mb-3">
    <svg viewBox={`0 0 ${width} ${height}`} bind:this={svg}>
        <g bind:this={g_heatmap}>
            {#each links as cell}
                <rect x={colScale(cell.target)} 
                    y={rowScale(cell.source)} 
                    width={colScale.bandwidth()-.5} 
                    height={rowScale.bandwidth()-.5}
                    fill={cell.value ? colorScale_edges(cell.value) : "black"}
                    class="matrix-cell"
                    source={cell.source}
                    target={cell.target}>
                    <title> {`source: ${cell.source} - target: ${cell.target}`} </title>
                </rect>
            {/each}
        </g>
    </svg>
</div>