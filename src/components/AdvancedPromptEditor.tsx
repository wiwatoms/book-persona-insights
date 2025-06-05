
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Code, RefreshCw, Save, AlertTriangle, Info, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  version: string;
  isDefault: boolean;
}

interface AdvancedPromptEditorProps {
  onPromptsChanged: (prompts: PromptTemplate[]) => void;
}

const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'analysis_standard',
    name: 'Standard Analyse',
    description: 'Standardprompt für die Buchanalyse mit ausgewogener Bewertung',
    systemPrompt: 'Du bist ein präziser Literaturkritiker. Antworte ausschließlich in gültigem JSON ohne zusätzlichen Text.',
    userPrompt: `Du bist ein Literatur-Kritiker und verhältst dich wie folgende Persona:

PERSONA: {archetypeName}
BESCHREIBUNG: {archetypeDescription}
DEMOGRAPHIK: {archetypeDemographics}
LESEGEWOHNHEITEN: {archetypeReadingPreferences}
PERSÖNLICHKEIT: {archetypePersonalityTraits}
MOTIVATIONEN: {archetypeMotivations}
PAIN POINTS: {archetypePainPoints}

Analysiere diesen Textabschnitt aus deiner Persona-Perspektive:

"{textChunk}"

Bewerte auf Skala 1-10 (Dezimalstellen erlaubt):
- Engagement: Wie fesselnd ist der Text?
- Stil: Wie gefällt dir der Schreibstil?
- Klarheit: Wie verständlich ist der Text?
- Tempo: Wie ist das Erzähltempo?
- Relevanz: Wie relevant ist der Inhalt für dich?

Schätze (0-1 als Dezimalzahl):
- Kaufwahrscheinlichkeit: Würdest du das Buch kaufen?
- Weiterempfehlungswahrscheinlichkeit: Würdest du es weiterempfehlen?

Review-Stimmung: positive, neutral oder negative

Gib 2-3 Marketing-Insights aus deiner Persona-Sicht.

Antworte NUR in diesem JSON-Format:
{
  "ratings": {
    "engagement": 0.0,
    "style": 0.0,
    "clarity": 0.0,
    "pacing": 0.0,
    "relevance": 0.0
  },
  "overallRating": 0.0,
  "feedback": "Dein detailliertes Feedback als Persona (max 150 Wörter)",
  "buyingProbability": 0.0,
  "recommendationLikelihood": 0.0,
  "expectedReviewSentiment": "positive/neutral/negative",
  "marketingInsights": ["Insight 1", "Insight 2"]
}`,
    temperature: 0.3,
    maxTokens: 800,
    version: '1.0',
    isDefault: true
  },
  {
    id: 'stream_of_thought',
    name: 'Stream of Thought',
    description: 'Prompt für Layer 1 Analyse - ungefilterte Gedanken und Emotionen',
    systemPrompt: 'Du bist ein Leser und denkst laut. Zeige deine spontanen, unzensierten Gedanken und Emotionen beim Lesen. Antworte nur in gültigem JSON.',
    userPrompt: `Du bist {archetypeName} und liest gerade diesen Textabschnitt. Denke laut und ungefiltert:

DEINE PERSONA:
- {archetypeDescription}
- Demografie: {archetypeDemographics}
- Lesegewohnheiten: {archetypeReadingPreferences}
- Persönlichkeit: {archetypePersonalityTraits}
- Motivationen: {archetypeMotivations}
- Pain Points: {archetypePainPoints}

TEXT ZUM LESEN:
"{textChunk}"

Zeige deine spontanen, unzensierten Gedanken beim Lesen. Sei emotional, fragmentiert, direkt. Als würdest du einem Freund erzählen, was dir durch den Kopf geht.

Antworte NUR in diesem JSON-Format:
{
  "rawThoughts": "Deine ungefilterten Gedanken beim Lesen (1-2 Absätze, sehr persönlich und direkt)",
  "emotionalReactions": ["Emotion 1", "Emotion 2", "Emotion 3"],
  "immediateQuotes": ["Direktes Zitat 1 aus deinen Gedanken", "Direktes Zitat 2"],
  "fragmentedInsights": ["Fragmentierter Gedanke 1", "Fragmentierter Gedanke 2"],
  "mood": "excited/bored/confused/engaged/frustrated/curious",
  "attentionLevel": 0-10,
  "personalResonance": 0-10
}`,
    temperature: 0.8,
    maxTokens: 1000,
    version: '1.0',
    isDefault: true
  },
  {
    id: 'analytical_insight',
    name: 'Analytische Insights',
    description: 'Prompt für Layer 2 Analyse - strukturierte Business-Insights',
    systemPrompt: 'Du bist ein objektiver Marktanalyst. Analysiere die Leserreaktion strukturiert und extrahiere actionable insights. Antworte nur in gültigem JSON.',
    userPrompt: `Analysiere objektiv diese Leserreaktion und extrahiere strukturierte Business-Insights:

ORIGINAL TEXT:
"{textChunk}"

LESER-PERSONA: {archetypeName}
{archetypeDescription}

ROHE LESERREAKTION (Layer 1):
{streamOfThoughtResult}

AUFGABE: Erstelle eine objektive, strukturierte Analyse für Buchvermarkter und Autoren.

Antworte NUR in diesem JSON-Format:
{
  "keyTakeaways": ["Wichtigste Erkenntnis 1", "Wichtigste Erkenntnis 2", "Wichtigste Erkenntnis 3"],
  "structuredFeedback": "Objektive Zusammenfassung der Stärken/Schwächen dieses Textabschnitts (100-150 Wörter)",
  "marketingOpportunities": ["Marketing-Chance 1", "Marketing-Chance 2"],
  "competitiveAdvantages": ["Wettbewerbsvorteil 1", "Wettbewerbsvorteil 2"],
  "riskFactors": ["Risikofaktor 1", "Risikofaktor 2"],
  "recommendedActions": ["Handlungsempfehlung 1", "Handlungsempfehlung 2"],
  "confidenceScore": 0-10
}`,
    temperature: 0.3,
    maxTokens: 1200,
    version: '1.0',
    isDefault: true
  }
];

