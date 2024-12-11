import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
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
    volume: "",
    volumeVoxelSize: "",
    id: "",
    width: { min: 0, max: 1000000 },
    height: { min: 0, max: 1000000 },
    minZ: { min: 0, max: 1000000 },
    maxZ: { min: 0, max: 1000000 },
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
    "width",
    "height",
    "areaCm2",
    "minZ",
    "maxZ",
  ],
  showImages: true,
  activeScrollType: "scrolls",
  activeScrollId: null,
};

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
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
  ({ column, value, onChange, type = "text", min = 0, max = 100000 }) => {
    if (type === "range") {
      const [range, setRange] = useState([min, max]);
      return (
        <div className="filter-slider px-2">
          <div className="flex justify-between text-xs mb-1">
            <span>{range[0]}</span>
            <span>{range[1]}</span>
          </div>

          <Slider
            value={range}
            min={min}
            max={max}
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
  }) => (
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
          ) : sortConfig.direction === "ascending" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : (
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

  // const minColumnValue = (column) => {
  //   return Math.min(...initialData.map((item) => parseInt(item[column])));
  // };

  // const maxColumnValue = (column) => {
  //   return Math.max(...initialData.map((item) => parseInt(item[column])));
  // };

  // const rangeColumns = ["width", "height", "minZ", "maxZ"];
  // const minValues = {};
  // const maxValues = {};

  // rangeColumns.forEach((column) => {
  //   minValues[column] = minColumnValue(column);
  //   maxValues[column] = maxColumnValue(column);
  // });

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

  const filteredAndSortedData = useMemo(() => {
    let processed = [...data];

    if (settings.filterByLayers) {
      processed = processed.filter((item) =>
        item.layers.some((layer) => settings.selectedLayers.includes(layer))
      );
    }

    Object.keys(settings.filters).forEach((key) => {
      if (settings.filters[key]) {
        if (typeof settings.filters[key] === "object") {
          processed = processed.filter((item) => {
            const value = parseInt(item[key]);
            return (
              !value ||
              (value >= settings.filters[key].min &&
                value <= settings.filters[key].max)
            );
          });
        } else {
          processed = processed.filter((item) =>
            String(item[key])
              .toLowerCase()
              .includes(settings.filters[key].toLowerCase())
          );
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

  const columns = useMemo(
    () => [
      { label: "Volume", column: "volume" },
      { label: "Voxel Resolution/µm", column: "volumeVoxelSize" },
      { label: "Segment ID", column: "id" },
      { label: "Width", column: "width", filterType: "range" },
      { label: "Height", column: "height", filterType: "range" },
      { label: "Area/cm²", column: "areaCm2" },
      { label: "Min Z", column: "minZ", filterType: "range" },
      { label: "Max Z", column: "maxZ", filterType: "range" },
    ],
    []
  );

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
                />
              ))}
            {settings.showImages && (
              <>
                <TableHead>
                  Preview Layers
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
                      variant={settings.filterByLayers ? "default" : "outline"}
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

  const { scrollGroups, filteredData } = useMemo(() => {
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

    const isFragment = settings.activeScrollType === "fragments";
    const filtered = data.filter(
      (item) => item.scroll.isFragment === isFragment
    );

    if (settings.activeScrollId) {
      return {
        scrollGroups: entries,
        filteredData: filtered.filter(
          (item) => item.scroll.id === settings.activeScrollId
        ),
      };
    }

    return {
      scrollGroups: entries,
      filteredData: filtered,
    };
  }, [settings.activeScrollType, settings.activeScrollId, data]);

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
            activeScrollId: null,
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
