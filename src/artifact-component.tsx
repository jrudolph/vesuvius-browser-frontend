const initialData = [
  {
    scroll: 'PHercParis4',
    volumeId: '20230205180739',
    volumeVersion: '7.91',
    segment: '20240301161650',
    voxelSize: '16.40',
    area: '23213',
    width: '2321',
    layers: {
      grandPrize: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240301161650/inferred/grand-prize_17_32?v2',
      polytrope: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240301161650/inferred/polytrope-test3-predictions?v2',
      firstWord: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240301161650/inferred/first-word_15_32?v2',
      firstWordReverse: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240301161650/inferred/first-word_15_32_reverse?v2',
      polytopeInk: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240301161650/inferred/polytrope-inklabels-2024-08-16?v2',
      firstLetters: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240301161650/inferred/first-letters-inklabels?v2',
      autoSegmented: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240301161650/inferred/autosegmented-prediction?v2'
    },
    mask: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240301161650/mask?v2'
  },
  {
    scroll: 'PHercParis4',
    volumeId: '20230205180739',
    volumeVersion: '7.91',
    segment: '20240227085920',
    voxelSize: '15.05',
    area: '21322',
    width: '2200',
    layers: {
      grandPrize: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240227085920/inferred/grand-prize_17_32?v2',
      polytrope: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240227085920/inferred/polytrope-test3-predictions?v2',
      firstWord: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240227085920/inferred/first-word_15_32?v2',
      firstWordReverse: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240227085920/inferred/first-word_15_32_reverse?v2',
      polytopeInk: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240227085920/inferred/polytrope-inklabels-2024-08-16?v2',
    },
    mask: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240227085920/mask?v2'
  },
  {
    scroll: 'PHercParis4',
    volumeId: '20230205180739',
    volumeVersion: '7.91',
    segment: '20240223130140',
    voxelSize: '15.18',
    area: '21813',
    width: '2126',
    layers: {
      grandPrize: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240223130140/inferred/grand-prize_17_32?v2',
      polytrope: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240223130140/inferred/polytrope-test3-predictions?v2',
      firstWord: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240223130140/inferred/first-word_15_32?v2',
      firstWordReverse: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240223130140/inferred/first-word_15_32_reverse?v2',
      polytopeInk: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240223130140/inferred/polytrope-inklabels-2024-08-16?v2',
    },
    mask: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240223130140/mask?v2'
  },
  {
    scroll: 'PHercParis4',
    volumeId: '20230205180739',
    volumeVersion: '7.91',
    segment: '20240222111510',
    voxelSize: '16.93',
    area: '24419',
    width: '2106',
    layers: {
      grandPrize: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240222111510/inferred/grand-prize_17_32?v2',
      polytrope: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240222111510/inferred/polytrope-test3-predictions?v2',
      firstWord: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240222111510/inferred/first-word_15_32?v2',
      firstWordReverse: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240222111510/inferred/first-word_15_32_reverse?v2',
      polytopeInk: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240222111510/inferred/polytrope-inklabels-2024-08-16?v2',
    },
    mask: 'https://vesuvius.virtual-void.net/scroll/1/segment/20240222111510/mask?v2'
  }
];

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { ChevronUp, ChevronDown, ArrowUpDown, Eye, EyeOff } from 'lucide-react';

const layerLabels = {
  grandPrize: 'Grand Prize Model',
  polytrope: 'Polytrope Test3',
  firstWord: 'First Word',
  firstWordReverse: 'First Word Reverse',
  grandPrizeInk: 'Grand Prize Ink',
  polytopeInk: 'Polytrope Ink',
  firstLetters: 'First Letters',
  autoSegmented: 'Auto Segmented',
  mask: 'Mask'
};

// Calculate max width from initial data once
const getMaxWidth = (data) => {
  return Math.max(...data.map(item => parseInt(item.width))) + 100; // Add buffer
};

const getMinWidth = (data) => {
  return Math.min(...data.map(item => parseInt(item.width))) - 100; // Add buffer
}

const MAX_WIDTH = getMaxWidth(initialData);
const MIN_WIDTH = getMinWidth(initialData);

const FilterInput = React.memo(({ column, value, onChange, type = "text" }) => {
  if (type === "range") {
    const [range, setRange] = useState([MIN_WIDTH, MAX_WIDTH]);
    
    return (
      <div className="px-2">
        <div className="flex justify-between text-xs mb-1">
          <span>{range[0]}</span>
          <span>{range[1]}</span>
        </div>
        <style>{`span[role="slider"] { visibility: hidden; }`}
        </style>
        <Slider 
          value={range}
          min={MIN_WIDTH}
          max={MAX_WIDTH}
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
      key={`filter-${column}`}
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

const ImagePreview = React.memo(({ url, label, segmentId, layerKey }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center">
          <a 
            href={layerKey ? `/scroll/1/segment/${segmentId}/#layer=${layerKey}` : '#'}
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

const VesuviusTable = () => {
  const [filters, setFilters] = useState({
    scroll: '',
    volumeId: '',
    volumeVersion: '',
    segment: '',
    voxelSize: '',
    area: '',
    width: { min: MIN_WIDTH, max: MAX_WIDTH }
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });
  const [showImages, setShowImages] = useState(true);

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
    let processed = [...initialData];

    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        if (key === 'width') {
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
  }, [filters, sortConfig, initialData]);

  const columns = useMemo(() => [
    { label: "Scroll", column: "scroll" },
    { label: "Volume ID", column: "volumeId" },
    { label: "Version", column: "volumeVersion" },
    { label: "Segment", column: "segment" },
    { label: "Voxel Size", column: "voxelSize" },
    { label: "Area", column: "area" },
    { label: "Width", column: "width", filterType: "range" }
  ], []);

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
              {showImages && <TableHead>Preview Layers</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((row) => (
              <TableRow key={row.segment} className={showImages ? 'h-36' : 'h-12'}>
                <TableCell>{row.scroll}</TableCell>
                <TableCell>{row.volumeId}</TableCell>
                <TableCell>{row.volumeVersion}</TableCell>
                <TableCell>
                  <a href={`/scroll/1/segment/${row.segment}/`} className="text-blue-600 hover:underline">
                    {row.segment}
                  </a>
                </TableCell>
                <TableCell>{row.voxelSize}</TableCell>
                <TableCell>{row.area}</TableCell>
                <TableCell>{row.width}</TableCell>
                {showImages && (
                  <TableCell>
                    <div className="flex gap-4 flex-wrap">
                      {row.layers && Object.entries(row.layers).map(([key, url]) => (
                        url && <ImagePreview
                          key={key}
                          url={url}
                          label={layerLabels[key] || key}
                          segmentId={row.segment}
                          layerKey={key}
                        />
                      ))}
                      {row.mask && (
                        <ImagePreview
                          key="mask"
                          url={row.mask}
                          label={layerLabels.mask}
                          segmentId={row.segment}
                        />
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default VesuviusTable;
