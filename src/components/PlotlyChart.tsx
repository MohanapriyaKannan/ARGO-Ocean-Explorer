import { useEffect, useRef } from 'react';
// @ts-ignore - Plotly types may not be perfect
import Plotly from 'plotly.js/dist/plotly.min.js';
import { ArgoProfile } from '@/types/argo';

interface PlotlyChartProps {
  profiles: ArgoProfile[];
  type: 'temperature' | 'salinity';
  title: string;
}

export default function PlotlyChart({ profiles, type, title }: PlotlyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !profiles || profiles.length === 0) return;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    const traces = profiles.slice(0, 5).map((profile, idx) => {
      const data = type === 'temperature' ? profile.profiles.temp : profile.profiles.sal;
      
      return {
        x: data?.map(p => p.value) || [],
        y: data?.map(p => -p.depth) || [],
        mode: 'lines',
        name: `Float ${profile.floatId.slice(-4)}`,
        line: { 
          width: 3,
          color: colors[idx % colors.length]
        },
        hovertemplate: type === 'temperature' 
          ? 'Temp: %{x}°C<br>Depth: %{y}m<extra></extra>'
          : 'Salinity: %{x} PSU<br>Depth: %{y}m<extra></extra>'
      };
    });

    const layout = {
      title: {
        text: title,
        font: { color: 'rgba(255,255,255,0.9)', size: 16 }
      },
      xaxis: { 
        title: type === 'temperature' ? 'Temperature (°C)' : 'Salinity (PSU)',
        color: 'rgba(255,255,255,0.8)',
        gridcolor: 'rgba(255,255,255,0.2)'
      },
      yaxis: { 
        title: 'Depth (m)',
        color: 'rgba(255,255,255,0.8)',
        gridcolor: 'rgba(255,255,255,0.2)'
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0.1)',
      font: { color: 'rgba(255,255,255,0.8)' },
      legend: { 
        font: { color: 'rgba(255,255,255,0.8)' },
        bgcolor: 'rgba(0,0,0,0.3)'
      },
      margin: { t: 50, r: 50, b: 50, l: 60 }
    };

    const config = {
      responsive: true,
      displayModeBar: false
    };

    Plotly.newPlot(chartRef.current, traces, layout, config);

    return () => {
      if (chartRef.current) {
        Plotly.purge(chartRef.current);
      }
    };
  }, [profiles, type, title]);

  return (
    <div className="w-full h-[450px] rounded-lg overflow-hidden">
      <div ref={chartRef} className="w-full h-full" />
      {(!profiles || profiles.length === 0) && (
        <div className="flex items-center justify-center h-full ocean-glass rounded-lg">
          <div className="text-center text-muted-foreground">
            <div className="text-4xl mb-2">🌊</div>
            <p>No data available</p>
            <p className="text-sm">Run a query to see {type} profiles</p>
          </div>
        </div>
      )}
    </div>
  );
}