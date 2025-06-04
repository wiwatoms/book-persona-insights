
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIAnalysisServiceProps {
  onConfigured: (config: AIConfig) => void;
}

export interface AIConfig {
  apiKey: string;
  model: string;
}

const AVAILABLE_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Schnell & Günstig)', description: 'Optimal für Buchanalyse' },
  { value: 'gpt-4o', label: 'GPT-4o (Leistungsstark)', description: 'Detailliertere Analyse' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Günstig)', description: 'Basis-Analyse' }
];

export const AIAnalysisService: React.FC<AIAnalysisServiceProps> = ({ onConfigured }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateAndSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API-Key erforderlich",
        description: "Bitte geben Sie Ihren OpenAI API-Key ein.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);

    try {
      // Test API call to validate the key
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ungültiger API-Key');
      }

      // Save to localStorage
      localStorage.setItem('openai_api_key', apiKey);
      localStorage.setItem('openai_model', selectedModel);

      toast({
        title: "API-Key validiert",
        description: "Die Verbindung zu OpenAI wurde erfolgreich getestet.",
      });

      onConfigured({ apiKey, model: selectedModel });
    } catch (error) {
      toast({
        title: "Validierung fehlgeschlagen",
        description: "Der API-Key ist ungültig oder es gab einen Verbindungsfehler.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const isConfigured = !!localStorage.getItem('openai_api_key');

  if (isConfigured) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <Key className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          OpenAI API ist konfiguriert. Modell: {localStorage.getItem('openai_model') || 'gpt-4o-mini'}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4"
            onClick={() => {
              localStorage.removeItem('openai_api_key');
              localStorage.removeItem('openai_model');
              window.location.reload();
            }}
          >
            Neu konfigurieren
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Key className="w-5 h-5" />
          OpenAI API Konfiguration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Für die KI-Analyse benötigen Sie einen OpenAI API-Key. 
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">
              Hier erhalten Sie einen Key
            </a>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="model">KI-Modell auswählen</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div>
                      <div className="font-medium">{model.label}</div>
                      <div className="text-xs text-slate-500">{model.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="apiKey">OpenAI API-Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button 
            onClick={validateAndSave} 
            disabled={isValidating || !apiKey.trim()}
            className="w-full"
          >
            {isValidating ? 'Validiere...' : 'API-Key speichern & validieren'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
