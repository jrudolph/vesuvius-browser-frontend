import initialData from './data';
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { parse } from 'path';

// Previous helper functions remain the same
const getLayerUrl = (scrollNum, segmentId, layer) => {
  if (layer === 'mask') {
    return `https://vesuvius.virtual-void.net/scroll/${scrollNum}/segment/${segmentId}/mask?v2`;
  }
  const baseUrl = `https://vesuvius.virtual-void.net/scroll/${scrollNum}/segment/${segmentId}/inferred`;
  
  return `${baseUrl}/${layer}?v2`;
};

const layerLabels = {
  mask: 'Mask',
  'grand-prize_17_32': 'Grand Prize Model',
  'timesformer-scroll5-27112024_17_32': 'Scroll 5 Model',
  'first-word_15_32': 'First Word Model',
  'first-word_15_32_reverse': 'First Word Model (reverse)',
  'grand-prize-inklabels': 'Grand Prize Inklabels',
  'polytrope-inklabels-2024-08-16': 'Polytrope Inklabels',
  'first-letters-inklabels': 'First Letters Inklabels',
  'autosegmented-prediction': 'Auto Segmented Prediction',
  'polytrope-test3-predictions': 'Polytrope Test Model 3 Predictions',
};

const parseOr = (value, defaultValue) => {
  parseInt(value) || defaultValue;
}

const minColumnValue = (column: string) => {
  return Math.min(...initialData.map(item => parseInt(item[column])));
}
const maxColumnValue = (column: string) => {
  return Math.max(...initialData.map(item => parseInt(item[column])));
}

const rangeColumns = ['width', 'height'/* , 'areaCm2' */];
const minValues = {};
const maxValues = {};

rangeColumns.forEach(column => {
  minValues[column] = minColumnValue(column);
  maxValues[column] = maxColumnValue(column);
});

// Keep FilterInput and HeaderCell components the same
const FilterInput = React.memo(({ column, value, onChange, type = "text" }) => {
  if (type === "range") {
    const [range, setRange] = useState([minValues[column], maxValues[column]]);
    return (
      <div className="filter-slider px-2">
        <div className="flex justify-between text-xs mb-1">
          <span>{range[0]}</span>
          <span>{range[1]}</span>
        </div>
        
        <Slider 
          value={range}
          min={minValues[column]}
          max={maxValues[column]}
          step={10}
          className="mt-2"
          onValueChange={(newRange) => {
            setRange(newRange);
            onChange(column, { min: newRange[0], max: newRange[1] });
          }}
        />
      </div>
    );
  }

  return (
    <Input
      placeholder={`Filter ${column}...`}
      value={value}
      onChange={(e) => onChange(column, e.target.value)}
      className="w-full"
      size="sm"
    />
  );
});

const HeaderCell = React.memo(({ label, column, sortConfig, onSort, filterValue, onFilterChange, filterType }) => (
  <TableHead>
    <div className="space-y-2">
      <Button 
        variant="ghost" 
        onClick={() => onSort(column)}
        className="font-semibold w-full flex justify-between items-center"
      >
        {label}
        {sortConfig.key !== column ? (
          <ArrowUpDown className="ml-2 h-4 w-4" />
        ) : (
          sortConfig.direction === 'ascending' ? 
            <ChevronUp className="ml-2 h-4 w-4" /> : 
            <ChevronDown className="ml-2 h-4 w-4" />
        )}
      </Button>
      <FilterInput
        column={column}
        value={filterValue}
        onChange={onFilterChange}
        type={filterType}
      />
    </div>
  </TableHead>
));

