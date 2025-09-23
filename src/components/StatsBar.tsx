import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, TrendingUp, Thermometer, Droplets } from 'lucide-react';

interface StatsBarProps {
  totalFloats: number;
  totalProfiles: number;
  avgTemperature: number | null;
  avgSalinity: number | null;
}

export default function StatsBar({ totalFloats, totalProfiles, avgTemperature, avgSalinity }: StatsBarProps) {
  const [animatedFloats, setAnimatedFloats] = useState(0);
  const [animatedProfiles, setAnimatedProfiles] = useState(0);

  // Animate numbers
  useEffect(() => {
    const animateValue = (
      start: number,
      end: number,
      duration: number,
      setter: (value: number) => void
    ) => {
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (end - start) * progress);
        
        setter(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    };

    animateValue(0, totalFloats, 1000, setAnimatedFloats);
    animateValue(0, totalProfiles, 1200, setAnimatedProfiles);
  }, [totalFloats, totalProfiles]);

  const stats = [
    {
      icon: MapPin,
      value: animatedFloats,
      label: 'Active Floats',
      color: 'text-ocean-light',
      bgColor: 'bg-ocean-light/10'
    },
    {
      icon: TrendingUp,
      value: animatedProfiles,
      label: 'Profiles Found',
      color: 'text-ocean-green',
      bgColor: 'bg-ocean-green/10'
    },
    {
      icon: Thermometer,
      value: avgTemperature ? `${avgTemperature.toFixed(1)}°C` : '--',
      label: 'Avg Temperature',
      color: 'text-ocean-red',
      bgColor: 'bg-ocean-red/10'
    },
    {
      icon: Droplets,
      value: avgSalinity ? avgSalinity.toFixed(2) : '--',
      label: 'Avg Salinity (PSU)',
      color: 'text-ocean-blue',
      bgColor: 'bg-ocean-blue/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card 
            key={index}
            className="ocean-glass border-2 relative overflow-hidden group hover:scale-105 transition-all duration-300 ocean-glow"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Gradient top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ocean-light via-ocean-green to-ocean-purple"></div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 ocean-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="p-6 text-center relative z-10">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-4`}>
                <IconComponent className={`w-6 h-6 ${stat.color}`} />
              </div>
              
              <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-ocean-light to-ocean-green bg-clip-text text-transparent">
                {stat.value}
              </div>
              
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}