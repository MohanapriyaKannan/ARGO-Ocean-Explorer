import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArgoFloat, UserLocation } from '@/types/argo';
import { oceanRegions } from '@/services/argoService';
import { MapPin, Anchor, User } from 'lucide-react';

interface OceanMapProps {
  floatLocations: ArgoFloat[];
  userLocation: UserLocation | null;
  oceanKey?: string;
}

export default function OceanMap({ floatLocations, userLocation, oceanKey }: OceanMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      const map = L.map(mapContainer.current).setView([10, 75], 4);
      
      // Add beautiful ocean tile layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB',
        maxZoom: 18
      }).addTo(map);

      // Add ocean regions
      Object.entries(oceanRegions).forEach(([key, region]) => {
        const rectangle = L.rectangle(region.bounds, {
          color: region.color,
          weight: 3,
          fillOpacity: 0.1,
          dashArray: '5, 5'
        }).addTo(map);
        
        const popupContent = `
          <div class="bg-card/90 text-card-foreground p-4 rounded-lg border border-border backdrop-blur-sm">
            <h4 class="text-ocean-light font-semibold mb-2 flex items-center gap-2">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
              </svg>
              ${region.name}
            </h4>
            <p class="text-sm mb-3">${region.characteristics.description}</p>
            <div class="space-y-1 text-xs text-muted-foreground">
              <div>🌡️ Avg Temperature: ${region.characteristics.avgTemp}°C</div>
              <div>💧 Avg Salinity: ${region.characteristics.avgSalinity} PSU</div>
              <div>📏 Avg Depth: ${region.characteristics.depth}m</div>
              <div>🌊 Currents: ${region.characteristics.currents}</div>
              <div>✨ Features: ${region.characteristics.features}</div>
            </div>
          </div>
        `;
        
        rectangle.bindPopup(popupContent);
      });

      // Add legend
      const LegendControl = L.Control.extend({
        options: {
          position: 'bottomright'
        },
        onAdd: function() {
          const div = L.DomUtil.create('div', 'bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg');
          div.innerHTML = `
            <h4 class="text-card-foreground font-semibold mb-2">ARGO Floats</h4>
            <div class="flex items-center gap-2 text-sm text-card-foreground mb-1">
              <span class="w-3 h-3 bg-ocean-light rounded-full"></span>
              Float Location
            </div>
            <div class="flex items-center gap-2 text-sm text-card-foreground">
              <span class="w-3 h-3 bg-ocean-red rounded-full"></span>
              Your Location
            </div>
          `;
          return div;
        }
      });
      map.addControl(new LegendControl());

      mapRef.current = map;
      setIsMapReady(true);
      
      console.log('🗺️ Ocean map initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []);

  // Update user location
  useEffect(() => {
    if (!mapRef.current || !userLocation || !isMapReady) return;

    // Remove existing user location marker
    if (userLocationMarkerRef.current) {
      mapRef.current.removeLayer(userLocationMarkerRef.current);
    }

    // Create user location icon
    const userIcon = L.divIcon({
      html: `
        <div class="w-6 h-6 bg-ocean-red rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
          </svg>
        </div>
      `,
      className: 'ocean-glow',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Add user location marker
    const marker = L.marker([userLocation.lat, userLocation.lon], { 
      icon: userIcon 
    }).addTo(mapRef.current);

    marker.bindPopup(`
      <div class="bg-card/90 text-card-foreground p-4 rounded-lg border border-border backdrop-blur-sm">
        <h4 class="text-ocean-red font-semibold mb-2 flex items-center gap-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
          </svg>
          Your Location
        </h4>
        <p class="text-sm">
          <strong>Coordinates:</strong> ${userLocation.lat.toFixed(4)}°N, ${userLocation.lon.toFixed(4)}°E
        </p>
        <p class="text-xs text-muted-foreground mt-2">
          Map centered on your location for better ocean data exploration
        </p>
      </div>
    `);

    userLocationMarkerRef.current = marker;

    // Center on user location
    mapRef.current.setView([userLocation.lat, userLocation.lon], 6);
  }, [userLocation, isMapReady]);

  // Update float locations
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current!.removeLayer(marker);
    });
    markersRef.current = [];

    if (!floatLocations || floatLocations.length === 0) return;

    const oceanData = oceanKey ? oceanRegions[oceanKey] : oceanRegions.indian_ocean;

    // Add new markers
    floatLocations.forEach((float, index) => {
      const floatIcon = L.divIcon({
        html: `
          <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center ocean-glow" 
               style="background-color: ${oceanData.color}">
            <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([float.lat, float.lon], { 
        icon: floatIcon 
      }).addTo(mapRef.current!);

      marker.bindPopup(`
        <div class="bg-card/90 text-card-foreground p-4 rounded-lg border border-border backdrop-blur-sm">
          <h4 class="text-ocean-light font-semibold mb-2 flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
            Float ${float.id}
          </h4>
          <div class="space-y-1 text-sm">
            <p><strong>Location:</strong> ${float.lat.toFixed(3)}°N, ${float.lon.toFixed(3)}°E</p>
            <p><strong>Ocean:</strong> ${oceanData.name}</p>
            <p><strong>Parameters:</strong> ${float.parameters.join(', ')}</p>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            ✅ Active ARGO profiling float
          </p>
        </div>
      `);

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      if (userLocationMarkerRef.current) {
        group.addLayer(userLocationMarkerRef.current);
      }
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }

    console.log(`🗺️ Updated map with ${floatLocations.length} ARGO floats`);
  }, [floatLocations, oceanKey, isMapReady]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden shadow-2xl">
      {userLocation && (
        <div className="absolute top-4 right-4 z-[1000] ocean-glass rounded-full px-3 py-2 text-sm font-medium text-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4 text-ocean-red" />
          Your Location
        </div>
      )}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #1e40af 50%, #7c3aed 100%)' }}
      />
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center ocean-glass rounded-2xl">
          <div className="text-center text-foreground">
            <div className="animate-spin w-8 h-8 border-2 border-ocean-light border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Loading ocean map...</p>
          </div>
        </div>
      )}
    </div>
  );
}