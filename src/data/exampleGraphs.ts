import type { ServerGraph } from '../api';

export interface ExampleGraph {
  name: string;
  label: string;
  description: string;
  data: ServerGraph;
}

const socialNetwork: ServerGraph = {
  nodes: [
    { id: 'alice' },
    { id: 'bob' },
    { id: 'carol' },
    { id: 'dave' },
    { id: 'eve' },
    { id: 'frank' },
  ],
  edges: [
    { id: 'e1',  from: 'alice', to: 'bob',   probability: 0.95 },
    { id: 'e2',  from: 'alice', to: 'carol',  probability: 0.80 },
    { id: 'e3',  from: 'bob',   to: 'dave',   probability: 0.75 },
    { id: 'e4',  from: 'bob',   to: 'eve',    probability: 0.60 },
    { id: 'e5',  from: 'carol', to: 'dave',   probability: 0.85 },
    { id: 'e6',  from: 'carol', to: 'frank',  probability: 0.70 },
    { id: 'e7',  from: 'dave',  to: 'eve',    probability: 0.90 },
    { id: 'e8',  from: 'eve',   to: 'frank',  probability: 0.80 },
    { id: 'e9',  from: 'frank', to: 'alice',  probability: 0.55 },
  ],
};

const supplyChain: ServerGraph = {
  nodes: [
    { id: 'steel' },
    { id: 'silicon' },
    { id: 'plastic' },
    { id: 'supplier_a' },
    { id: 'supplier_b' },
    { id: 'supplier_c' },
    { id: 'factory_east' },
    { id: 'factory_west' },
    { id: 'quality_control' },
    { id: 'warehouse_north' },
    { id: 'warehouse_south' },
    { id: 'dist_1' },
    { id: 'dist_2' },
    { id: 'dist_3' },
    { id: 'retailer_a' },
    { id: 'retailer_b' },
    { id: 'retailer_c' },
    { id: 'retailer_d' },
  ],
  edges: [
    { id: 'sc01', from: 'steel',           to: 'supplier_a',      probability: 0.95 },
    { id: 'sc02', from: 'steel',           to: 'supplier_b',      probability: 0.80 },
    { id: 'sc03', from: 'silicon',         to: 'supplier_a',      probability: 0.85 },
    { id: 'sc04', from: 'silicon',         to: 'supplier_c',      probability: 0.90 },
    { id: 'sc05', from: 'plastic',         to: 'supplier_b',      probability: 0.75 },
    { id: 'sc06', from: 'plastic',         to: 'supplier_c',      probability: 0.88 },
    { id: 'sc07', from: 'supplier_a',      to: 'factory_east',    probability: 0.92 },
    { id: 'sc08', from: 'supplier_b',      to: 'factory_east',    probability: 0.78 },
    { id: 'sc09', from: 'supplier_b',      to: 'factory_west',    probability: 0.82 },
    { id: 'sc10', from: 'supplier_c',      to: 'factory_west',    probability: 0.95 },
    { id: 'sc11', from: 'factory_east',    to: 'quality_control', probability: 0.88 },
    { id: 'sc12', from: 'factory_west',    to: 'quality_control', probability: 0.91 },
    { id: 'sc13', from: 'quality_control', to: 'warehouse_north', probability: 0.97 },
    { id: 'sc14', from: 'quality_control', to: 'warehouse_south', probability: 0.94 },
    { id: 'sc15', from: 'warehouse_north', to: 'dist_1',          probability: 0.90 },
    { id: 'sc16', from: 'warehouse_north', to: 'dist_2',          probability: 0.85 },
    { id: 'sc17', from: 'warehouse_south', to: 'dist_2',          probability: 0.80 },
    { id: 'sc18', from: 'warehouse_south', to: 'dist_3',          probability: 0.93 },
    { id: 'sc19', from: 'dist_1',          to: 'retailer_a',      probability: 0.95 },
    { id: 'sc20', from: 'dist_1',          to: 'retailer_b',      probability: 0.88 },
    { id: 'sc21', from: 'dist_2',          to: 'retailer_b',      probability: 0.72 },
    { id: 'sc22', from: 'dist_2',          to: 'retailer_c',      probability: 0.91 },
    { id: 'sc23', from: 'dist_3',          to: 'retailer_c',      probability: 0.84 },
    { id: 'sc24', from: 'dist_3',          to: 'retailer_d',      probability: 0.97 },
  ],
};

export const EXAMPLE_GRAPHS: ExampleGraph[] = [
  {
    name: 'Social Network',
    label: 'Social Network',
    description: 'Trust relationships between six people',
    data: socialNetwork,
  },
  {
    name: 'Supply Chain',
    label: 'Supply Chain',
    description: 'Multi-tier supply chain from raw materials to retailers',
    data: supplyChain,
  },
];