export const AdvancedPromptEditor: React.FC<AdvancedPromptEditorProps> = ({
  onPromptsChanged
}) => {
  const [prompts, setPrompts] = useState<PromptTemplate[]>(DEFAULT_PROMPTS);
  const [selectedPromptId, setSelectedPromptId] = useState(DEFAULT_PROMPTS[0].id);
  const [editedPrompt, setEditedPrompt] = useState<PromptTemplate>(DEFAULT_PROMPTS[0]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved prompts from localStorage
    const savedPrompts = localStorage.getItem('custom_prompts');
    if (savedPrompts) {
      try {
        const parsed = JSON.parse(savedPrompts);
        setPrompts(parsed);
        setEditedPrompt(parsed[0] || DEFAULT_PROMPTS[0]);
      } catch (error) {
        console.warn('Failed to load saved prompts:', error);
      }
    }
  }, []);

  useEffect(() => {
    const selected = prompts.find(p => p.id === selectedPromptId);
    if (selected) {
      setEditedPrompt({ ...selected });
      setHasUnsavedChanges(false);
    }
  }, [selectedPromptId, prompts]);

  const updatePromptField = (field: keyof PromptTemplate, value: any) => {
    setEditedPrompt(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const savePrompt = () => {
    const updatedPrompts = prompts.map(p => 
      p.id === editedPrompt.id ? { ...editedPrompt } : p
    );
    
    setPrompts(updatedPrompts);
    localStorage.setItem('custom_prompts', JSON.stringify(updatedPrompts));
    onPromptsChanged(updatedPrompts);
    setHasUnsavedChanges(false);
    
    toast({
      title: "Prompt gespeichert",
      description: `"${editedPrompt.name}" wurde erfolgreich gespeichert.`
    });
  };

  const resetToDefault = () => {
    const defaultPrompt = DEFAULT_PROMPTS.find(p => p.id === editedPrompt.id);
    if (defaultPrompt) {
      setEditedPrompt({ ...defaultPrompt });
      setHasUnsavedChanges(true);
      
      toast({
        title: "Prompt zurückgesetzt",
        description: "Standard-Prompt wiederhergestellt."
      });
    }
  };

  const createNewPrompt = () => {
    const newPrompt: PromptTemplate = {
      id: `custom_${Date.now()}`,
      name: 'Neuer Prompt',
      description: 'Beschreibung hinzufügen...',
      systemPrompt: 'Du bist ein hilfreicher Assistent.',
      userPrompt: 'Bitte analysiere den folgenden Text: "{textChunk}"',
      temperature: 0.5,
      maxTokens: 800,
      version: '1.0',
      isDefault: false
    };

    const updatedPrompts = [...prompts, newPrompt];
    setPrompts(updatedPrompts);
    setSelectedPromptId(newPrompt.id);
    
    toast({
      title: "Neuer Prompt erstellt",
      description: "Sie können nun den neuen Prompt bearbeiten."
    });
  };

  const copyPrompt = () => {
    const copiedPrompt: PromptTemplate = {
      ...editedPrompt,
      id: `copy_${Date.now()}`,
      name: `${editedPrompt.name} (Kopie)`,
      isDefault: false
    };

    const updatedPrompts = [...prompts, copiedPrompt];
    setPrompts(updatedPrompts);
    setSelectedPromptId(copiedPrompt.id);
    
    toast({
      title: "Prompt kopiert",
      description: "Eine Kopie des Prompts wurde erstellt."
    });
  };

  const deletePrompt = () => {
    if (editedPrompt.isDefault) {
      toast({
        title: "Fehler",
        description: "Standard-Prompts können nicht gelöscht werden.",
        variant: "destructive"
      });
      return;
    }

    const updatedPrompts = prompts.filter(p => p.id !== editedPrompt.id);
    setPrompts(updatedPrompts);
    setSelectedPromptId(updatedPrompts[0]?.id || DEFAULT_PROMPTS[0].id);
    
    toast({
      title: "Prompt gelöscht",
      description: `"${editedPrompt.name}" wurde gelöscht.`
    });
  };

  const getVariableHelp = () => {
    return [
      '{archetypeName} - Name des Archetyps',
      '{archetypeDescription} - Beschreibung des Archetyps',
      '{archetypeDemographics} - Demografische Daten',
      '{archetypeReadingPreferences} - Lesegewohnheiten',
      '{archetypePersonalityTraits} - Persönlichkeitsmerkmale',
      '{archetypeMotivations} - Motivationen',
      '{archetypePainPoints} - Pain Points',
      '{textChunk} - Der zu analysierende Textabschnitt',
      '{streamOfThoughtResult} - Ergebnis der Stream-of-Thought Analyse (nur für Layer 2)'
    ];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Erweiterte Prompt-Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt Selection */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="prompt-select">Prompt auswählen</Label>
              <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {prompts.map(prompt => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                      {prompt.name} {prompt.isDefault && '(Standard)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={createNewPrompt}>
                <Code className="w-4 h-4 mr-2" />
                Neu
              </Button>
              <Button variant="outline" onClick={copyPrompt}>
                <Copy className="w-4 h-4 mr-2" />
                Kopieren
              </Button>
              {!editedPrompt.isDefault && (
                <Button variant="outline" onClick={deletePrompt}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Löschen
                </Button>
              )}
            </div>
          </div>

          {hasUnsavedChanges && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sie haben ungespeicherte Änderungen. Vergessen Sie nicht zu speichern!
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Grundeinstellungen</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="help">Hilfe</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prompt-name">Name</Label>
                  <input
                    id="prompt-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={editedPrompt.name}
                    onChange={(e) => updatePromptField('name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="prompt-version">Version</Label>
                  <input
                    id="prompt-version"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={editedPrompt.version}
                    onChange={(e) => updatePromptField('version', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="prompt-description">Beschreibung</Label>
                <Textarea
                  id="prompt-description"
                  value={editedPrompt.description}
                  onChange={(e) => updatePromptField('description', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature: {editedPrompt.temperature}</Label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editedPrompt.temperature}
                    onChange={(e) => updatePromptField('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Niedrig = konservativ, Hoch = kreativ
                  </p>
                </div>
                <div>
                  <Label htmlFor="max-tokens">Max Tokens: {editedPrompt.maxTokens}</Label>
                  <input
                    id="max-tokens"
                    type="range"
                    min="200"
                    max="2000"
                    step="100"
                    value={editedPrompt.maxTokens}
                    onChange={(e) => updatePromptField('maxTokens', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Maximale Antwortlänge
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompts" className="space-y-4">
              <div>
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={editedPrompt.systemPrompt}
                  onChange={(e) => updatePromptField('systemPrompt', e.target.value)}
                  rows={3}
                  placeholder="Systemanweisung für das AI-Modell..."
                />
                <p className="text-xs text-slate-600 mt-1">
                  Definiert das grundlegende Verhalten des AI-Modells
                </p>
              </div>

              <div>
                <Label htmlFor="user-prompt">User Prompt</Label>
                <Textarea
                  id="user-prompt"
                  value={editedPrompt.userPrompt}
                  onChange={(e) => updatePromptField('userPrompt', e.target.value)}
                  rows={12}
                  placeholder="Hauptprompt mit Variablen wie {archetypeName}..."
                />
                <p className="text-xs text-slate-600 mt-1">
                  Der Hauptprompt für die Analyse. Verwenden Sie Variablen in geschweiften Klammern.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="help" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Verfügbare Variablen:</strong>
                  <div className="mt-2 space-y-1">
                    {getVariableHelp().map((help, idx) => (
                      <div key={idx} className="text-sm font-mono bg-slate-100 p-1 rounded">
                        {help}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Prompt-Typen:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li><strong>Standard Analyse:</strong> Vollständige Buchbewertung mit Ratings</li>
                    <li><strong>Stream of Thought:</strong> Ungefilterte Gedanken (Layer 1)</li>
                    <li><strong>Analytische Insights:</strong> Strukturierte Business-Analyse (Layer 2)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tipps:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Verwenden Sie klare, spezifische Anweisungen</li>
                    <li>• Fordern Sie JSON-Antworten für strukturierte Daten</li>
                    <li>• Testen Sie neue Prompts mit verschiedenen Texten</li>
                    <li>• Niedrige Temperature für konsistente Ergebnisse</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button onClick={savePrompt} disabled={!hasUnsavedChanges}>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
              {editedPrompt.isDefault && (
                <Button variant="outline" onClick={resetToDefault}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Standard wiederherstellen
                </Button>
              )}
            </div>
            
            <Badge variant={editedPrompt.isDefault ? 'default' : 'secondary'}>
              {editedPrompt.isDefault ? 'Standard-Prompt' : 'Benutzerdefiniert'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
