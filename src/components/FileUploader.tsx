
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileProcessor } from '../utils/fileProcessor';

interface FileUploaderProps {
  onFileUploaded: (content: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUploaded }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    wordCount: number;
    size: string;
    fileType: string;
  } | null>(null);
  
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    // Validate file type - only TXT files now
    const isValidFile = file.type === 'text/plain' || file.name.endsWith('.txt');
    
    if (!isValidFile) {
      setError(FileProcessor.getErrorMessage('UNSUPPORTED_FILE_TYPE', file.name));
      return;
    }

    // Check file size (10MB limit for text files)
    if (file.size > 10 * 1024 * 1024) {
      setError('Die Datei ist zu groß. Bitte verwenden Sie eine TXT-Datei unter 10MB.');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setError(null);
    setFileInfo(null);

    console.log('Processing text file:', file.name, file.type, file.size);

    try {
      setUploadProgress(20);
      
      const result = await FileProcessor.processFile(file);
      
      setUploadProgress(80);
      setFileInfo(result.metadata);
      setUploadProgress(100);

      console.log(`Successfully extracted ${result.content.length} characters from file`);
      
      toast({
        title: "Datei erfolgreich verarbeitet",
        description: `${result.metadata.wordCount} Wörter aus ${result.metadata.fileType} extrahiert`,
      });

      onFileUploaded(result.content);
      
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      const errorMessage = FileProcessor.getErrorMessage(errorCode, file.name);
      
      console.error('File processing error:', error);
      setError(errorMessage);
      
      toast({
        title: "Upload-Fehler",
        description: "Datei konnte nicht verarbeitet werden. Siehe Details unten.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file => 
      file.type === 'text/plain' || file.name.endsWith('.txt')
    );
    
    if (validFile) {
      handleFileUpload(validFile);
    } else {
      setError('Bitte wählen Sie eine TXT-Datei aus.');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card 
        className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Manuskript hochladen
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Ziehen Sie Ihre TXT-Datei hierher oder klicken Sie zum Auswählen
              </p>
              
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              
              <Button 
                asChild 
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  TXT-Datei auswählen
                </label>
              </Button>
            </div>
            
            <p className="text-xs text-slate-500">
              Unterstützte Formate: TXT (max. 10MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {isProcessing && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">Datei wird verarbeitet...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-blue-600">
                {uploadProgress < 30 && "Datei wird geladen..."}
                {uploadProgress >= 30 && uploadProgress < 80 && "Text wird extrahiert..."}
                {uploadProgress >= 80 && "Fertigstellung..."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Info */}
      {fileInfo && !isProcessing && !error && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Erfolgreich verarbeitet:</strong> {fileInfo.fileType}, {fileInfo.wordCount} Wörter ({fileInfo.size})
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="text-left">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="whitespace-pre-line">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Help Information */}
      <Alert className="bg-slate-50 border-slate-200">
        <Info className="h-4 w-4 text-slate-600" />
        <AlertDescription className="text-slate-700">
          <strong>Hinweis:</strong> PDF-Funktionalität wurde temporär entfernt. 
          Bitte kopieren Sie Ihren Text und speichern Sie ihn als TXT-Datei.
        </AlertDescription>
      </Alert>
    </div>
  );
};
