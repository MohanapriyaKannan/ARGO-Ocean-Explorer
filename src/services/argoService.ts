import { OceanRegion, ArgoProfile, QueryResults, DepthProfile, ArgoFloat } from '@/types/argo';

export const oceanRegions: Record<string, OceanRegion> = {
  arabian_sea: {
    name: 'Arabian Sea',
    bounds: [[8, 50], [27, 80]],
    center: [17.5, 65],
    color: '#3b82f6',
    characteristics: {
      avgTemp: 28.5,
      avgSalinity: 36.2,
      depth: 4652,
      description: 'Warm, highly saline waters with strong monsoon influence',
      currents: 'Southwest and Northeast Monsoon currents',
      features: 'High evaporation rates, seasonal upwelling'
    }
  },
  bay_of_bengal: {
    name: 'Bay of Bengal',
    bounds: [[5, 80], [22, 100]],
    center: [13.5, 90],
    color: '#10b981',
    characteristics: {
      avgTemp: 29.1,
      avgSalinity: 33.8,
      depth: 4694,
      description: 'Warm waters with lower salinity due to river discharge',
      currents: 'East India Coastal Current',
      features: 'Large freshwater input, cyclone formation area'
    }
  },
  indian_ocean: {
    name: 'Indian Ocean',
    bounds: [[-40, 20], [30, 120]],
    center: [-5, 70],
    color: '#8b5cf6',
    characteristics: {
      avgTemp: 26.8,
      avgSalinity: 35.1,
      depth: 3741,
      description: 'Third largest ocean with diverse temperature zones',
      currents: 'South Equatorial Current, Agulhas Current',
      features: 'Monsoon-driven circulation, warm pool region'
    }
  },
  equatorial_indian: {
    name: 'Equatorial Indian Ocean',
    bounds: [[-10, 40], [10, 100]],
    center: [0, 70],
    color: '#f59e0b',
    characteristics: {
      avgTemp: 28.2,
      avgSalinity: 34.9,
      depth: 3800,
      description: 'Warm equatorial waters with complex current systems',
      currents: 'Equatorial Counter Current, Equatorial Undercurrent',
      features: 'Indian Ocean Dipole, thermocline variations'
    }
  },
  southern_ocean: {
    name: 'Southern Ocean',
    bounds: [[-70, 0], [-40, 180]],
    center: [-55, 90],
    color: '#06b6d4',
    characteristics: {
      avgTemp: 4.2,
      avgSalinity: 34.7,
      depth: 3270,
      description: 'Cold, nutrient-rich waters surrounding Antarctica',
      currents: 'Antarctic Circumpolar Current',
      features: 'Sea ice formation, deep water formation, high nutrients'
    }
  }
};

export class ArgoService {
  generateQueryResults(query: string): QueryResults {
    const lowerQuery = query.toLowerCase();
    let targetOcean = 'indian_ocean';
    let profileCount = 8 + Math.floor(Math.random() * 12);
    
    // Determine target ocean based on query
    if (lowerQuery.includes('arabian sea') || lowerQuery.includes('arabian')) {
      targetOcean = 'arabian_sea';
      profileCount = Math.floor(profileCount * 0.7);
    } else if (lowerQuery.includes('bay of bengal') || lowerQuery.includes('bengal')) {
      targetOcean = 'bay_of_bengal';
      profileCount = Math.floor(profileCount * 0.8);
    } else if (lowerQuery.includes('equator') || lowerQuery.includes('equatorial')) {
      targetOcean = 'equatorial_indian';
      profileCount = Math.floor(profileCount * 0.9);
    } else if (lowerQuery.includes('southern ocean') || lowerQuery.includes('southern') || lowerQuery.includes('antarctic')) {
      targetOcean = 'southern_ocean';
      profileCount = Math.floor(profileCount * 0.6);
    } else if (lowerQuery.includes('indian ocean') || lowerQuery.includes('indian')) {
      targetOcean = 'indian_ocean';
    }

    const oceanData = oceanRegions[targetOcean];
    const profiles = this.generateOceanSpecificProfiles(targetOcean, profileCount);
    
    const floats: ArgoFloat[] = profiles.map(p => ({
      id: p.floatId,
      lat: p.location.lat,
      lon: p.location.lon,
      parameters: ['temperature', 'salinity', 'pressure'],
      ocean: targetOcean
    }));

    return {
      profiles,
      floatLocations: floats,
      summary: {
        avgTemperature: oceanData.characteristics.avgTemp + (Math.random() - 0.5) * 2,
        avgSalinity: oceanData.characteristics.avgSalinity + (Math.random() - 0.5) * 0.5,
        count: profileCount,
        ocean: targetOcean
      }
    };
  }

