import { scaleDiverging } from 'd3-scale';
import { interpolateRdBu } from 'd3-scale-chromatic';

export const colorScale_edges = scaleDiverging().domain([-1,0,1]).interpolator(interpolateRdBu);
