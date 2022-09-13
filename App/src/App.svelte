<script>
	
	import Sidebar from './_components/Sidebar.svelte';
	import Navbar from './_components/Navbar.svelte';
	import Heatmap from './_components/Heatmap.svelte';
	import Network from './_components/Network.svelte';

	import { nodes, links_heatmap, links_network, renderVisuals, _data_2, myArray} from './stores.js';
	$:console.log($nodes);
	$:console.log($_data_2);
	$:console.log(Array.isArray($_data_2));
	// $:console.log(($myArray[2]));
	// the object values does the trick but can't be run on undefined value when data is not loaded yet
	// const profile = Object.values(person);
	// console.log(profile);

	// $:console.log($links)
	// $:console.log($links_network) #it's the same as the links_heatmap

	// $:console.log(nodes.label)

</script>
 
<div class="d-flex" id="wrapper">
	<Sidebar></Sidebar>
	<!-- Page Content -->
	<div id="page-content-wrapper">
		<Navbar></Navbar>
		<div class="container-fluid px-4">
			{#if $renderVisuals}
				<div class="row my-5">
					<div class="col-xl-6">
						<h3 class="fs-4 mb-3">Adjacency Matrix</h3>
						<Heatmap nodes={$nodes} links={$links_heatmap}></Heatmap>
					</div>
					<div class="col-xl-6">
						<h3 class="fs-4 mb-3">Graph</h3>
						<Network nodes={$nodes} links={$links_network}></Network>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	#wrapper {
		overflow-x: hidden;
	}
	#page-content-wrapper {
		min-width: 100vw;
	}
	@media (min-width: 768px) {
		#page-content-wrapper {
			min-width: 0;
			width: 100%;
		}
	}
</style>