  generateOceanSpecificProfiles(oceanKey: string, count: number): ArgoProfile[] {
    const ocean = oceanRegions[oceanKey];
    const profiles: ArgoProfile[] = [];
    
    for (let i = 0; i < count; i++) {
      const floatId = `WMO${5900000 + Math.floor(Math.random() * 10000)}`;
      
      // Generate location within ocean bounds
      const latRange = ocean.bounds[1][0] - ocean.bounds[0][0];
      const lonRange = ocean.bounds[1][1] - ocean.bounds[0][1];
      const lat = ocean.bounds[0][0] + Math.random() * latRange;
      const lon = ocean.bounds[0][1] + Math.random() * lonRange;
      
      profiles.push({
        floatId,
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        location: { lat, lon },
        profiles: {
          temp: this.generateOceanSpecificDepthProfile('temperature', ocean),
          sal: this.generateOceanSpecificDepthProfile('salinity', ocean)
        },
        ocean: oceanKey
      });
    }
    
    return profiles;
  }

  generateOceanSpecificDepthProfile(parameter: string, ocean: OceanRegion): DepthProfile[] {
    const profile: DepthProfile[] = [];
    const baseTemp = ocean.characteristics.avgTemp;
    const baseSal = ocean.characteristics.avgSalinity;
    
    for (let depth = 0; depth <= 2000; depth += 25) {
      let value: number;
      
      if (parameter === 'temperature') {
        // Ocean-specific temperature profiles
        if (ocean.name === 'Southern Ocean') {
          value = baseTemp - (depth / 200) * 1.5 + Math.random() * 1 - 0.5;
          value = Math.max(value, -1);
        } else if (ocean.name === 'Arabian Sea') {
          value = baseTemp - (depth / 150) * 2.2 + Math.random() * 1.5 - 0.75;
          value = Math.max(value, 3);
        } else if (ocean.name === 'Bay of Bengal') {
          value = baseTemp - (depth / 120) * 2.1 + Math.random() * 1.2 - 0.6;
          value = Math.max(value, 4);
        } else if (ocean.name === 'Equatorial Indian Ocean') {
          value = baseTemp - (depth / 110) * 2.3 + Math.sin(depth / 300) * 0.8 + Math.random() * 1 - 0.5;
          value = Math.max(value, 5);
        } else {
          value = baseTemp - (depth / 100) * 2 + Math.random() * 2 - 1;
          value = Math.max(value, 2);
        }
      } else {
        // Salinity profiles
        if (ocean.name === 'Bay of Bengal') {
          value = baseSal - 1 + Math.sin(depth / 400) * 0.8 + Math.random() * 0.3 - 0.15;
        } else if (ocean.name === 'Arabian Sea') {
          value = baseSal + Math.sin(depth / 300) * 0.6 + Math.random() * 0.2 - 0.1;
        } else if (ocean.name === 'Southern Ocean') {
          value = baseSal + Math.sin(depth / 600) * 0.3 + Math.random() * 0.15 - 0.075;
        } else {
          value = baseSal + Math.sin(depth / 500) * 0.5 + Math.random() * 0.2 - 0.1;
        }
      }
      
      profile.push({
        depth,
        value: parseFloat(value.toFixed(2)),
        qc: 1
      });
    }
    
    return profile;
  }

  generateResponseMessage(results: QueryResults, query: string): string {
    const { profiles, summary } = results;
    const oceanData = oceanRegions[summary.ocean];
    
    if (profiles.length === 0) {
      return "🔍 I couldn't find any ARGO data matching your criteria. Try adjusting your query or selecting a different ocean region.";
    }

    let response = `🌊 Found ${profiles.length} ARGO profiles in the ${oceanData.name}! `;
    
    response += `\n\n📊 **Data Summary:**\n`;
    response += `• Average Temperature: ${summary.avgTemperature.toFixed(1)}°C\n`;
    response += `• Average Salinity: ${summary.avgSalinity.toFixed(2)} PSU\n`;
    response += `• Ocean Depth: ~${oceanData.characteristics.depth}m\n\n`;
    
    response += `🔍 **Ocean Characteristics:**\n`;
    response += `${oceanData.characteristics.description}\n`;
    response += `• Main Currents: ${oceanData.characteristics.currents}\n`;
    response += `• Key Features: ${oceanData.characteristics.features}\n\n`;
    
    response += `📈 The data is now visualized on the map and charts below. Each float provides detailed temperature and salinity profiles from surface to 2000m depth.`;
    
    return response;
  }
}