import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArgoFloat, UserLocation } from '@/types/argo';
import { oceanRegions } from '@/services/argoService';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface OceanMapProps {
  floatLocations: ArgoFloat[];
  userLocation: UserLocation | null;
  oceanKey?: string;
}

export default function OceanMap({ floatLocations, userLocation, oceanKey }: OceanMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Add your Mapbox public token here (starts with pk.)
  const mapboxToken = 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNsOWM5Z2ZwYzBnYzQzcW1sMjNlYnl6eDgifQ.demo-token-replace-with-yours';

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const initMap = () => {
      try {
        mapboxgl.accessToken = mapboxToken;
        
        const map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [75, 10],
          zoom: 3,
          projection: 'mercator' as any
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', () => {
          // Add ocean regions
          Object.entries(oceanRegions).forEach(([key, region]) => {
            const bounds = region.bounds;
            const coordinates = [[
              [bounds[0][1], bounds[0][0]], // west, north
              [bounds[1][1], bounds[0][0]], // east, north
              [bounds[1][1], bounds[1][0]], // east, south
              [bounds[0][1], bounds[1][0]], // west, south
              [bounds[0][1], bounds[0][0]]  // close polygon
            ]];

            map.addSource(`ocean-region-${key}`, {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: coordinates
                },
                properties: {
                  name: region.name,
                  color: region.color,
                  ...region.characteristics
                }
              }
            });

            map.addLayer({
              id: `ocean-region-fill-${key}`,
              type: 'fill',
              source: `ocean-region-${key}`,
              paint: {
                'fill-color': region.color,
                'fill-opacity': 0.1
              }
            });

            map.addLayer({
              id: `ocean-region-line-${key}`,
              type: 'line',
              source: `ocean-region-${key}`,
              paint: {
                'line-color': region.color,
                'line-width': 3,
                'line-opacity': 0.8
              }
            });
          });

          setIsMapReady(true);
          console.log('🗺️ Mapbox initialized successfully');
        });

        map.on('click', (e) => {
          const features = map.queryRenderedFeatures(e.point);
          const oceanFeature = features.find(f => f.source?.toString().includes('ocean-region'));
          
          if (oceanFeature) {
            const props = oceanFeature.properties;
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`
                <div style="background: rgba(255,255,255,0.95); padding: 16px; border-radius: 8px; max-width: 300px;">
                  <h4 style="color: #0c4a6e; font-weight: 600; margin-bottom: 8px;">🌊 ${props.name}</h4>
                  <p style="font-size: 14px; margin-bottom: 12px;">${props.description}</p>
                  <div style="font-size: 12px; color: #64748b; line-height: 1.5;">
                    <div>🌡️ Avg Temperature: ${props.avgTemp}°C</div>
                    <div>💧 Avg Salinity: ${props.avgSalinity} PSU</div>
                    <div>📏 Avg Depth: ${props.depth}m</div>
                    <div>🌊 Currents: ${props.currents}</div>
                    <div>✨ Features: ${props.features}</div>
                  </div>
                </div>
              `)
              .addTo(map);
          }
        });

        mapRef.current = map;
      } catch (error) {
        console.error('❌ Error initializing Mapbox:', error);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setIsMapReady(false);
    };
  }, []);

  // Update user location
  useEffect(() => {
    if (!mapRef.current || !userLocation || !isMapReady) return;

    // Remove existing user location marker
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
    }

    // Create marker element
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: #dc2626;
      border: 3px solid white;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    // Add user location marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([userLocation.lon, userLocation.lat])
      .addTo(mapRef.current);

    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div style="background: rgba(255,255,255,0.95); padding: 16px; border-radius: 8px; max-width: 250px;">
          <h4 style="color: #dc2626; font-weight: 600; margin-bottom: 8px;">📍 Your Location</h4>
          <p style="font-size: 14px;">
            <strong>Coordinates:</strong> ${userLocation.lat.toFixed(4)}°N, ${userLocation.lon.toFixed(4)}°E
          </p>
          <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
            Map centered on your location for better ocean data exploration
          </p>
        </div>
      `);

    el.addEventListener('click', () => {
      popup.addTo(mapRef.current!);
    });

    userLocationMarkerRef.current = marker;

    // Center on user location
    mapRef.current.setCenter([userLocation.lon, userLocation.lat]);
    mapRef.current.setZoom(6);
  }, [userLocation, isMapReady]);

  // Update float locations
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current = [];

    if (!floatLocations || floatLocations.length === 0) return;

    const oceanData = oceanKey ? oceanRegions[oceanKey] : oceanRegions.indian_ocean;
    const bounds = new mapboxgl.LngLatBounds();

    // Add new markers
    floatLocations.forEach((float) => {
      // Create marker element
      const el = document.createElement('div');
      el.className = 'float-marker';
      el.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: ${oceanData.color};
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([float.lon, float.lat])
        .addTo(mapRef.current!);

      const popup = new mapboxgl.Popup({ offset: 15 })
        .setHTML(`
          <div style="background: rgba(255,255,255,0.95); padding: 16px; border-radius: 8px; max-width: 250px;">
            <h4 style="color: ${oceanData.color}; font-weight: 600; margin-bottom: 8px;">🛰️ Float ${float.id}</h4>
            <div style="font-size: 14px; line-height: 1.5;">
              <p><strong>Location:</strong> ${float.lat.toFixed(3)}°N, ${float.lon.toFixed(3)}°E</p>
              <p><strong>Ocean:</strong> ${oceanData.name}</p>
              <p><strong>Parameters:</strong> ${float.parameters.join(', ')}</p>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
              ✅ Active ARGO profiling float
            </p>
          </div>
        `);

      el.addEventListener('click', () => {
        popup.addTo(mapRef.current!);
      });

      markersRef.current.push(marker);
      bounds.extend([float.lon, float.lat]);
    });

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      if (userLocationMarkerRef.current) {
        const userPos = userLocationMarkerRef.current.getLngLat();
        bounds.extend([userPos.lng, userPos.lat]);
      }
      mapRef.current.fitBounds(bounds, { padding: 50 });
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
            <p className="text-sm">Loading Mapbox...</p>
          </div>
        </div>
      )}
      
      {!mapboxToken.includes('demo-token') ? null : (
        <div className="absolute bottom-4 left-4 z-[1000] bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-lg text-xs">
          Add your Mapbox token in OceanMap.tsx for full functionality
        </div>
      )}
    </div>
  );
}