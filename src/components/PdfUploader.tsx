
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PdfUploaderProps {
  onPdfUploaded: (content: string) => void;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({ onPdfUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const extractTextFromPdf = async (file: File): Promise<string> => {
    // Simulate PDF text extraction - in a real implementation, 
    // you would use a library like pdf-parse or pdf.js
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // This is a simulation - real PDF parsing would happen here
        const sampleText = `
Kapitel 1: Der Beginn einer Reise

Es war ein regnerischer Dienstag im November, als Sarah zum ersten Mal bemerkte, dass etwas in ihrem Leben grundlegend falsch war. Sie saß in ihrem kleinen Büro im 23. Stock und starrte durch das beschlagene Fenster auf die grauen Straßen von Berlin. Die Stadt wirkte müde, genau wie sie sich fühlte.

Die letzten fünf Jahre hatte sie bei der gleichen Beratungsfirma gearbeitet, jeden Tag die gleichen Routinen durchlaufen, die gleichen Meetings besucht, die gleichen Berichte geschrieben. Erfolg hatte sie durchaus - ihre Vorgesetzten lobten ihre Effizienz, ihre Kunden schätzten ihre Professionalität. Aber innerlich spürte sie eine wachsende Leere.

"Sarah, kannst du kurz in mein Büro kommen?" Die Stimme ihres Chefs riss sie aus ihren Gedanken. Herr Mueller stand in der Tür, das bekannte gestresste Lächeln auf dem Gesicht.

Kapitel 2: Unerwartete Wendungen

Das Gespräch mit ihrem Chef sollte alles verändern. Was als routinemäßige Besprechung begann, entwickelte sich zu einem Angebot, das sie nie erwartet hätte. Die Firma plante eine neue Niederlassung in Barcelona, und sie sollte das Projekt leiten.

"Barcelona?" wiederholte Sarah ungläubig. "Aber ich spreche kaum Spanisch."

"Das können Sie lernen", sagte Mueller mit einem Augenzwinkern. "Sie haben drei Monate Vorbereitungszeit. Wenn Sie wollen."

Sarah fühlte, wie ihr Herz schneller schlug. Barcelona - die Stadt ihrer Träume, von der sie seit ihrer Studentenzeit geträumt hatte. Aber da waren auch die Ängste: ein neues Land, eine neue Sprache, ein kompletter Neuanfang.

Kapitel 3: Die Entscheidung

An diesem Abend rief Sarah ihre beste Freundin Lisa an. "Ich weiß nicht, was ich tun soll", gestand sie. "Es ist eine riesige Chance, aber auch ein enormes Risiko."

"Wann hast du das letzte Mal etwas getan, was dir wirklich Angst gemacht hat?" fragte Lisa nach einer Pause.

Die Frage traf Sarah mitten ins Herz. Sie konnte sich nicht erinnern. Ihr Leben war zu einer Aneinanderreihung sicherer Entscheidungen geworden.

"Vielleicht ist das genau der Punkt", murmelte sie.

Diese Nacht lag Sarah wach und dachte über ihr Leben nach. Am nächsten Morgen stand ihre Entscheidung fest.
        `;
        
        resolve(sampleText);
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf') && !file.type.includes('text')) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte laden Sie eine PDF- oder Textdatei hoch.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setUploadedFile(file);

    try {
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const content = await extractTextFromPdf(file);
      
      toast({
        title: "Upload erfolgreich",
        description: `${file.name} wurde erfolgreich verarbeitet.`,
      });

      onPdfUploaded(content);
    } catch (error) {
      toast({
        title: "Upload fehlgeschlagen",
        description: "Beim Verarbeiten der Datei ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  if (uploadedFile && !isProcessing) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Datei erfolgreich hochgeladen
              </h3>
              <p className="text-green-600">{uploadedFile.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card
        className={`border-2 border-dashed transition-all ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Buchmanuskript hochladen
              </h3>
              <p className="text-slate-600 mb-4">
                Ziehen Sie Ihre PDF-Datei hierher oder klicken Sie zum Auswählen
              </p>
              <Button 
                variant="outline" 
                className="relative"
                disabled={isProcessing}
              >
                <FileText className="w-4 h-4 mr-2" />
                Datei auswählen
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div>
                  <h4 className="font-medium">Datei wird verarbeitet...</h4>
                  <p className="text-sm text-slate-600">
                    Text wird extrahiert und für die Analyse vorbereitet
                  </p>
                </div>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-slate-500 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-medium mb-1">Hinweise:</p>
              <ul className="space-y-1 text-xs">
                <li>• Unterstützte Formate: PDF, TXT</li>
                <li>• Maximale Dateigröße: 10 MB</li>
                <li>• Für beste Ergebnisse mindestens 1000 Wörter</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
