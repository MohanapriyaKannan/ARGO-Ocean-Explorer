import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/argo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Bot, User, Download, FileText, Thermometer, Droplets, Fish, Snowflake, Globe } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onExportData: (format: 'json' | 'csv') => void;
}

export default function ChatPanel({ messages, loading, error, onSendMessage, onExportData }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !loading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleQuickQuery = (query: string) => {
    if (!loading) {
      onSendMessage(query);
    }
  };

  const quickQueries = [
    { 
      text: 'Arabian Sea Temperature', 
      query: 'Show temperature profiles in Arabian Sea',
      icon: Thermometer,
      color: 'text-ocean-red'
    },
    { 
      text: 'Bay of Bengal Salinity', 
      query: 'Salinity data in Bay of Bengal',
      icon: Droplets,
      color: 'text-ocean-green'
    },
    { 
      text: 'Indian Ocean BGC', 
      query: 'BGC data in Indian Ocean',
      icon: Fish,
      color: 'text-ocean-blue'
    },
    { 
      text: 'Southern Ocean', 
      query: 'Southern Ocean conditions',
      icon: Snowflake,
      color: 'text-ocean-light'
    },
    { 
      text: 'Equatorial Data', 
      query: 'Equatorial Indian Ocean data',
      icon: Globe,
      color: 'text-ocean-purple'
    }
  ];

  return (
    <Card className="h-[650px] flex flex-col ocean-glass border-2 ocean-shimmer relative overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-xl font-semibold text-ocean-light mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Ocean Data Assistant
        </h3>
        
        {/* Quick Query Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickQueries.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickQuery(item.query)}
                disabled={loading}
                className="ocean-glass hover:bg-secondary/20 border-border/50 text-foreground"
              >
                <IconComponent className={`w-4 h-4 mr-2 ${item.color}`} />
                {item.text}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="mx-6 mt-4 p-4 ocean-glass rounded-lg border border-ocean-light/30 bg-ocean-light/10">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-ocean-light" />
            <span className="text-foreground">Processing your query...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 ocean-glass rounded-lg border border-ocean-red/30 bg-ocean-red/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-ocean-red rounded-full animate-pulse"></div>
            <span className="text-foreground">{error}</span>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="ocean-float">
            <div className="text-center p-8 ocean-glass rounded-2xl border border-border">
              <Bot className="w-12 h-12 text-ocean-light mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-foreground mb-2">Welcome to ARGO Ocean Data Explorer!</h4>
              <p className="text-muted-foreground mb-4">
                I can help you explore ocean temperature, salinity, BGC parameters, and float locations worldwide.
              </p>
              <div className="text-sm text-muted-foreground">
                <p className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-ocean-light rounded-full"></div>
                  Try asking: "Show me temperature profiles in the Arabian Sea"
                </p>
                <p className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-ocean-green rounded-full"></div>
                  "Compare salinity between different oceans"
                </p>
                <p className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-ocean-purple rounded-full"></div>
                  "What floats are active near my location?"
                </p>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-5 duration-300`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-ocean-light text-foreground ml-auto border-l-4 border-ocean-blue'
                  : 'bg-ocean-green/20 text-foreground mr-auto border-l-4 border-ocean-green'
              } ocean-glass shadow-lg`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.message}
              </div>
              <div className="mt-3 pt-2 border-t border-border/30 flex items-center gap-2 text-xs text-muted-foreground">
                {message.type === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-6 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-3 mb-4">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about ocean data..."
            disabled={loading}
            className="flex-1 ocean-glass border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground"
          />
          <Button 
            type="submit" 
            disabled={loading || !inputValue.trim()}
            className="bg-ocean-green hover:bg-ocean-green/80 text-foreground px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Export Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExportData('json')}
            className="ocean-glass border-border/50 text-foreground hover:bg-secondary/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExportData('csv')}
            className="ocean-glass border-border/50 text-foreground hover:bg-secondary/20"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
    </Card>
  );
}