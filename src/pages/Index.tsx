import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Waves, Anchor } from 'lucide-react';
import ChatPanel from '@/components/ChatPanel';
import OceanMap from '@/components/OceanMap';
import StatsBar from '@/components/StatsBar';
import PlotlyChart from '@/components/PlotlyChart';
import { ArgoService } from '@/services/argoService';
import { ChatMessage, QueryResults } from '@/types/argo';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useToast } from '@/hooks/use-toast';

const argoService = new ArgoService();

export default function Index() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [queryResults, setQueryResults] = useState<QueryResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userLocation } = useUserLocation();
  const { toast } = useToast();

  const handleSendMessage = async (messageText: string) => {
    setLoading(true);
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      message: messageText,
      type: 'user',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Simulate realistic API delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      const results = argoService.generateQueryResults(messageText);
      setQueryResults(results);

      const responseMessage = argoService.generateResponseMessage(results, messageText);
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        message: responseMessage,
        type: 'assistant',
        timestamp: new Date().toISOString(),
        data: results
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      toast({
        title: "Query completed",
        description: `Found ${results.profiles.length} ARGO profiles`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: "Query failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = (format: 'json' | 'csv') => {
    if (!queryResults) {
      toast({
        title: "No data to export",
        description: "Please run a query first to generate data for export",
        variant: "destructive",
      });
      return;
    }

    if (format === 'json') {
      const jsonStr = JSON.stringify(queryResults, null, 2);
      downloadFile(jsonStr, 'argo_data.json', 'application/json');
    } else if (format === 'csv') {
      const csv = convertToCSV(queryResults.profiles);
      downloadFile(csv, 'argo_data.csv', 'text/csv');
    }

    toast({
      title: "Export successful",
      description: `Data exported as ${format.toUpperCase()}`,
    });
  };

  const convertToCSV = (profiles: any[]) => {
    const headers = ['float_id', 'date', 'lat', 'lon', 'depth', 'temperature', 'salinity', 'ocean'];
    const rows = [headers.join(',')];
    
    profiles.forEach(profile => {
      const tempData = profile.profiles.temp || [];
      tempData.forEach((point: any, idx: number) => {
        const salPoint = profile.profiles.sal[idx] || {};
        const row = [
          profile.floatId,
          profile.date.toISOString().split('T')[0],
          profile.location.lat.toFixed(4),
          profile.location.lon.toFixed(4),
          point.depth,
          point.value,
          salPoint.value || '',
          profile.ocean
        ];
        rows.push(row.join(','));
      });
    });
    
    return rows.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-deep via-ocean-blue to-ocean-purple p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 ocean-float">
          <Card className="ocean-glass border-2 relative overflow-hidden ocean-shimmer">
            <div className="p-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-ocean-light via-ocean-green to-ocean-purple bg-clip-text text-transparent flex items-center justify-center gap-4">
                <Waves className="w-12 h-12 text-ocean-light" />
                ARGO Ocean Data Explorer
                <Anchor className="w-12 h-12 text-ocean-green" />
              </h1>
              <p className="text-xl text-muted-foreground">
                AI-Powered Oceanographic Data Analysis & Visualization
              </p>
            </div>
          </Card>
        </div>

        {/* Stats Bar */}
        <StatsBar
          totalFloats={queryResults?.floatLocations?.length || 0}
          totalProfiles={queryResults?.summary?.count || 0}
          avgTemperature={queryResults?.summary?.avgTemperature || null}
          avgSalinity={queryResults?.summary?.avgSalinity || null}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Chat Panel */}
          <ChatPanel
            messages={messages}
            loading={loading}
            error={error}
            onSendMessage={handleSendMessage}
            onExportData={handleExportData}
          />

          {/* Map Panel */}
          <Card className="ocean-glass border-2 ocean-shimmer relative overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-ocean-light mb-4 flex items-center gap-2">
                <Anchor className="w-5 h-5" />
                ARGO Float Locations
              </h3>
              <OceanMap
                floatLocations={queryResults?.floatLocations || []}
                userLocation={userLocation}
                oceanKey={queryResults?.summary?.ocean}
              />
            </div>
          </Card>
        </div>

        {/* Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="ocean-glass border-2 ocean-shimmer relative overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-ocean-red mb-4 flex items-center gap-2">
                🌡️ Temperature Profiles
              </h3>
              <PlotlyChart
                profiles={queryResults?.profiles || []}
                type="temperature"
                title="🌡️ Temperature vs Depth Profiles"
              />
            </div>
          </Card>

          <Card className="ocean-glass border-2 ocean-shimmer relative overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-ocean-blue mb-4 flex items-center gap-2">
                🧂 Salinity Profiles
              </h3>
              <PlotlyChart
                profiles={queryResults?.profiles || []}
                type="salinity"
                title="🧂 Salinity vs Depth Profiles"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}