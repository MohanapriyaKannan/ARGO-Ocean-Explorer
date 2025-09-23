export interface OceanRegion {
  name: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  color: string;
  characteristics: {
    avgTemp: number;
    avgSalinity: number;
    depth: number;
    description: string;
    currents: string;
    features: string;
  };
}

export interface ArgoFloat {
  id: string;
  lat: number;
  lon: number;
  parameters: string[];
  ocean: string;
}

export interface DepthProfile {
  depth: number;
  value: number;
  qc: number;
}

export interface ArgoProfile {
  floatId: string;
  date: Date;
  location: { lat: number; lon: number };
  profiles: {
    temp: DepthProfile[];
    sal: DepthProfile[];
  };
  ocean: string;
}

export interface QueryResults {
  profiles: ArgoProfile[];
  floatLocations: ArgoFloat[];
  summary: {
    avgTemperature: number;
    avgSalinity: number;
    count: number;
    ocean: string;
  };
}

export interface ChatMessage {
  id: number;
  message: string;
  type: 'user' | 'assistant';
  timestamp: string;
  data?: QueryResults;
}

export interface UserLocation {
  lat: number;
  lon: number;
}