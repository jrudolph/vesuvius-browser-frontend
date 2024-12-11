import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { ChevronUp, ChevronDown, ArrowUpDown, Filter, X } from "lucide-react";
import TableSettings from "./TableSettings";

const STORAGE_KEY = "vesuvius-table-settings";

const getLayerUrl = (scrollNum, segmentId, layer) => {
  if (layer === "mask") {
    return `https://vesuvius.virtual-void.net/scroll/${scrollNum}/segment/${segmentId}/mask?v2`;
  }
  const baseUrl = `https://vesuvius.virtual-void.net/scroll/${scrollNum}/segment/${segmentId}/inferred`;
  return `${baseUrl}/${layer}?v2`;
};

const layerLabels = {
  mask: "Mask",
  "grand-prize_17_32": "Grand Prize Model",
  "timesformer-scroll5-27112024_17_32": "Scroll 5 Model",
  "first-word_15_32": "First Word Model",
  "first-word_15_32_reverse": "First Word Model (reverse)",
  "autosegmented-prediction": "Auto Segmented Prediction",
  "grand-prize-inklabels": "Grand Prize Inklabels",
  "first-letters-inklabels": "First Letters Inklabels",
  "polytrope-test3-predictions": "Polytrope Test Model 3 Predictions",
  "polytrope-inklabels-2024-08-16": "Polytrope Inklabels",
};

const defaultSettings = {
  filters: {
    volume: [],
    volumeVoxelSize: [],
    id: "",
    width: { min: 0, max: 1000000 },
    height: { min: 0, max: 1000000 },
    area: { min: 0, max: 1000000 },
    minZ: { min: 0, max: 1000000 },
    maxZ: { min: 0, max: 1000000 },
    author: [],
  },
  selectedLayers: Object.keys(layerLabels),
  sortConfig: {
    key: null,
    direction: "ascending",
  },
  filterByLayers: false,
  visibleColumns: [
    "volume",
    "volumeVoxelSize",
    "id",
    "author",
    "width",
    "height",
    "areaCm2",
    "minZ",
    "maxZ",
  ],
  showImages: true,
  activeScrollType: "scrolls",
  activeScrollId: "PHercParis4",
  version: 2,
};

const columns = [
  { label: "Volume", column: "volume", filterType: "badge" },
  {
    label: "Voxel Resolution/µm",
    column: "volumeVoxelSize",
    filterType: "badge",
  },
  { label: "Segment ID", column: "id" },
  { label: "Author", column: "author", filterType: "badge" },
  { label: "Width", column: "width", filterType: "range" },
  { label: "Height", column: "height", filterType: "range" },
  { label: "Area/cm²", column: "areaCm2", filterType: "range" },
  { label: "Min Z", column: "minZ", filterType: "range" },
  { label: "Max Z", column: "maxZ", filterType: "range" },
];

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item && item.version === defaultSettings.version
        ? JSON.parse(item)
        : initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  };

  return [storedValue, setValue];
};

