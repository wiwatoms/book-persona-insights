
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
  const [extractedText, setExtractedText] = useState<string>('');
  const { toast } = useToast();

  const extractTextFromPdf = async (file: File): Promise<string> => {
    if (file.type === 'text/plain') {
      // Handle text files
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
      });
    }

    if (file.type === 'application/pdf') {
      // Handle PDF files using PDF.js
      try {
        // Load PDF.js dynamically
        const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        
        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        const totalPages = pdf.numPages;

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          setUploadProgress((pageNum / totalPages) * 90); // 90% for PDF processing
          
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += pageText + '\n\n';
        }

        return fullText.trim();
      } catch (error) {
        console.error('PDF processing error:', error);
        throw new Error('Failed to extract text from PDF. Please ensure the PDF contains selectable text.');
      }
    }

    throw new Error('Unsupported file type. Please upload a PDF or text file.');
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

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Datei zu groß",
        description: "Die Datei darf maximal 10 MB groß sein.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setUploadedFile(file);

    try {
      console.log('Starting file processing:', file.name, file.type, file.size);
      
      const content = await extractTextFromPdf(file);
      setUploadProgress(100);
      
      console.log('Extracted text length:', content.length);
      console.log('First 200 characters:', content.substring(0, 200));
      
      if (content.length < 100) {
        throw new Error('Der extrahierte Text ist zu kurz. Stellen Sie sicher, dass die PDF Text enthält.');
      }

      setExtractedText(content);
      
      toast({
        title: "Upload erfolgreich",
        description: `${file.name} wurde erfolgreich verarbeitet. ${content.length} Zeichen extrahiert.`,
      });

      onPdfUploaded(content);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload fehlgeschlagen",
        description: error instanceof Error ? error.message : "Beim Verarbeiten der Datei ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
      setUploadedFile(null);
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

  if (uploadedFile && !isProcessing && extractedText) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Datei erfolgreich verarbeitet
              </h3>
              <p className="text-green-600">{uploadedFile.name}</p>
              <p className="text-sm text-green-500">{extractedText.length} Zeichen extrahiert</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Textvorschau:</h4>
            <p className="text-sm text-slate-700 italic leading-relaxed max-h-40 overflow-y-auto">
              {extractedText.substring(0, 500)}...
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setUploadedFile(null);
              setExtractedText('');
            }}
          >
            Andere Datei hochladen
          </Button>
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
              <p className="text-sm text-slate-500">
                {uploadProgress < 90 ? 'PDF wird verarbeitet...' : 'Finalisierung...'}
              </p>
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
                <li>• Unterstützte Formate: PDF (mit Text), TXT</li>
                <li>• Maximale Dateigröße: 10 MB</li>
                <li>• Für beste Ergebnisse mindestens 1000 Wörter</li>
                <li>• PDF muss selektierbaren Text enthalten (keine Bilder)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
