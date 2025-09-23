import { useState, useEffect } from 'react';
import { UserLocation } from '@/types/argo';
import { useToast } from '@/hooks/use-toast';

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      // Default to Indian Ocean center
      setUserLocation({ lat: 10, lon: 75 });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setUserLocation(location);
        setLoading(false);
        console.log('User location detected:', location);
        
        toast({
          title: "Location detected",
          description: `Map centered on your location (${location.lat.toFixed(2)}°N, ${location.lon.toFixed(2)}°E)`,
        });
      },
      (error) => {
        console.log('Location access denied or unavailable:', error);
        // Default to Indian Ocean center
        setUserLocation({ lat: 10, lon: 75 });
        setLoading(false);
        
        toast({
          title: "Location unavailable",
          description: "Using default location in the Indian Ocean",
          variant: "default",
        });
      },
      { 
        timeout: 10000, 
        enableHighAccuracy: true,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [toast]);

  return { userLocation, loading };
}