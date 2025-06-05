
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Users, Settings, Save, RefreshCw } from 'lucide-react';
import { ReaderArchetype } from './BookAnalyzer';
import { useToast } from '@/hooks/use-toast';

interface AdvancedArchetypeManagerProps {
  onArchetypesReady: (archetypes: ReaderArchetype[]) => void;
  textPreview: string;
  initialArchetypes?: ReaderArchetype[];
}

interface CustomizableArchetype {
  id: string;
  name: string;
  description: string;
  age: [number, number]; // age range
  gender: 'male' | 'female' | 'diverse' | 'any';
  education: string;
  income: string;
  location: string;
  readingFrequency: string;
  preferredGenres: string[];
  readingDevices: string[];
  personalityTraits: string[];
  motivations: string[];
  painPoints: string[];
  customNotes: string;
}

const DEFAULT_ARCHETYPES: CustomizableArchetype[] = [
  {
    id: 'young_professional',
    name: 'Junge Berufstätige',
    description: 'Karriereorientierte 25-35 Jährige mit wenig Zeit aber hohem Interesse an persönlicher Entwicklung',
    age: [25, 35],
    gender: 'any',
    education: 'Hochschulabschluss',
    income: '45.000-70.000€',
    location: 'Großstadt',
    readingFrequency: '2-3 Bücher pro Monat',
    preferredGenres: ['Ratgeber', 'Business', 'Biografien'],
    readingDevices: ['E-Reader', 'Smartphone', 'Hörbücher'],
    personalityTraits: ['Ehrgeizig', 'Neugierig', 'Zeitknapp', 'Technikaffin'],
    motivations: ['Karriereförderung', 'Persönliches Wachstum', 'Effizienz'],
    painPoints: ['Zeitmangel', 'Informationsüberfluss', 'Work-Life-Balance'],
    customNotes: ''
  },
  {
    id: 'book_enthusiast',
    name: 'Buchliebhaber',
    description: 'Passionierte Leser*innen aller Altersgruppen mit hoher Leseerfahrung',
    age: [30, 65],
    gender: 'any',
    education: 'Vielfältig',
    income: '35.000-60.000€',
    location: 'Verschiedene Orte',
    readingFrequency: '5+ Bücher pro Monat',
    preferredGenres: ['Belletristik', 'Sachbuch', 'Klassiker', 'Fantasy'],
    readingDevices: ['Buch (physisch)', 'E-Reader'],
    personalityTraits: ['Literaturliebend', 'Kritisch', 'Geduldig', 'Detailversessen'],
    motivations: ['Ästhetisches Vergnügen', 'Wissenserwerb', 'Eskapismus'],
    painPoints: ['Qualitätsmangel', 'Zu viel Marketing', 'Oberflächlichkeit'],
    customNotes: ''
  },
  {
    id: 'casual_reader',
    name: 'Gelegenheitsleser',
    description: 'Menschen, die sporadisch lesen und leicht zugängliche Inhalte bevorzugen',
    age: [20, 50],
    gender: 'any',
    education: 'Gemischt',
    income: '25.000-50.000€',
    location: 'Verschiedene Orte',
    readingFrequency: '1-2 Bücher pro Monat',
    preferredGenres: ['Unterhaltung', 'Populäre Sachbücher', 'Ratgeber'],
    readingDevices: ['Smartphone', 'Taschenbuch'],
    personalityTraits: ['Pragmatisch', 'Ungeduldig', 'Unterhaltsungssuchend'],
    motivations: ['Entspannung', 'Praktischer Nutzen', 'Trend-Teilnahme'],
    painPoints: ['Komplexe Sprache', 'Zu lange Texte', 'Hohe Preise'],
    customNotes: ''
  }
];

const GENRE_OPTIONS = [
  'Ratgeber', 'Business', 'Biografien', 'Belletristik', 'Sachbuch', 
  'Klassiker', 'Fantasy', 'Science-Fiction', 'Thriller', 'Romantik',
  'Geschichte', 'Philosophie', 'Psychologie', 'Gesundheit', 'Sport'
];

const DEVICE_OPTIONS = [
  'Buch (physisch)', 'E-Reader', 'Smartphone', 'Tablet', 'Hörbücher', 'Computer'
];

