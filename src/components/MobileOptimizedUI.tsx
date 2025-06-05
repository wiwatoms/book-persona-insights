
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Eye, BarChart3, Smartphone } from 'lucide-react';

interface MobileOptimizedTextProps {
  title: string;
  content: string;
  maxPreviewLength?: number;
  variant?: 'default' | 'feedback' | 'insight';
}

export const MobileOptimizedText: React.FC<MobileOptimizedTextProps> = ({
  title,
  content,
  maxPreviewLength = 150,
  variant = 'default'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongText = content.length > maxPreviewLength;
  const previewText = isLongText ? content.substring(0, maxPreviewLength) + '...' : content;

  const getVariantStyles = () => {
    switch (variant) {
      case 'feedback':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'insight':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  return (
    <div className={`rounded-lg border p-3 ${getVariantStyles()}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{title}</h4>
        {isLongText && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Weniger
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                Mehr
              </>
            )}
          </Button>
        )}
      </div>
      
      <Collapsible open={isExpanded || !isLongText} onOpenChange={setIsExpanded}>
        <div className="text-sm">
          {!isExpanded && isLongText ? previewText : content}
        </div>
        {isLongText && !isExpanded && (
          <CollapsibleTrigger asChild>
            <Button variant="link" className="h-auto p-0 text-xs mt-1">
              Vollständigen Text anzeigen
            </Button>
          </CollapsibleTrigger>
        )}
      </Collapsible>
    </div>
  );
};

interface MobileChartWrapperProps {
  title: string;
  children: React.ReactNode;
  description?: string;
}

export const MobileChartWrapper: React.FC<MobileChartWrapperProps> = ({
  title,
  children,
  description
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {title}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'chart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('chart')}
              className="text-xs"
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Chart
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              Tabelle
            </Button>
          </div>
        </div>
        {description && (
          <p className="text-sm text-slate-600">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className={`${viewMode === 'chart' ? 'block' : 'hidden'}`}>
          <div className="overflow-x-auto">
            {children}
          </div>
        </div>
        {viewMode === 'table' && (
          <div className="text-sm text-slate-600">
            <p>Tabellenmodus - Detaillierte Daten würden hier angezeigt</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface MobilePaginatedContentProps {
  items: any[];
  itemsPerPage?: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  title: string;
}

export const MobilePaginatedContent: React.FC<MobilePaginatedContentProps> = ({
  items,
  itemsPerPage = 3,
  renderItem,
  title
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, items.length);
  const currentItems = items.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        <Badge variant="outline" className="text-xs">
          {startIndex + 1}-{endIndex} von {items.length}
        </Badge>
      </div>

      <div className="space-y-3">
        {currentItems.map((item, index) => renderItem(item, startIndex + index))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="text-xs"
          >
            Zurück
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={currentPage === i ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(i)}
                className="w-8 h-8 text-xs p-0"
              >
                {i + 1}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="text-xs"
          >
            Weiter
          </Button>
        </div>
      )}
    </div>
  );
};

interface MobileResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileResponsiveLayout: React.FC<MobileResponsiveLayoutProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="space-y-4 sm:space-y-6">
        {children}
      </div>
    </div>
  );
};

export const MobileOptimizedAlert: React.FC<{
  title: string;
  description: string;
  variant?: 'default' | 'destructive' | 'warning';
  icon?: React.ReactNode;
}> = ({ title, description, variant = 'default', icon }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongDescription = description.length > 100;

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getVariantStyles()}`}>
      <div className="flex items-start gap-3">
        {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{title}</h4>
            {isLongDescription && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 px-2 text-xs ml-2"
              >
                <Smartphone className="w-3 h-3" />
              </Button>
            )}
          </div>
          <Collapsible open={isExpanded || !isLongDescription}>
            <CollapsibleContent>
              <p className="text-sm mt-1 leading-relaxed">
                {isExpanded || !isLongDescription 
                  ? description 
                  : description.substring(0, 100) + '...'
                }
              </p>
            </CollapsibleContent>
            {isLongDescription && !isExpanded && (
              <CollapsibleTrigger asChild>
                <Button variant="link" className="h-auto p-0 text-xs mt-1">
                  Details anzeigen
                </Button>
              </CollapsibleTrigger>
            )}
          </Collapsible>
        </div>
      </div>
    </div>
  );
};
