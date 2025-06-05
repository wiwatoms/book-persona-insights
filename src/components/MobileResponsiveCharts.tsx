import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useMobile } from '@/hooks/use-mobile';

interface MobileResponsiveBarChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey?: string;
  name?: string;
  className?: string;
  categories?: string[];
  colors?: string[];
}

export const MobileResponsiveBarChart: React.FC<MobileResponsiveBarChartProps> = ({
  data,
  xAxisKey,
  yAxisKey,
  name,
  className,
  categories = [],
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']
}) => {
  const isMobile = useMobile();
  
  // Mobile optimizations
  const displayData = isMobile && data.length > 10 ? data.slice(0, 8) : data;
  
  // Get all numeric keys if categories not provided
  const dataKeys = categories.length > 0 ? categories : 
    Object.keys(data[0] || {}).filter(key => 
      key !== xAxisKey && typeof data[0]?.[key] === 'number'
    );
  
  return (
    <div className={className}>
      <ChartContainer
        config={{}}
        className="h-[300px] w-full"
      >
        <BarChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xAxisKey}
            fontSize={isMobile ? 10 : 12}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            height={isMobile ? 60 : 40}
          />
          <YAxis fontSize={isMobile ? 10 : 12} width={isMobile ? 30 : 40} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {dataKeys.map((key, index) => (
            <Bar 
              key={key}
              dataKey={key} 
              fill={colors[index % colors.length]}
              name={key}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
};

interface MobileResponsiveLineChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey?: string;
  name?: string;
  className?: string;
  categories?: string[];
  colors?: string[];
}

export const MobileResponsiveLineChart: React.FC<MobileResponsiveLineChartProps> = ({
  data,
  xAxisKey,
  yAxisKey,
  name,
  className,
  categories = [],
  colors = ['#8884d8', '#82ca9d', '#ffc658']
}) => {
  const isMobile = useMobile();
  
  // Reduce data points if on mobile and too many points
  const displayData = isMobile && data.length > 12 ? 
    data.filter((_, index) => index % Math.ceil(data.length / 10) === 0) : 
    data;
  
  const dataKeys = categories.length > 0 ? categories : 
    Object.keys(data[0] || {}).filter(key => 
      key !== xAxisKey && typeof data[0]?.[key] === 'number'
    );
  
  return (
    <div className={className}>
      <ChartContainer
        config={{}}
        className="h-[300px] w-full"
      >
        <LineChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xAxisKey}
            fontSize={isMobile ? 10 : 12}
          />
          <YAxis fontSize={isMobile ? 10 : 12} width={isMobile ? 30 : 40} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {dataKeys.map((key, index) => (
            <Line 
              key={key}
              type="monotone" 
              dataKey={key} 
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              name={key}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
};

interface MobileResponsivePieChartProps {
  data: any[];
  category: string;
  className?: string;
  colors?: string[];
}

export const MobileResponsivePieChart: React.FC<MobileResponsivePieChartProps> = ({
  data,
  category,
  className,
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']
}) => {
  const isMobile = useMobile();
  
  // For mobile, reduce the number of slices by grouping smaller values
  let displayData = data;
  if (isMobile && data.length > 6) {
    const sortedData = [...data].sort((a, b) => b[category] - a[category]);
    const topItems = sortedData.slice(0, 5);
    const otherItems = sortedData.slice(5);
    const otherValue = otherItems.reduce((sum, item) => sum + item[category], 0);
    
    displayData = [
      ...topItems,
      { name: "Andere", [category]: otherValue }
    ];
  }
  
  return (
    <div className={className}>
      <ChartContainer
        config={{}}
        className="h-[300px] w-full"
      >
        <PieChart>
          <Pie
            data={displayData}
            dataKey={category}
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={isMobile ? 60 : 80}
            label={!isMobile}
          >
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ChartContainer>
    </div>
  );
};

interface MobileResponsiveAreaChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey?: string;
  name?: string;
  className?: string;
  categories?: string[];
  colors?: string[];
}

export const MobileResponsiveAreaChart: React.FC<MobileResponsiveAreaChartProps> = ({
  data,
  xAxisKey,
  yAxisKey,
  name,
  className,
  categories = [],
  colors = ['#8884d8', '#82ca9d', '#ffc658']
}) => {
  const isMobile = useMobile();
  
  // Reduce data points for mobile
  const displayData = isMobile && data.length > 12 ? 
    data.filter((_, index) => index % Math.ceil(data.length / 8) === 0) : 
    data;
  
  const dataKeys = categories.length > 0 ? categories : 
    Object.keys(data[0] || {}).filter(key => 
      key !== xAxisKey && typeof data[0]?.[key] === 'number'
    );
  
  return (
    <div className={className}>
      <ChartContainer
        config={{}}
        className="h-[300px] w-full"
      >
        <AreaChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xAxisKey}
            fontSize={isMobile ? 10 : 12}
          />
          <YAxis fontSize={isMobile ? 10 : 12} width={isMobile ? 30 : 40} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {dataKeys.map((key, index) => (
            <Area 
              key={key}
              type="monotone" 
              dataKey={key} 
              stackId="1"
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.6}
              name={key}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
};
