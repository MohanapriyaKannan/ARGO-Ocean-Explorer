import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { ArgoFloat, UserLocation } from '@/types/argo';
import { oceanRegions } from '@/services/argoService';
import { MapPin } from 'lucide-react';

// TypeScript declaration for Google Maps
declare const google: any;

interface OceanMapProps {
  floatLocations: ArgoFloat[];
  userLocation: UserLocation | null;
  oceanKey?: string;
}

export default function OceanMap({ floatLocations, userLocation, oceanKey }: OceanMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userLocationMarkerRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: "YOUR_GOOGLE_MAPS_API_KEY", // Replace with your Google Maps API key
          version: "3.55",
          libraries: ["places", "geometry"]
        });

        await loader.load();

        const map = new google.maps.Map(mapContainer.current!, {
          center: { lat: 10, lng: 75 },
          zoom: 4,
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          styles: [
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#0c4a6e" }]
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#1e293b" }]
            }
          ]
        });

        // Add ocean regions as rectangles
        Object.entries(oceanRegions).forEach(([key, region]) => {
          const rectangle = new google.maps.Rectangle({
            bounds: {
              north: region.bounds[0][0],
              south: region.bounds[1][0], 
              east: region.bounds[1][1],
              west: region.bounds[0][1]
            },
            strokeColor: region.color,
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillColor: region.color,
            fillOpacity: 0.1,
            map: map
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="background: rgba(255,255,255,0.95); padding: 16px; border-radius: 8px; max-width: 300px;">
                <h4 style="color: #0c4a6e; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                  🌊 ${region.name}
                </h4>
                <p style="font-size: 14px; margin-bottom: 12px;">${region.characteristics.description}</p>
                <div style="font-size: 12px; color: #64748b; line-height: 1.5;">
                  <div>🌡️ Avg Temperature: ${region.characteristics.avgTemp}°C</div>
                  <div>💧 Avg Salinity: ${region.characteristics.avgSalinity} PSU</div>
                  <div>📏 Avg Depth: ${region.characteristics.depth}m</div>
                  <div>🌊 Currents: ${region.characteristics.currents}</div>
                  <div>✨ Features: ${region.characteristics.features}</div>
                </div>
              </div>
            `
          });

          rectangle.addListener('click', () => {
            infoWindow.setPosition(rectangle.getBounds()!.getCenter());
            infoWindow.open(map);
          });
        });

        mapRef.current = map;
        setIsMapReady(true);
        
        console.log('🗺️ Google Maps initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing Google Maps:', error);
      }
    };

    initMap();

    return () => {
      setIsMapReady(false);
    };
  }, []);

  // Update user location
  useEffect(() => {
    if (!mapRef.current || !userLocation || !isMapReady) return;

    // Remove existing user location marker
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setMap(null);
    }

    // Add user location marker
    const marker = new google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lon },
      map: mapRef.current,
      title: "Your Location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#dc2626',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      }
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="background: rgba(255,255,255,0.95); padding: 16px; border-radius: 8px; max-width: 250px;">
          <h4 style="color: #dc2626; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
            📍 Your Location
          </h4>
          <p style="font-size: 14px;">
            <strong>Coordinates:</strong> ${userLocation.lat.toFixed(4)}°N, ${userLocation.lon.toFixed(4)}°E
          </p>
          <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
            Map centered on your location for better ocean data exploration
          </p>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(mapRef.current, marker);
    });

    userLocationMarkerRef.current = marker;

    // Center on user location
    mapRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lon });
    mapRef.current.setZoom(6);
  }, [userLocation, isMapReady]);

  // Update float locations
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    if (!floatLocations || floatLocations.length === 0) return;

    const oceanData = oceanKey ? oceanRegions[oceanKey] : oceanRegions.indian_ocean;
    const bounds = new google.maps.LatLngBounds();

    // Add new markers
    floatLocations.forEach((float) => {
      const marker = new google.maps.Marker({
        position: { lat: float.lat, lng: float.lon },
        map: mapRef.current!,
        title: `Float ${float.id}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: oceanData.color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="background: rgba(255,255,255,0.95); padding: 16px; border-radius: 8px; max-width: 250px;">
            <h4 style="color: ${oceanData.color}; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              🛰️ Float ${float.id}
            </h4>
            <div style="font-size: 14px; line-height: 1.5;">
              <p><strong>Location:</strong> ${float.lat.toFixed(3)}°N, ${float.lon.toFixed(3)}°E</p>
              <p><strong>Ocean:</strong> ${oceanData.name}</p>
              <p><strong>Parameters:</strong> ${float.parameters.join(', ')}</p>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
              ✅ Active ARGO profiling float
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: float.lat, lng: float.lon });
    });

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      if (userLocationMarkerRef.current) {
        bounds.extend(userLocationMarkerRef.current.getPosition()!);
      }
      mapRef.current.fitBounds(bounds);
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
            <p className="text-sm">Loading Google Maps...</p>
          </div>
        </div>
      )}
    </div>
  );
}