const ImagePreview = React.memo(({ url, label, scrollNum, segmentId, layerKey }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center">
          <a 
            href={`/scroll/${scrollNum}/segment/${segmentId}/${layerKey ? `#layer=${layerKey}` : ''}`}
            className="block"
          >
            <img 
              src={url} 
              alt={label}
              className="w-48 h-36 object-cover rounded"
              loading="lazy"
            />
          </a>
          <span className="text-xs text-gray-600 mt-1 text-center break-words w-20">
            {label}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
));

const ScrollTable = React.memo(({ data, showImages }) => {
  const [filters, setFilters] = useState({
    volume: '',
    id: '',
    width: { min: minValues['width'], max: maxValues['width'] },
    height: { min: minValues['height'], max: maxValues['height'] },
  });
  const [selectedLayers, setSelectedLayers] = useState(Object.keys(layerLabels));
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  const toggleLayer = (layer) => {
    setSelectedLayers(prev => 
      prev.includes(layer) 
        ? prev.filter(l => l !== layer)
        : [...prev, layer]
    );
  };

  const toggleAll = () => {
    setSelectedLayers(prev => 
      prev.length === Object.keys(layerLabels).length ? [] : Object.keys(layerLabels)
    );
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const filteredAndSortedData = useMemo(() => {
    let processed = [...data];

    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        if (typeof filters[key] === 'object') {
          processed = processed.filter(item => {
            const width = parseInt(item[key]);
            return width >= filters[key].min && width <= filters[key].max;
          });
        } else {
          processed = processed.filter(item => 
            String(item[key]).toLowerCase().includes(filters[key].toLowerCase())
          );
        }
      }
    });

    if (sortConfig.key) {
      processed.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return processed;
  }, [filters, sortConfig, data]);

  const columns = useMemo(() => [
    { label: "Volume", column: "volume" },
    { label: "Segment ID", column: "id" },
    { label: "Width", column: "width", filterType: "range" },
    { label: "Height", column: "height", filterType: "range" },
    { label: "Area/cm²", column: "areaCm2" },
  ], []);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="align-top">
            {columns.map(({ label, column, filterType }) => (
              <HeaderCell
                key={column}
                label={label}
                column={column}
                sortConfig={sortConfig}
                onSort={handleSort}
                filterValue={filters[column]}
                onFilterChange={handleFilterChange}
                filterType={filterType}
              />
            ))}
            {showImages && 
              <>
            <TableHead>
              Preview Layers
              <div className="p-4 border-b flex gap-2 flex-wrap">
              <Badge
        variant={selectedLayers.length === Object.keys(layerLabels).length ? "default" : "outline"}
        className="cursor-pointer font-semibold"
        onClick={toggleAll}
      >
        {selectedLayers.length === Object.keys(layerLabels).length ? 'Hide All' : 'Show All'}
      </Badge>
      
      <div className="w-px h-6 bg-gray-200 mx-2" />

          {Object.entries(layerLabels).map(([key, label]) => (
            <Badge
              key={key}
              variant={selectedLayers.includes(key) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleLayer(key)}
            >
              {label}
            </Badge>
          ))}
        </div>

            </TableHead>
            
        </>
            }

          </TableRow>
        </TableHeader>
        
        <TableBody>
          {filteredAndSortedData.map((row) => (
            <TableRow key={`${row.scroll.id}-${row.id}`} className={showImages ? 'h-36' : 'h-12'}>
              <TableCell>{row.volume}</TableCell>
              <TableCell>
                <a href={`/scroll/${row.scroll.num}/segment/${row.id}/`} className="text-blue-600 hover:underline">
                  {row.id}
                </a>
              </TableCell>
              <TableCell>{row.width}</TableCell>
              <TableCell>{row.height}</TableCell>
              <TableCell>{row.areaCm2}</TableCell>
              {showImages && (
                <TableCell>
                  <div className="flex gap-4 flex-wrap">
                    {row.layers
                      .filter(key => selectedLayers.includes(key))
                      .map(key => (
                        <ImagePreview
                          key={key}
                          url={getLayerUrl(row.scroll.oldId, row.id, key)}
                          label={layerLabels[key]}
                          scrollNum={row.scroll.num}
                          segmentId={row.id}
                          layerKey={key}
                        />
                    ))}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

const VesuviusTable = () => {
  const [showImages, setShowImages] = useState(true);
  const [activeScrollType, setActiveScrollType] = useState('scrolls');
  const [activeScrollId, setActiveScrollId] = useState(null);

  const { scrollGroups, filteredData } = useMemo(() => {
    const groups = {};
    initialData.forEach(item => {
      const scrollId = item.scroll.id;
      if (!groups[scrollId]) {
        groups[scrollId] = [];
      }
      groups[scrollId].push(item);
    });
    
    const entries = Object.entries(groups);
    entries.sort((a, b) => a[1][0].scroll.num - b[1][0].scroll.num);
    
    const isFragment = activeScrollType === 'fragments';
    const filtered = initialData.filter(item => item.scroll.isFragment === isFragment);
    
    if (activeScrollId) {
      return {
        scrollGroups: entries,
        filteredData: filtered.filter(item => item.scroll.id === activeScrollId)
      };
    }
    
    return {
      scrollGroups: entries,
      filteredData: filtered
    };
  }, [activeScrollType, activeScrollId]);

  const scrollTabs = useMemo(() => {
    return scrollGroups
      .filter(([, data]) => {
        const isFragment = activeScrollType === 'fragments';
        return data[0].scroll.isFragment === isFragment;
      })
      .map(([scrollId, data]) => ({
        id: scrollId,
        label: `${data[0].scroll.num} / ${scrollId}`
      }));
  }, [scrollGroups, activeScrollType]);

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4 space-x-2">
        <Switch
          id="show-images"
          checked={showImages}
          onClick={() => setShowImages(!showImages)}
          className="flex items-center gap-2"
        />
        <Label htmlFor="show-images" className="text-sm font-semibold">
          Show Layer Previews
        </Label>      
      </div>

      <Tabs 
        defaultValue="scrolls" 
        onValueChange={(value) => {
          setActiveScrollType(value);
          setActiveScrollId(null);
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="scrolls">Scrolls</TabsTrigger>
          <TabsTrigger value="fragments">Fragments</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs 
        value={activeScrollId || scrollTabs[0]?.id} 
        onValueChange={setActiveScrollId}
        className="mb-4"
      >
        <TabsList>
          {scrollTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ScrollTable 
        data={filteredData}
        showImages={showImages}
      />
    </div>
  );
};

export default VesuviusTable;
