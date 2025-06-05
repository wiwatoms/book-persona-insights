import React from 'react';
import { BarChart, LineChart, PieChart, DonutChart, AreaChart } from '@/components/ui/chart';
import { isMobile } from '@/hooks/use-mobile';

interface MobileResponsiveBarChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
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
  categories,
  colors
}) => {
  const mobile = isMobile();
  
  // Mobile optimizations
  const mobileConfig = mobile ? {
    padding: { left: 20, right: 20, top: 20, bottom: 50 },
    labelXFontSize: 10,
    labelYFontSize: 10,
    tickRotation: -45,
    barGap: 2
  } : {
    padding: { left: 40, right: 20, top: 10, bottom: 40 },
    labelXFontSize: 12,
    labelYFontSize: 12,
    tickRotation: 0,
    barGap: 4
  };
  
  // Reduce data points if on mobile and too many points
  const displayData = mobile && data.length > 10 ? data.slice(0, 8) : data;
  
  return (
    <div className={className}>
      <BarChart
        data={displayData}
        categories={categories || [yAxisKey]}
        index={xAxisKey}
        colors={colors || ['blue', 'cyan']}
        valueFormatter={(value) => `${value}`}
        yAxisWidth={mobile ? 30 : 40}
        showAnimation
        showLegend={!mobile || displayData.length < 5}
        showTooltip
        showXAxis
        showYAxis
        startEndOnly={mobile && displayData.length > 5}
        className="h-[300px]"
        customTooltip={({ payload }) => payload && payload.length ? (
          <div className="rounded-lg border bg-background p-2 shadow-md">
            <div className="text-sm font-bold">{payload[0].payload[xAxisKey]}</div>
            {payload.map((entry, index) => (
              <div key={`item-${index}`} className="flex items-center gap-2 text-xs">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{entry.name || yAxisKey}</span>
                <span>{entry.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      />
    </div>
  );
};

interface MobileResponsiveLineChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
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
  categories,
  colors
}) => {
  const mobile = isMobile();
  
  // Reduce data points if on mobile and too many points
  const displayData = mobile && data.length > 12 ? 
    data.filter((_, index) => index % Math.ceil(data.length / 10) === 0) : 
    data;
  
  return (
    <div className={className}>
      <LineChart
        data={displayData}
        categories={categories || [yAxisKey]}
        index={xAxisKey}
        colors={colors || ['blue']}
        valueFormatter={(value) => `${value}`}
        yAxisWidth={mobile ? 30 : 40}
        showAnimation
        showLegend={!mobile}
        showTooltip
        showXAxis
        showYAxis
        startEndOnly={mobile && displayData.length > 8}
        className="h-[300px]"
      />
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
  colors
}) => {
  const mobile = isMobile();
  
  // For mobile, reduce the number of slices by grouping smaller values
  let displayData = data;
  if (mobile && data.length > 6) {
    // Sort by value descending
    const sortedData = [...data].sort((a, b) => b[category] - a[category]);
    
    // Keep top 5 and group the rest
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
      <PieChart
        data={displayData}
        category={category}
        index="name"
        colors={colors}
        valueFormatter={(value) => `${value}`}
        showAnimation
        showTooltip
        showLabel={!mobile}
        label={mobile ? undefined : (item) => `${item.name}: ${item[category]}`}
        className="h-[300px]"
      />
    </div>
  );
};

interface MobileResponsiveDonutChartProps {
  data: any[];
  category: string;
  className?: string;
  colors?: string[];
  variant?: 'pie' | 'donut';
}

export const MobileResponsiveDonutChart: React.FC<MobileResponsiveDonutChartProps> = ({
  data,
  category,
  className,
  colors,
  variant = 'donut'
}) => {
  const mobile = isMobile();
  
  // For mobile, reduce the number of slices by grouping smaller values
  let displayData = data;
  if (mobile && data.length > 6) {
    // Same logic as pie chart
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
      <DonutChart
        data={displayData}
        category={category}
        index="name"
        colors={colors}
        valueFormatter={(value) => `${value}`}
        showAnimation
        showTooltip
        showLabel={!mobile}
        label={mobile ? undefined : (item) => `${item.name}`}
        variant={variant}
        className="h-[300px]"
      />
    </div>
  );
};

interface MobileResponsiveAreaChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
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
  categories,
  colors
}) => {
  const mobile = isMobile();
  
  // Reduce data points for mobile
  const displayData = mobile && data.length > 12 ? 
    data.filter((_, index) => index % Math.ceil(data.length / 8) === 0) : 
    data;
  
  return (
    <div className={className}>
      <AreaChart
        data={displayData}
        categories={categories || [yAxisKey]}
        index={xAxisKey}
        colors={colors || ['blue']}
        valueFormatter={(value) => `${value}`}
        yAxisWidth={mobile ? 30 : 40}
        showAnimation
        showLegend={!mobile}
        showTooltip
        showXAxis
        showYAxis
        startEndOnly={mobile && displayData.length > 8}
        className="h-[300px]"
      />
    </div>
  );
};
