
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ReaderArchetype } from './BookAnalyzer';
import { Users, Edit, Plus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ArchetypeManagerProps {
  onArchetypesReady: (archetypes: ReaderArchetype[]) => void;
  textPreview: string;
}

const DEFAULT_ARCHETYPES: ReaderArchetype[] = [
  {
    id: '1',
    name: 'Der pragmatische Entscheider',
    description: 'Business-orientierte Führungskraft, die konkrete Lösungen und praktische Anwendbarkeit sucht',
    demographics: '35-50 Jahre, Führungsposition, akademischer Hintergrund',
    readingPreferences: 'Effizienz-orientiert, überspringt Details, fokussiert auf Kernaussagen',
    personalityTraits: ['Analytisch', 'Ungeduldig', 'Ergebnisorientiert', 'Skeptisch'],
    motivations: ['Beruflicher Erfolg', 'Zeiteffizienz', 'Praktische Lösungen'],
    painPoints: ['Zeitdruck', 'Informationsüberfluss', 'Unklare Handlungsempfehlungen']
  },
  {
    id: '2',
    name: 'Die wissbegierige Entdeckerin',
    description: 'Akademisch interessierte Person, die tiefes Verständnis und neue Perspektiven sucht',
    demographics: '25-40 Jahre, Universitätsabschluss, beruflich oder privat lernorientiert',
    readingPreferences: 'Gründlich, analytisch, hinterfragt Aussagen, sammelt Referenzen',
    personalityTraits: ['Neugierig', 'Gründlich', 'Kritisch', 'Reflektiert'],
    motivations: ['Wissenserweiterung', 'Persönliche Entwicklung', 'Verstehen komplexer Zusammenhänge'],
    painPoints: ['Oberflächliche Darstellung', 'Fehlende Quellenangaben', 'Widersprüchliche Informationen']
  },
  {
    id: '3',
    name: 'Der emotionale Suchende',
    description: 'Person in einer Lebensphase des Wandels, die Inspiration und emotionale Verbindung sucht',
    demographics: '30-55 Jahre, persönliche oder berufliche Veränderungsphase',
    readingPreferences: 'Emotional ansprechend, Geschichte-orientiert, sucht persönliche Relevanz',
    personalityTraits: ['Empathisch', 'Hoffnungsvoll', 'Verletzlich', 'Inspirationssuchend'],
    motivations: ['Persönliche Transformation', 'Hoffnung finden', 'Nicht allein sein'],
    painPoints: ['Gefühl der Überforderung', 'Mangel an emotionaler Unterstützung', 'Unrealistische Versprechen']
  },
  {
    id: '4',
    name: 'Der skeptische Realitätsprüfer',
    description: 'Erfahrene Person, die bereits viele Ratgeber gelesen hat und kritisch prüft',
    demographics: '40-65 Jahre, erfahren in der Branche/im Thema, gebildet',
    readingPreferences: 'Kritisch, vergleicht mit bekannten Konzepten, sucht Originalität',
    personalityTraits: ['Skeptisch', 'Erfahren', 'Anspruchsvoll', 'Direkt'],
    motivations: ['Wirklich neue Erkenntnisse', 'Bestätigung/Widerlegung bestehender Annahmen'],
    painPoints: ['Wiederholung bekannter Inhalte', 'Oberflächlichkeit', 'Marketing-Sprech']
  },
  {
    id: '5',
    name: 'Der überforderter Anfänger',
    description: 'Person, die neu im Themenbereich ist und klare, einfache Anleitung benötigt',
    demographics: '20-35 Jahre, wenig Vorerfahrung, sucht ersten Einstieg',
    readingPreferences: 'Strukturiert, schrittweise, braucht viele Beispiele und Erklärungen',
    personalityTraits: ['Unsicher', 'Lernwillig', 'Überwältigt', 'Hoffnungsvoll'],
    motivations: ['Erste Schritte verstehen', 'Selbstvertrauen aufbauen', 'Schnelle Erfolgserlebnisse'],
    painPoints: ['Komplexität', 'Fachbegriffe', 'Mangel an konkreten Beispielen']
  }
];

export const ArchetypeManager: React.FC<ArchetypeManagerProps> = ({
  onArchetypesReady,
  textPreview
}) => {
  const [archetypes, setArchetypes] = useState<ReaderArchetype[]>(DEFAULT_ARCHETYPES);
  const [editingArchetype, setEditingArchetype] = useState<ReaderArchetype | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveArchetype = (archetype: ReaderArchetype) => {
    const updatedArchetypes = archetypes.map(a => 
      a.id === archetype.id ? archetype : a
    );
    setArchetypes(updatedArchetypes);
    setIsDialogOpen(false);
    setEditingArchetype(null);
    toast({
      title: "Archetyp gespeichert",
      description: `${archetype.name} wurde erfolgreich aktualisiert.`,
    });
  };

  const handleStartAnalysis = () => {
    onArchetypesReady(archetypes);
    toast({
      title: "Analyse gestartet",
      description: "Die Archetypen wurden konfiguriert. Die Analyse kann beginnen.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Text Preview */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Ihr Text (Vorschau)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 italic leading-relaxed">
            {textPreview}
          </p>
        </CardContent>
      </Card>

      {/* Archetypes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {archetypes.map((archetype) => (
          <Card key={archetype.id} className="hover:shadow-lg transition-shadow bg-white border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-800">{archetype.name}</CardTitle>
                <Dialog open={isDialogOpen && editingArchetype?.id === archetype.id} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingArchetype(archetype)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Archetyp bearbeiten: {archetype.name}</DialogTitle>
                    </DialogHeader>
                    <ArchetypeEditor 
                      archetype={archetype} 
                      onSave={handleSaveArchetype}
                      onCancel={() => {
                        setIsDialogOpen(false);
                        setEditingArchetype(null);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">{archetype.description}</p>
              
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Demografik
                </Label>
                <p className="text-sm text-slate-700 mt-1">{archetype.demographics}</p>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Persönlichkeitsmerkmale
                </Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {archetype.personalityTraits.slice(0, 3).map((trait) => (
                    <Badge key={trait} variant="secondary" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
                  {archetype.personalityTraits.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{archetype.personalityTraits.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center pt-6">
        <Button 
          onClick={handleStartAnalysis}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
        >
          <Check className="w-5 h-5 mr-2" />
          Analyse mit diesen Archetypen starten
        </Button>
      </div>
    </div>
  );
};

interface ArchetypeEditorProps {
  archetype: ReaderArchetype;
  onSave: (archetype: ReaderArchetype) => void;
  onCancel: () => void;
}

const ArchetypeEditor: React.FC<ArchetypeEditorProps> = ({ archetype, onSave, onCancel }) => {
  const [editedArchetype, setEditedArchetype] = useState<ReaderArchetype>(archetype);

  const handleSave = () => {
    onSave(editedArchetype);
  };

  const updateTraits = (value: string) => {
    const traits = value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    setEditedArchetype(prev => ({ ...prev, personalityTraits: traits }));
  };

  const updateMotivations = (value: string) => {
    const motivations = value.split(',').map(m => m.trim()).filter(m => m.length > 0);
    setEditedArchetype(prev => ({ ...prev, motivations }));
  };

  const updatePainPoints = (value: string) => {
    const painPoints = value.split(',').map(p => p.trim()).filter(p => p.length > 0);
    setEditedArchetype(prev => ({ ...prev, painPoints }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={editedArchetype.name}
            onChange={(e) => setEditedArchetype(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            value={editedArchetype.description}
            onChange={(e) => setEditedArchetype(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="demographics">Demografik</Label>
          <Textarea
            id="demographics"
            value={editedArchetype.demographics}
            onChange={(e) => setEditedArchetype(prev => ({ ...prev, demographics: e.target.value }))}
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="readingPreferences">Lesegewohnheiten</Label>
          <Textarea
            id="readingPreferences"
            value={editedArchetype.readingPreferences}
            onChange={(e) => setEditedArchetype(prev => ({ ...prev, readingPreferences: e.target.value }))}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="personalityTraits">Persönlichkeitsmerkmale (kommagetrennt)</Label>
          <Input
            id="personalityTraits"
            value={editedArchetype.personalityTraits.join(', ')}
            onChange={(e) => updateTraits(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="motivations">Motivationen (kommagetrennt)</Label>
          <Input
            id="motivations"
            value={editedArchetype.motivations.join(', ')}
            onChange={(e) => updateMotivations(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="painPoints">Pain Points (kommagetrennt)</Label>
          <Input
            id="painPoints"
            value={editedArchetype.painPoints.join(', ')}
            onChange={(e) => updatePainPoints(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button onClick={handleSave}>
          Speichern
        </Button>
      </div>
    </div>
  );
};