export const AdvancedArchetypeManager: React.FC<AdvancedArchetypeManagerProps> = ({
  onArchetypesReady,
  textPreview,
  initialArchetypes
}) => {
  const [archetypes, setArchetypes] = useState<CustomizableArchetype[]>(DEFAULT_ARCHETYPES);
  const [selectedArchetypeIndex, setSelectedArchetypeIndex] = useState(0);
  const [maxArchetypes, setMaxArchetypes] = useState(20);
  const { toast } = useToast();

  useEffect(() => {
    if (initialArchetypes) {
      // Convert existing archetypes to customizable format
      const customizable = initialArchetypes.map(arch => ({
        id: arch.id,
        name: arch.name,
        description: arch.description,
        age: [25, 45] as [number, number],
        gender: 'any' as const,
        education: 'Gemischt',
        income: '30.000-60.000€',
        location: 'Verschiedene Orte',
        readingFrequency: '2-4 Bücher pro Monat',
        preferredGenres: ['Ratgeber', 'Belletristik'],
        readingDevices: ['Buch (physisch)', 'E-Reader'],
        personalityTraits: arch.personalityTraits,
        motivations: arch.motivations,
        painPoints: arch.painPoints,
        customNotes: ''
      }));
      setArchetypes(customizable);
    }
  }, [initialArchetypes]);

  const updateArchetype = (index: number, field: keyof CustomizableArchetype, value: any) => {
    setArchetypes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addArchetype = () => {
    if (archetypes.length >= maxArchetypes) {
      toast({
        title: "Maximum erreicht",
        description: `Sie können maximal ${maxArchetypes} Archetypen erstellen.`,
        variant: "destructive"
      });
      return;
    }

    const newArchetype: CustomizableArchetype = {
      id: `custom_${Date.now()}`,
      name: `Neuer Archetypus ${archetypes.length + 1}`,
      description: 'Beschreibung hinzufügen...',
      age: [25, 45],
      gender: 'any',
      education: 'Gemischt',
      income: '30.000-50.000€',
      location: 'Verschiedene Orte',
      readingFrequency: '2-3 Bücher pro Monat',
      preferredGenres: ['Ratgeber'],
      readingDevices: ['Buch (physisch)'],
      personalityTraits: ['Neugierig'],
      motivations: ['Wissenserwerb'],
      painPoints: ['Zeitmangel'],
      customNotes: ''
    };

    setArchetypes(prev => [...prev, newArchetype]);
    setSelectedArchetypeIndex(archetypes.length);
  };

  const removeArchetype = (index: number) => {
    if (archetypes.length <= 1) {
      toast({
        title: "Mindestanzahl erreicht",
        description: "Sie benötigen mindestens einen Archetypus.",
        variant: "destructive"
      });
      return;
    }

    setArchetypes(prev => prev.filter((_, i) => i !== index));
    if (selectedArchetypeIndex >= index && selectedArchetypeIndex > 0) {
      setSelectedArchetypeIndex(selectedArchetypeIndex - 1);
    }
  };

  const addListItem = (index: number, field: 'preferredGenres' | 'readingDevices' | 'personalityTraits' | 'motivations' | 'painPoints', item: string) => {
    if (!item.trim()) return;
    
    updateArchetype(index, field, [...archetypes[index][field], item.trim()]);
  };

  const removeListItem = (index: number, field: 'preferredGenres' | 'readingDevices' | 'personalityTraits' | 'motivations' | 'painPoints', itemIndex: number) => {
    const items = [...archetypes[index][field]];
    items.splice(itemIndex, 1);
    updateArchetype(index, field, items);
  };

  const convertToReaderArchetypes = (): ReaderArchetype[] => {
    return archetypes.map(arch => ({
      id: arch.id,
      name: arch.name,
      description: arch.description,
      demographics: `Alter: ${arch.age[0]}-${arch.age[1]} Jahre, Geschlecht: ${arch.gender}, Bildung: ${arch.education}, Einkommen: ${arch.income}, Standort: ${arch.location}`,
      readingPreferences: `Liest ${arch.readingFrequency}, bevorzugt: ${arch.preferredGenres.join(', ')}, nutzt: ${arch.readingDevices.join(', ')}`,
      personalityTraits: arch.personalityTraits,
      motivations: arch.motivations,
      painPoints: arch.painPoints
    }));
  };

  const handleSaveArchetypes = () => {
    const readerArchetypes = convertToReaderArchetypes();
    onArchetypesReady(readerArchetypes);
    
    toast({
      title: "Archetypen gespeichert",
      description: `${archetypes.length} Archetypen für die Analyse vorbereitet.`
    });
  };

  const resetToDefaults = () => {
    setArchetypes(DEFAULT_ARCHETYPES);
    setSelectedArchetypeIndex(0);
    toast({
      title: "Zurückgesetzt",
      description: "Standard-Archetypen wiederhergestellt."
    });
  };

  const currentArchetype = archetypes[selectedArchetypeIndex];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-2">
          <Label htmlFor="max-archetypes">Maximale Anzahl Archetypen (1-20)</Label>
          <Slider
            id="max-archetypes"
            min={1}
            max={20}
            step={1}
            value={[maxArchetypes]}
            onValueChange={([value]) => setMaxArchetypes(value)}
            className="w-48"
          />
          <p className="text-sm text-slate-600">Aktuell: {archetypes.length} von {maxArchetypes}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Standard
          </Button>
          <Button onClick={addArchetype} disabled={archetypes.length >= maxArchetypes}>
            <Plus className="w-4 h-4 mr-2" />
            Hinzufügen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Archetype List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Archetypen ({archetypes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {archetypes.map((archetype, index) => (
              <div
                key={archetype.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedArchetypeIndex === index 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
                onClick={() => setSelectedArchetypeIndex(index)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{archetype.name}</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      {archetype.age[0]}-{archetype.age[1]} Jahre
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeArchetype(index);
                    }}
                    disabled={archetypes.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Archetype Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {currentArchetype?.name || 'Archetyp bearbeiten'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentArchetype && (
              <>
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={currentArchetype.name}
                      onChange={(e) => updateArchetype(selectedArchetypeIndex, 'name', e.target.value)}
                      placeholder="Archetyp-Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Geschlecht</Label>
                    <Select
                      value={currentArchetype.gender}
                      onValueChange={(value) => updateArchetype(selectedArchetypeIndex, 'gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Beliebig</SelectItem>
                        <SelectItem value="female">Weiblich</SelectItem>
                        <SelectItem value="male">Männlich</SelectItem>
                        <SelectItem value="diverse">Divers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Alter: {currentArchetype.age[0]} - {currentArchetype.age[1]} Jahre</Label>
                  <Slider
                    min={16}
                    max={80}
                    step={1}
                    value={currentArchetype.age}
                    onValueChange={(value) => updateArchetype(selectedArchetypeIndex, 'age', value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    value={currentArchetype.description}
                    onChange={(e) => updateArchetype(selectedArchetypeIndex, 'description', e.target.value)}
                    placeholder="Detaillierte Beschreibung des Archetyps..."
                    rows={3}
                  />
                </div>

                {/* Demographics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="education">Bildung</Label>
                    <Input
                      id="education"
                      value={currentArchetype.education}
                      onChange={(e) => updateArchetype(selectedArchetypeIndex, 'education', e.target.value)}
                      placeholder="z.B. Hochschulabschluss"
                    />
                  </div>
                  <div>
                    <Label htmlFor="income">Einkommen</Label>
                    <Input
                      id="income"
                      value={currentArchetype.income}
                      onChange={(e) => updateArchetype(selectedArchetypeIndex, 'income', e.target.value)}
                      placeholder="z.B. 40.000-60.000€"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Standort</Label>
                    <Input
                      id="location"
                      value={currentArchetype.location}
                      onChange={(e) => updateArchetype(selectedArchetypeIndex, 'location', e.target.value)}
                      placeholder="z.B. Großstadt"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reading-frequency">Lesefrequenz</Label>
                  <Input
                    id="reading-frequency"
                    value={currentArchetype.readingFrequency}
                    onChange={(e) => updateArchetype(selectedArchetypeIndex, 'readingFrequency', e.target.value)}
                    placeholder="z.B. 2-3 Bücher pro Monat"
                  />
                </div>

                {/* Lists */}
                {(['preferredGenres', 'readingDevices', 'personalityTraits', 'motivations', 'painPoints'] as const).map((field) => {
                  const labels = {
                    preferredGenres: 'Bevorzugte Genres',
                    readingDevices: 'Lesegeräte',
                    personalityTraits: 'Persönlichkeitsmerkmale',
                    motivations: 'Motivationen',
                    painPoints: 'Pain Points'
                  };

                  const options = field === 'preferredGenres' ? GENRE_OPTIONS : 
                               field === 'readingDevices' ? DEVICE_OPTIONS : undefined;

                  return (
                    <div key={field}>
                      <Label>{labels[field]}</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {currentArchetype[field].map((item, itemIndex) => (
                          <Badge
                            key={itemIndex}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeListItem(selectedArchetypeIndex, field, itemIndex)}
                          >
                            {item} ×
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {options ? (
                          <Select onValueChange={(value) => addListItem(selectedArchetypeIndex, field, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder={`${labels[field]} hinzufügen...`} />
                            </SelectTrigger>
                            <SelectContent>
                              {options.filter(option => !currentArchetype[field].includes(option)).map(option => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder={`${labels[field]} hinzufügen...`}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addListItem(selectedArchetypeIndex, field, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                <div>
                  <Label htmlFor="custom-notes">Zusätzliche Notizen</Label>
                  <Textarea
                    id="custom-notes"
                    value={currentArchetype.customNotes}
                    onChange={(e) => updateArchetype(selectedArchetypeIndex, 'customNotes', e.target.value)}
                    placeholder="Weitere spezifische Details oder Anmerkungen..."
                    rows={2}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button onClick={handleSaveArchetypes} size="lg" className="bg-green-600 hover:bg-green-700">
          <Save className="w-5 h-5 mr-2" />
          {archetypes.length} Archetypen für Analyse verwenden
        </Button>
      </div>

      {/* Info */}
      <Alert className="bg-blue-50 border-blue-200">
        <Settings className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Tipp:</strong> Je detaillierter Sie die Archetypen konfigurieren, desto präziser werden die Analyse-Ergebnisse. 
          Die Analyse berücksichtigt alle demografischen und psychografischen Merkmale.
        </AlertDescription>
      </Alert>
    </div>
  );
};
