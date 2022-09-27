import { scaleDiverging, scaleOrdinal } from 'd3-scale';
import { interpolateRdBu, schemeTableau10 } from 'd3-scale-chromatic';

export const colorScale_edges = scaleDiverging().interpolator(interpolateRdBu);
export const colorScale_clusters = scaleOrdinal().unknown("grey").range(schemeTableau10);