const FilterInput = React.memo(
  ({ column, value, onChange, type = "text", filterRange = [0, 1000] }) => {
    if (type === "range") {
      const [range, setRange] = useState(filterRange);
      return (
        <div className="filter-slider px-2">
          <div className="flex justify-between text-xs mb-1">
            <span>{filterRange[0]}</span>
            <span>{filterRange[1]}</span>
          </div>

          <Slider
            value={range}
            min={filterRange[0]}
            max={filterRange[1]}
            step={10}
            className="mt-2"
            onValueChange={(newRange) => {
              setRange(newRange);
              onChange(column, { min: newRange[0], max: newRange[1] });
            }}
          />
        </div>
      );
    } else if (type === "badge") {
      const handleBadgeClick = (val) => {
        const newValue = value.includes(val)
          ? value.filter((v) => v !== val)
          : [...value, val];
        onChange(column, newValue);
      };
      const uniqueValues = filterRange;
      return (
        <div className="flex flex-wrap gap-2">
          {uniqueValues.map((val) => (
            <Badge
              key={val}
              variant={value.includes(val) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleBadgeClick(val)}
            >
              {val}
            </Badge>
          ))}
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
  }
);

const HeaderCell = React.memo(
  ({
    label,
    column,
    sortConfig,
    onSort,
    filterValue,
    onFilterChange,
    filterType,
    filterRange,
    onDisableColumn,
  }) => (
    <TableHead>
      <div className="w-full">
        <div>{label}</div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            onClick={() => onSort(column)}
            className="flex font-semibold justify-between items-center h-6 w-6 p-0"
          >
            {sortConfig.key !== column ? (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            ) : sortConfig.direction === "ascending" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={
                  (typeof filterValue === "string" && filterValue.length > 0) ||
                  filterValue?.min !== undefined ||
                  filterValue?.max !== undefined ||
                  (Array.isArray(filterValue) && filterValue.length > 0)
                    ? "text-primary h-6 w-4 p-0 flex "
                    : "text-muted-foreground opacity-40 h-6 w-4 p-0 flex "
                }
              >
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">Filter {label}</h4>
                <FilterInput
                  column={column}
                  value={filterValue}
                  filterRange={filterRange}
                  onChange={onFilterChange}
                  type={filterType}
                />
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDisableColumn(column)}
            className="hover:opacity-100 h-6 w-4 p-0 flex "
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </TableHead>
  )
);

const ImagePreview = React.memo(
  ({ url, label, scrollNum, segmentId, layerKey }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center">
            <Link
              to={`/scroll/${scrollNum}/segment/${segmentId}/${layerKey ? `#layer=${layerKey}` : ""}`}
            >
              <img
                src={url}
                alt={label}
                className="w-48 h-36 object-cover rounded"
                loading="lazy"
              />
              <span className="text-xs text-gray-600 mt-1 text-center break-words w-20">
                {label}
              </span>
            </Link>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
);

const ScrollTable = React.memo(({ data }) => {
  const [settings, setSettings] = useLocalStorage(STORAGE_KEY, defaultSettings);

  const updateSettings = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (
      settings.sortConfig.key === key &&
      settings.sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    updateSettings("sortConfig", { key, direction });
  };

  const handleFilterChange = (key, value) => {
    updateSettings("filters", { ...settings.filters, [key]: value });
  };

  const toggleLayer = (layer) => {
    const newLayers = settings.selectedLayers.includes(layer)
      ? settings.selectedLayers.filter((l) => l !== layer)
      : [...settings.selectedLayers, layer];
    updateSettings("selectedLayers", newLayers);
  };

  const toggleAll = () => {
    const newLayers =
      settings.selectedLayers.length === Object.keys(layerLabels).length
        ? []
        : Object.keys(layerLabels);
    updateSettings("selectedLayers", newLayers);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  useEffect(() => {
    columns.forEach((c) => {
      if (c.filterType === "badge") {
        // remove items that are not in the data
        const key = c.column;
        const uniqueValues = [
          ...new Set(data.map((item) => item[key]).filter(Boolean)),
        ];

        // filter if it is array
        const newFilters = Array.isArray(settings.filters[key])
          ? settings.filters[key].filter((val) => uniqueValues.includes(val))
          : [];
        if (newFilters.length !== settings.filters[key].length) {
          updateSettings("filters", {
            ...settings.filters,
            [key]: newFilters,
          });
        }
      }
    });
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let processed = [...data];

    if (settings.filterByLayers) {
      processed = processed.filter((item) =>
        item.layers.some((layer) => settings.selectedLayers.includes(layer))
      );
    }

    columns.forEach((c) => {
      const key = c.column;
      if (settings.filters[key]) {
        const filterType = c.filterType;

        if (filterType === "range") {
          processed = processed.filter((item) => {
            const value = parseInt(item[key]);
            return (
              !value ||
              (value >= settings.filters[key].min &&
                value <= settings.filters[key].max)
            );
          });
        } else if (filterType === "badge") {
          processed = processed.filter(
            (item) =>
              !item[key] ||
              settings.filters[key].length == 0 ||
              settings.filters[key].includes(item[key].toString().toLowerCase())
          );
        } else {
          processed = settings.filters[key]
            ? processed.filter((item) =>
                String(item[key])
                  .toLowerCase()
                  .includes(settings.filters[key].toLowerCase())
              )
            : processed;
        }
      }
    });

    if (settings.sortConfig.key) {
      processed.sort((a, b) => {
        if (a[settings.sortConfig.key] < b[settings.sortConfig.key]) {
          return settings.sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[settings.sortConfig.key] > b[settings.sortConfig.key]) {
          return settings.sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return processed;
  }, [
    settings.filters,
    settings.sortConfig,
    data,
    settings.filterByLayers,
    settings.selectedLayers,
  ]);

  const filterRangeFor = (column, filterType) => {
    if (filterType === "range") {
      const columnData = data.map((item) =>
        item[column] ? parseInt(item[column]) : 0
      );
      const min = Math.min(...columnData);
      const max = Math.max(...columnData);
      return [min, max];
    } else if (filterType === "badge") {
      const columnData = data
        .filter((item) => item[column])
        .map((item) => item[column].toString().trim().toLowerCase());
      const uniqueValues = [...new Set(columnData)];
      return uniqueValues;
    } else {
      return [];
    }
  };

  const filterRanges = useMemo(() => {
    const ranges = {};
    columns.forEach(({ column, filterType }) => {
      ranges[column] = filterRangeFor(column, filterType);
    });
    return ranges;
  }, [data]);

  return (
    <div className="rounded-md border">
      <div className="p-4 border-b">
        <TableSettings
          columns={columns}
          visibleColumns={settings.visibleColumns}
          onToggleColumn={(cols) => updateSettings("visibleColumns", cols)}
          showImages={settings.showImages}
          onShowImagesChange={(show) =>
            setSettings((prev) => ({ ...prev, showImages: show }))
          }
          onReset={resetSettings}
        />
        <Button
          variant="outline"
          size="sm"
          className="ml-2"
          onClick={() => updateSettings("filters", defaultSettings.filters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="align-top">
            {columns
              .filter(({ column }) => settings.visibleColumns.includes(column))
              .map(({ label, column, filterType }) => (
                <HeaderCell
                  key={column}
                  label={label}
                  column={column}
                  sortConfig={settings.sortConfig}
                  onSort={handleSort}
                  filterValue={settings.filters[column]}
                  onFilterChange={handleFilterChange}
                  filterType={filterType}
                  filterRange={filterRanges[column]}
                  onDisableColumn={(col) =>
                    updateSettings(
                      "visibleColumns",
                      settings.visibleColumns.filter((c) => c !== col)
                    )
                  }
                />
              ))}
            {settings.showImages && (
              <>
                <TableHead>
                  Preview Layers
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="p-4 border-b flex gap-2 flex-wrap">
                        <Badge
                          variant={
                            settings.selectedLayers.length ===
                            Object.keys(layerLabels).length
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer font-semibold"
                          onClick={toggleAll}
                        >
                          {settings.selectedLayers.length ===
                          Object.keys(layerLabels).length
                            ? "Hide All"
                            : "Show All"}
                        </Badge>

                        <Badge
                          variant={
                            settings.filterByLayers ? "default" : "outline"
                          }
                          className="cursor-pointer font-semibold"
                          onClick={() =>
                            updateSettings(
                              "filterByLayers",
                              !settings.filterByLayers
                            )
                          }
                        >
                          Filter
                        </Badge>

                        <div className="w-px h-6 bg-gray-200 mx-2" />

                        {Object.entries(layerLabels).map(([key, label]) => (
                          <Badge
                            key={key}
                            variant={
                              settings.selectedLayers.includes(key)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() => toggleLayer(key)}
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateSettings("showImages", false)}
                    className="hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredAndSortedData.map((row) => (
            <TableRow key={`${row.scroll.id}-${row.id}`} className="h-12">
              {columns
                .filter(({ column }) =>
                  settings.visibleColumns.includes(column)
                )
                .map(({ column }) => (
                  <TableCell key={column}>
                    {column === "id" ? (
                      <Link
                        to={`/scroll/${row.scroll.oldId}/segment/${row.id}/`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {row[column]}
                      </Link>
                    ) : (
                      row[column]
                    )}
                  </TableCell>
                ))}
              {settings.showImages && (
                <TableCell>
                  <div className="flex gap-4 flex-wrap">
                    {row.layers
                      .filter((key) => settings.selectedLayers.includes(key))
                      .map((key) => (
                        <ImagePreview
                          key={key}
                          url={getLayerUrl(row.scroll.oldId, row.id, key)}
                          label={layerLabels[key]}
                          scrollNum={row.scroll.oldId}
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
  const [settings, setSettings] = useLocalStorage(STORAGE_KEY, defaultSettings);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/segments")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((jsonData) => {
        setData(jsonData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const scrollGroups = useMemo(() => {
    const groups = {};
    data.forEach((item) => {
      const scrollId = item.scroll.id;
      if (!groups[scrollId]) {
        groups[scrollId] = [];
      }
      groups[scrollId].push(item);
    });

    const entries = Object.entries(groups);
    entries.sort((a, b) => a[1][0].scroll.num - b[1][0].scroll.num);

    return entries;
  }, [data]);

  const filteredData = useMemo(() => {
    if (scrollGroups.length === 0) return [];

    if (settings.activeScrollId) {
      return scrollGroups.filter(([key]) => {
        return key === settings.activeScrollId;
      })[0][1];
    } else {
      return scrollGroups.filter(([, data]) => {
        return (
          data[0].scroll.isFragment ===
          (settings.activeScrollType === "fragments")
        );
      })[0][1];
    }
  }, [settings.activeScrollType, settings.activeScrollId, scrollGroups]);

  const scrollTabs = useMemo(() => {
    return scrollGroups
      .filter(([, data]) => {
        const isFragment = settings.activeScrollType === "fragments";
        return data[0].scroll.isFragment === isFragment;
      })
      .map(([scrollId, data]) => ({
        id: scrollId,
        label: `${data[0].scroll.num} / ${scrollId}`,
      }));
  }, [scrollGroups, settings.activeScrollType]);

  return (
    <div className="p-4">
      <Tabs
        value={settings.activeScrollType}
        onValueChange={(value) => {
          setSettings((prev) => ({
            ...prev,
            activeScrollType: value,
            activeScrollId: scrollGroups.filter(
              ([, data]) =>
                data[0].scroll.isFragment === (value === "fragments")
            )[0][0],
          }));
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="scrolls">Scrolls</TabsTrigger>
          <TabsTrigger value="fragments">Fragments</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs
        value={settings.activeScrollId || scrollTabs[0]?.id}
        onValueChange={(value) =>
          setSettings((prev) => ({ ...prev, activeScrollId: value }))
        }
        className="mb-4"
      >
        <TabsList>
          {scrollTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="p-4">
        <ScrollTable data={filteredData} showImages={settings.showImages} />
      </div>
    </div>
  );
};

export default VesuviusTable;
