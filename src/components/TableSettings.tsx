import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2 } from "lucide-react";

const defaultColumns = [
  { label: "Volume", column: "volume" },
  { label: "Segment ID", column: "id" },
  { label: "Width", column: "width", filterType: "range" },
  { label: "Height", column: "height", filterType: "range" },
  { label: "Area/cm²", column: "areaCm2" },
];

const TableSettings = ({
  columns,
  visibleColumns = columns.map((c) => c.column),
  onToggleColumn,
  showImages,
  onShowImagesChange,
  onReset,
}) => {
  const toggleAll = () => {
    const allColumns = columns.map((c) => c.column);
    const shouldShowAll = visibleColumns.length !== allColumns.length;
    onToggleColumn(shouldShowAll ? allColumns : []);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="px-1">
          <Settings2 className="h-4 w-4 mr-2" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Column Visibility</h4>
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {visibleColumns.length === columns.length
                ? "Hide All"
                : "Show All"}
            </Button>
          </div>

          <div className="space-y-2">
            {columns.map(({ label, column }) => (
              <div key={column} className="flex items-center space-x-2">
                <Switch
                  id={`column-${column}`}
                  checked={visibleColumns.includes(column)}
                  onCheckedChange={() =>
                    onToggleColumn([
                      ...visibleColumns.filter((c) => c !== column),
                      ...(visibleColumns.includes(column) ? [] : [column]),
                    ])
                  }
                />
                <Label htmlFor={`column-${column}`}>{label}</Label>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <Switch
                id="show-images"
                checked={showImages}
                onCheckedChange={onShowImagesChange}
              />
              <Label htmlFor="show-images">Layers</Label>
            </div>
          </div>

          <Separator />

          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full"
          >
            Reset All Settings
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TableSettings;
