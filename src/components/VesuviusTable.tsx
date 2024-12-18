import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
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
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Filter,
  X,
  ExternalLink,
  Settings2,
  Grid2x2,
  Square,
  Grid3X3,
  Grid3x3,
  Grid2X2,
} from "lucide-react";
import TableSettings from "./TableSettings";
import VolumeBadge from "./VolumeBadge";
import RangeBar from "./RangeBar";
import { Separator } from "./ui/separator";

const STORAGE_KEY = "vesuvius-table-settings";

export const getLayerUrl = (
  scrollNum,
  segmentId,
  layer,
  full = false,
  show = false
) => {
  const getLayerUrl = () => {
    if (layer === "mask") {
      return `/scroll/${scrollNum}/segment/${segmentId}/mask`;
    } else if (layer === "outline") {
      return `/scroll/${scrollNum}/segment/${segmentId}/outline`;
    } else if (layer === "composite") {
      return `/scroll/${scrollNum}/segment/${segmentId}/composite`;
    } else {
      const baseUrl = `/scroll/${scrollNum}/segment/${segmentId}/inferred`;
      return `${baseUrl}/${layer}`;
    }
  };

  const fullPath = full ? "/full" : "";
  const showQuery = show ? "?show" : "";

  if (layer == "outline") {
    if (full) return `${getLayerUrl()}?width=1200&height=800`;
    else return `${getLayerUrl()}`;
  } else {
    return `${getLayerUrl()}${fullPath}${showQuery}`;
  }
};

const COLORS = [
  "bg-red-500",
  "bg-lime-500",
  "bg-sky-500",
  "bg-teal-500",
  "bg-fuchsia-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-rose-500",
];

export const layerLabels = {
  mask: "Mask",
  outline: "Outline",
  composite: "Composite",
  "grand-prize_17_32": "Grand Prize Model",
  "timesformer-scroll5-27112024_17_32": "Scroll 5 Model",
  "first-word_15_32": "First Word Model",
  "first-word_15_32_reverse": "First Word Model (reverse)",
  "autosegmented-prediction": "Auto Segmented Prediction",
  "grand-prize-inklabels": "Grand Prize Inklabels",
  "first-letters-inklabels": "First Letters Inklabels",
  "polytrope-test3-predictions": "Polytrope Predictions",
  "polytrope-inklabels-2024-08-16": "Polytrope Inklabels",
};

const defaultSettings = {
  filters: {
    volume: [],
    volumeVoxelSize: [],
    id: "",
    author: [],
  },
  selectedLayers: ["outline", "composite", "grand-prize_17_32"],
  layerSize: "small",
  sortConfig: {
    column: null,
    direction: "ascending",
  },
  filterByLayers: false,
  visibleColumns: [
    "volume",
    "id",
    "author",
    "width",
    "height",
    "areaCm2",
    "zRange",
  ],
  showImages: true,
  activeScrollType: "scrolls",
  activeScrollId: "PHercParis4",
  version: 4,
};

const getVolumeId = (volume) => {
  return volume.volume;
};

class Column {
  label: string;
  column: string;
  filterType: any;
  filterMap: any;
  columnDisplay: any;
  constructor(
    label,
    column,
    filterType,
    { filterMap, columnDisplay, value, sortValue, filterRangeFor, filter } = {}
  ) {
    this.label = label;
    this.column = column;
    this.filterType = filterType;
    this.filterMap = filterMap;
    this.columnDisplay = columnDisplay;
    if (value) this.value = value;
    if (sortValue) this.sortValue = sortValue;
    if (filterRangeFor) this.filterRangeFor = filterRangeFor;
    if (filter) this.filter = filter;
  }

