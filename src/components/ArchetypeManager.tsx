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
    name: 'Der Reisende & Interkulturell Interessierte',
    description: 'Bildungsbürger zwischen 30-60 Jahren, der authentische Einblicke in fremde Kulturen sucht und GEO, ZEIT oder National Geographic liest',
    demographics: '30-60 Jahre, höhere Bildung, Vielreiser, kulturell aufgeschlossen',
    readingPreferences: 'Sucht kulturelle Tiefe, politische Entwicklungen, authentisches Alltagsleben. Bevorzugt atmosphärische Beschreibungen und kulturelle Details',
    personalityTraits: ['Weltgewandt', 'Neugierig', 'Reflektiert', 'Tolerant', 'Analytisch'],
    motivations: ['Kulturelles Verständnis', 'Horizonterweiterung', 'Authentische Perspektiven', 'Vorbereitung eigener Reisen'],
    painPoints: ['Oberflächliche Darstellungen', 'Klischeehafte Beschreibungen', 'Mangelnde Authentizität', 'Westliche Überheblichkeit']
  },
  {
    id: '2',
    name: 'Der Literarisch Interessierte Leser',
    description: 'Anspruchsvolle Leser:in zwischen 35-65 Jahren, die Suhrkamp, Hanser oder Fischer schätzt und Wert auf literarische Qualität legt',
    demographics: '35-65 Jahre, Universitätsabschluss, regelmäßige Buchkäufer, literarisch gebildet',
    readingPreferences: 'Schätzt sprachliche Finesse, Symbolik, vielschichtige Charaktere. Erwartet gesellschaftliche Relevanz und literarischen Anspruch',
    personalityTraits: ['Intellektuell', 'Ästhetisch sensibel', 'Geduldig', 'Kritisch', 'Sprachbewusst'],
    motivations: ['Literarischer Genuss', 'Sprachliche Schönheit', 'Gesellschaftliche Reflexion', 'Kulturelle Bildung'],
    painPoints: ['Triviale Sprache', 'Oberflächliche Charaktere', 'Mangelnde literarische Tiefe', 'Vorhersehbare Handlung']
  },
  {
    id: '3',
    name: 'Der Junge Weltversteher',
    description: 'Zukunftsoptimist zwischen 20-35 Jahren mit Interesse an globalem Denken, Feminismus und Identitätsfragen, aktiv auf BookTok und Podcasts',
    demographics: '20-35 Jahre, digital native, sozial engagiert, diversitätsbewusst',
    readingPreferences: 'Konsumiert über BookTok, Podcasts, Spiegel Bestseller. Sucht Perspektivenvielfalt und gesellschaftliche Relevanz',
    personalityTraits: ['Progressiv', 'Empathisch', 'Digital vernetzt', 'Aktivistisch', 'Identitätsbewusst'],
    motivations: ['Gesellschaftlichen Wandel verstehen', 'Feministische Perspektiven', 'Globale Gerechtigkeit', 'Identitätsfindung'],
    painPoints: ['Veraltete Denkweisen', 'Mangelnde Diversität', 'Patriarchale Strukturen', 'Kulturelle Ignoranz']
  },
  {
    id: '4',
    name: 'Der Migrationserfahrene & Orientverbundene',
    description: 'Deutsch-arabisch sozialisierte Person, die sich mit Themen wie Heimat, kulturellem Wandel und Identität zwischen den Welten auseinandersetzt',
    demographics: 'Vielschichtige Altersgruppe, Migrationshintergrund, mehrsprachig, kulturell hybrid',
    readingPreferences: 'Sucht persönlichen Zugang, Perspektivwechsel, authentische Darstellung der eigenen Kultur ohne Exotisierung',
    personalityTraits: ['Kulturell hybrid', 'Identitätssuchend', 'Authentizitätsbewusst', 'Empfindlich', 'Differenziert'],
    motivations: ['Kulturelle Repräsentation', 'Identitätsklärung', 'Heimatgefühl', 'Brückenbau zwischen Kulturen'],
    painPoints: ['Klischees und Stereotypen', 'Exotisierung', 'Vereinfachung komplexer Identitäten', 'Westlicher Blick']
  },
  {
    id: '5',
    name: 'Der Politisch Engagierte Bildungsbürger',
    description: 'Zwischen 30-70 Jahren, interessiert an Transformationsprozessen, Feminismus im Islam, Umwelt und Gesellschaft, liest politische Literatur und Essays',
    demographics: '30-70 Jahre, politisch interessiert, gesellschaftlich engagiert, informiert',
    readingPreferences: 'Konsumiert politische Literatur, Essays, Reportagen. Erwartet fundierte Analyse gesellschaftlicher Prozesse',
    personalityTraits: ['Politisch bewusst', 'Gesellschaftskritisch', 'Informiert', 'Engagiert', 'Meinungsbildend'],
    motivations: ['Gesellschaftliche Transformation verstehen', 'Politische Bildung', 'Feministische Perspektiven', 'Umweltbewusstsein'],
    painPoints: ['Unpolitische Darstellung', 'Oberflächliche Analyse', 'Mangelnde Gesellschaftskritik', 'Fehlende Lösungsansätze']
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