  value(row) {
    return row[this.column];
  }
  sortValue(row) {
    return this.value(row);
  }
  minRange(fullData) {
    return Math.min(
      ...fullData.map((item) =>
        this.value(item) ? this.value(item) : Number.MAX_SAFE_INTEGER
      )
    );
  }
  maxRange(fullData) {
    return Math.max(
      ...fullData.map((item) => (this.value(item) ? this.value(item) : 0))
    );
  }
  ellipsizeMeshId(str) {
    const parts = str.split("_");
    if (parts.length < 4) return str;

    // Extract numeric parts (6 digits)
    const numbers0 = parts.filter((part) => /^-?\d+$/.test(part));

    // Find trailing single digit if it exists
    const lastPart = parts[parts.length - 1];
    const hasTrailingNumber = /^\d+$/.test(lastPart) && lastPart.length === 1;
    const numbers =
      numbers0.length >= 1 && numbers0[0] == "0" ? numbers0.slice(1) : numbers0;

    if (numbers.length >= 2) {
      if (hasTrailingNumber) {
        return `mesh...${numbers[0]}_${numbers[1]}..._${lastPart}`;
      }
      return `mesh...${numbers[0]}_${numbers[1]}`;
    }

    return str;
  }

  display(row, colorFor) {
    return this.column === "id" ? (
      <div className="flex flex-nowrap gap-1">
        <Link
          to={`/scroll/${row.scroll.oldId}/segment/${row.id}/`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
          title={this.value(row)}
        >
          {this.ellipsizeMeshId(this.value(row))}
        </Link>
        <a href={row.urls.baseUrl} target="_blank">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    ) : this.columnDisplay ? (
      this.columnDisplay(this.value(row), colorFor)
    ) : this.filterType == "badge" && this.value(row) ? (
      <Badge className={colorFor(this.column, this.value(row))}>
        {this.value(row)}
      </Badge>
    ) : (
      this.value(row)
    );
  }

  filterRangeFor(fullData) {
    const filterMapFn = this.filterMap ? this.filterMap : (val) => val;
    if (this.filterType === "range") {
      return [this.minRange(fullData), this.maxRange(fullData)];
    } else if (this.filterType === "badge") {
      const columnData = fullData
        .filter((item) => filterMapFn(this.value(item)))
        .map((item) =>
          filterMapFn(this.value(item)).toString().trim().toLowerCase()
        );
      const uniqueValues = [...new Set(columnData)];
      return uniqueValues;
    } else {
      return [];
    }
  }

  filter(processed, filterValue) {
    const filterType = this.filterType;
    const filterMap = this.filterMap ? this.filterMap : (val) => val;

    if (filterType === "range") {
      processed = processed.filter((item) => {
        const value = parseInt(filterMap(this.value(item)));
        return !value || (value >= filterValue.min && value <= filterValue.max);
      });
    } else if (filterType === "badge") {
      processed = processed.filter(
        (item) =>
          !this.value(item) ||
          filterValue.length == 0 ||
          filterValue.includes(
            filterMap(this.value(item)).toString().toLowerCase()
          )
      );
    } else {
      processed = filterValue
        ? processed.filter((item) =>
            String(filterMap(this.value(item)))
              .toLowerCase()
              .includes(filterValue.toLowerCase())
          )
        : processed;
    }
    return processed;
  }
}

const volumeRange = (fullData) => {
  const maxZ = Math.max(...fullData.map((item) => item.volume.maxZ));
  return [0, maxZ];
};

const columns = [
  new Column("Volume", "volume", "badge", {
    filterMap: getVolumeId,
    columnDisplay: VolumeBadge,
  }),
  new Column("Segment ID", "id", "id"),
  new Column("Author", "author", "badge"),
  new Column("Width", "width", "range"),
  new Column("Height", "height", "range"),
  new Column("Area/cm²", "areaCm2", "range", {
    columnDisplay: (v) => (v ? v.toFixed(2) : ""),
  }),
  new Column("Min Z", "minZ", "range", { filterRangeFor: volumeRange }),
  new Column("Max Z", "maxZ", "range", { filterRangeFor: volumeRange }),
  new Column("Z Range", "zRange", "range", {
    value: (row) => [row.minZ, row.maxZ, row.volume.maxZ],
    sortValue: (row) => row.maxZ - row.minZ,
    columnDisplay: ([start, end, maxZ]) => {
      return (
        <div className="min-w-24">
          <RangeBar min={0} max={maxZ} start={start} end={end} />
        </div>
      );
    },
    filterRangeFor: volumeRange,
    filter: (processed, filterValue) => {
      const { min, max } = filterValue;
      return processed.filter((item) => {
        const [start, end] = [item.minZ, item.maxZ];
        // if [start,end] overlaps with [min,max]
        return start <= max && end >= min;
      });
    },
  }),
];

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      const item2 = item ? JSON.parse(item) : initialValue;
      return item2.version === defaultSettings.version ? item2 : initialValue;
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
  ({ column, onChange, filterRange, filterValue }) => {
    if (column.filterType === "range") {
      const [range, setRange] = useState([
        filterValue ? filterValue.min : filterRange[0],
        filterValue ? filterValue.max : filterRange[1],
      ]);
      return (
        <div className="filter-slider px-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="ml-8">{range[0]}</span>
            <span className="mr-8">{range[1]}</span>
          </div>

          <div className="flex">
            <span>{filterRange[0]}</span>
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
            <span>{filterRange[1]}</span>
          </div>
        </div>
      );
    } else if (column.filterType === "badge") {
      const handleBadgeClick = (val) => {
        const newValue = filterValue.includes(val)
          ? filterValue.filter((v) => v !== val)
          : [...filterValue, val];
        onChange(column, newValue);
      };
      const uniqueValues = filterRange.sort();
      // use colors from array above based on value idx

      return (
        <div className="flex flex-wrap gap-2">
          {uniqueValues.map((val, idx) => (
            <Badge
              key={val}
              variant={filterValue.includes(val) ? "default" : "outline"}
              className={`cursor-pointer ${filterValue.includes(val) ? COLORS[idx % COLORS.length] : ""}`}
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
        placeholder={`Filter ${column.column}...`}
        value={filterValue}
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
    onFilterChange,
    filterRange,
    onDisableColumn,
    filterValue,
  }) => (
    <TableHead className="p-0 px-4 py-1">
      <div className="w-full">
        <div>{label}</div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            onClick={() => onSort(column)}
            className="flex font-semibold justify-between items-center h-6 w-6 p-0"
          >
            {sortConfig.column !== column.column ? (
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
                  filterRange={filterRange}
                  onChange={onFilterChange}
                  filterValue={filterValue}
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
  ({ url, label, scrollNum, segmentId, layerKey, size }) => {
    const { width, height, classes } = {
      small: { width: 120, height: 80, classes: "w-36 h-24" },
      medium: { width: 240, height: 160, classes: "w-72 h-48" },
      large: { width: 480, height: 320, classes: "w-144 h-96" },
    }[size];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center">
              <Link
                to={`/scroll/${scrollNum}/segment/${segmentId}/${layerKey ? `#layer=${layerKey}` : ""}`}
              >
                <img
                  src={`${url}?width=${width}&height=${height}`}
                  alt={label}
                  className={`${classes} object-cover rounded`}
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
    );
  }
);

const ScrollTable = React.memo(({ data }) => {
  const [settings, setSettings] = useLocalStorage(STORAGE_KEY, defaultSettings);

  const updateSettings = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSort = (column) => {
    let direction = "ascending";
    if (
      settings.sortConfig.column === column.column &&
      settings.sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    updateSettings("sortConfig", { column: column.column, direction });
  };

  const handleFilterChange = (c, value) => {
    console.log("Filter change", c.column, value);
    updateSettings("filters", { ...settings.filters, [c.column]: value });
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
  const resetFilters = () => {
    updateSettings("filters", defaultSettings.filters);
    updateSettings("filterByLayers", false);
  };

  const setLayerSize = (size) => {
    updateSettings("layerSize", size);
  };

  useEffect(() => {
    columns.forEach((c) => {
      const filterMap = c.filterMap ? c.filterMap : (val) => val;

      if (c.filterType === "badge") {
        // remove items that are not in the data
        const key = c.column;
        const uniqueValues = [
          ...new Set(data.map((item) => filterMap(item[key])).filter(Boolean)),
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
        processed = c.filter(processed, settings.filters[key]);
      }
    });

    const orDummy = (value) => {
      return value && value.toString().trim().length > 0 ? value : "-1";
    };

    if (settings.sortConfig.column) {
      const column = settings.sortConfig.column;
      const c = columns.find((col) => col.column === column);
      if (!c) {
        console.log("Column not found", column);
        return processed;
      }
      processed.sort((a, b) => {
        const aV = orDummy(c.sortValue(a));
        const bV = orDummy(c.sortValue(b));

        if (aV < bV) {
          return settings.sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aV > bV) {
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

  const [filterRanges, filterColors] = useMemo(() => {
    const ranges = {};
    const colors = {};
    columns.forEach((c) => {
      const values = c.filterRangeFor(data);
      ranges[c.column] = values;
      colors[c.column] = values.map((_, idx) => COLORS[idx % COLORS.length]);
    });
    return [ranges, colors];
  }, [data]);

  const colorFor = (column, value) => {
    const idx = filterRanges[column].indexOf(value.toString().toLowerCase());
    return filterColors[column][idx];
  };

  return (
    <div className="rounded-md border">
      <div className="p-1">
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
          className="ml-2 px-1"
          onClick={resetFilters}
        >
          <Filter className="h-4 w-4 mr-1" />
          Reset Filters
        </Button>
      </div>
      <div className="flex flex-col h-screen">
        <div className="flex-grow overflow-auto">
          <table className="w-full">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="align-top">
                {columns
                  .filter(({ column }) =>
                    settings.visibleColumns.includes(column)
                  )
                  .map((c) => (
                    <HeaderCell
                      key={c.column}
                      label={c.label}
                      column={c}
                      sortConfig={settings.sortConfig}
                      onSort={handleSort}
                      filterValue={settings.filters[c.column]}
                      onFilterChange={handleFilterChange}
                      filterRange={filterRanges[c.column]}
                      onDisableColumn={(col) =>
                        updateSettings(
                          "visibleColumns",
                          settings.visibleColumns.filter(
                            (c) => c !== col.column
                          )
                        )
                      }
                    />
                  ))}
                {settings.showImages && (
                  <>
                    <TableHead>
                      Layers
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Settings2 className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="p-4 border-b flex gap-2 flex-wrap">
                            <Toggle
                              pressed={settings.layerSize === "small"}
                              onPressedChange={() => setLayerSize("small")}
                              aria-label="Small view"
                              className="data-[state=on]:bg-gray-200"
                            >
                              <Grid3x3 className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                              pressed={settings.layerSize === "medium"}
                              onPressedChange={() => setLayerSize("medium")}
                              aria-label="Medium view"
                              className="data-[state=on]:bg-gray-200"
                            >
                              <Grid2X2 className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                              pressed={settings.layerSize === "large"}
                              onPressedChange={() => setLayerSize("large")}
                              aria-label="Large view"
                              className="data-[state=on]:bg-gray-200"
                            >
                              <Square className="h-4 w-4" />
                            </Toggle>

                            <Separator />

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

                            <Separator />

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
                <TableRow key={`${row.scroll.id}-${row.id}`}>
                  {columns
                    .filter(({ column }) =>
                      settings.visibleColumns.includes(column)
                    )
                    .map((column) => (
                      <TableCell key={column.column} className="p-1">
                        {column.display(row, colorFor)}
                      </TableCell>
                    ))}
                  {settings.showImages && (
                    <TableCell className="p-1">
                      <div className="flex gap-4 flex-wrap">
                        {row.layers
                          .filter((key) =>
                            settings.selectedLayers.includes(key)
                          )
                          .sort((a, b) =>
                            Object.keys(layerLabels).indexOf(a) >
                            Object.keys(layerLabels).indexOf(b)
                              ? 1
                              : -1
                          )
                          .map((key) => (
                            <ImagePreview
                              key={key}
                              url={getLayerUrl(row.scroll.oldId, row.id, key)}
                              label={layerLabels[key]}
                              scrollNum={row.scroll.oldId}
                              segmentId={row.id}
                              layerKey={key}
                              size={settings.layerSize}
                            />
                          ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>
      </div>
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

  if (loading) {
    return <div>Loading...</div>;
  } else if (error) {
    return <div>Error: {error}</div>;
  } else
    return (
      <>
        <div className="flex p-1 gap-4">
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
        </div>
        <div className="p-0">
          <ScrollTable data={filteredData} showImages={settings.showImages} />
        </div>
      </>
    );
};

export default VesuviusTable;
