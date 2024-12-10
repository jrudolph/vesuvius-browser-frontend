import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import _ from "lodash";

// Constants and utility functions
const SIZE_UNITS = ["B", "KB", "MB", "GB"];

const getFileTypes = (data) => {
  if (!data?.length) return [];
  const firstItem = data[0];
  return Object.keys(firstItem)
    .filter((key) => firstItem[key]?.status?.status !== undefined)
    .sort();
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${SIZE_UNITS[i]}`;
};

const StatusIcon = ({ status, counts }) => {
  const icons = {
    ok: <CheckCircle className="text-green-600 mb-1" size={20} />,
    error: <XCircle className="text-red-600 mb-1" size={20} />,
    default: <AlertCircle className="text-gray-400 mb-1" size={20} />,
  };

  return (
    <div className="flex flex-col items-center">
      {icons[status] || icons.default}
      <div className="text-xs">
        <span className={status === "ok" ? "text-green-600" : "text-gray-600"}>
          {counts.ok}/{counts.total}
        </span>
      </div>
    </div>
  );
};

const StatusSummary = ({ ok, total }) => (
  <div className="text-xs text-center pb-1">
    <span className={ok === total ? "text-green-600" : "text-gray-600"}>
      {ok}/{total} ({((ok / total) * 100).toFixed(1)}%)
    </span>
  </div>
);

const FileColumn = ({ fileInfo }) => {
  if (!fileInfo)
    return (
      <TableCell colSpan={2} className="text-center">
        -
      </TableCell>
    );

  const status = fileInfo.status === "not-found" ? "404" : fileInfo.status;
  const statusColor =
    {
      ok: "text-green-600",
      error: "text-red-600",
      "404": "text-red-600",
    }[status?.toLowerCase()] || "text-gray-600";

  return (
    <>
      <TableCell className={`text-center ${statusColor}`}>
        <a
          href={fileInfo.url}
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {status}
        </a>
      </TableCell>
      <TableCell className="text-right">
        {status === "404" ? "-" : formatFileSize(fileInfo.size)}
      </TableCell>
    </>
  );
};

const TableHeaderRow = ({
  handleSort,
  renderSortIcon,
  calculateColumnSummary,
  fileTypes,
}) => (
  <>
    <TableRow className="bg-gray-100">
      <TableHead colSpan={2}>Scroll</TableHead>
      <TableHead>Segment ID</TableHead>
      <TableHead className="text-center">
        <button
          onClick={() => handleSort("overallStatus")}
          className="inline-flex items-center"
        >
          Status {renderSortIcon("overallStatus")}
        </button>
        <StatusSummary {...calculateColumnSummary("overall")} />
      </TableHead>
      {fileTypes.map((type) => (
        <TableHead key={type} colSpan={2} className="bg-gray-50">
          {type}
          <StatusSummary {...calculateColumnSummary(type)} />
        </TableHead>
      ))}
    </TableRow>
    <TableRow className="bg-gray-50">
      <TableHead>ID</TableHead>
      <TableHead>#</TableHead>
      <TableHead>ID</TableHead>
      <TableHead className="text-center">All OK?</TableHead>
      {fileTypes.map((type) => (
        <React.Fragment key={`${type}-subheaders`}>
          <TableHead>
            <button
              onClick={() => handleSort(`${type}_status`)}
              className="inline-flex items-center"
            >
              Status {renderSortIcon(`${type}_status`)}
            </button>
          </TableHead>
          <TableHead>
            <button
              onClick={() => handleSort(`${type}_size`)}
              className="inline-flex items-center"
            >
              Size {renderSortIcon(`${type}_size`)}
            </button>
          </TableHead>
        </React.Fragment>
      ))}
    </TableRow>
  </>
);

const SegmentRow = ({ segment, fileTypes }) => {
  const checkStatus = (item, types) => {
    const statuses = types
      .map((type) => item[type]?.status?.status?.toLowerCase())
      .filter(Boolean);
    return statuses.length
      ? statuses.every((s) => s === "ok")
        ? "ok"
        : "error"
      : "unknown";
  };

  const counts = fileTypes.reduce(
    (acc, type) => {
      const status = segment[type]?.status?.status?.toLowerCase();
      if (status === "ok") acc.ok++;
      if (status) acc.total++;
      return acc;
    },
    { ok: 0, total: 0 }
  );

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">{segment.scroll.id}</TableCell>
      <TableCell>{segment.scroll.num}</TableCell>
      <TableCell>
        <a
          href={segment.baseUrl}
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {segment.id}
        </a>
      </TableCell>
      <TableCell className="text-center">
        <StatusIcon status={checkStatus(segment, fileTypes)} counts={counts} />
      </TableCell>
      {fileTypes.map((type) => (
        <FileColumn
          key={`${segment.id}-${type}`}
          fileInfo={
            segment[type]?.status
              ? {
                  status: segment[type].status.status,
                  size: segment[type].status.size,
                  url: segment[type].url,
                }
              : null
          }
        />
      ))}
    </TableRow>
  );
};

const SegmentUrlReport = () => {
  const [data, setData] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    field: null,
    direction: "asc",
  });
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [isGrouped, setIsGrouped] = useState(false);

  useEffect(() => {
    fetch("/api/segments/url-report")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((jsonData) => {
        setData(jsonData);
        setFileTypes(getFileTypes(jsonData));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortValue = (item, field) => {
    if (field === "overallStatus") {
      return checkSegmentStatus(item, fileTypes);
    }
    if (field.endsWith("_status")) {
      const type = field.replace("_status", "");
      return item[type]?.status?.status || "";
    }
    if (field.endsWith("_size")) {
      const type = field.replace("_size", "");
      return item[type]?.status?.size || 0;
    }
    return "";
  };

  const checkSegmentStatus = (item, types) => {
    const statuses = types
      .map((type) => item[type]?.status?.status?.toLowerCase())
      .filter(Boolean);
    return statuses.length
      ? statuses.every((s) => s === "ok")
        ? "ok"
        : "error"
      : "unknown";
  };

  const sortedData = React.useMemo(() => {
    if (!data?.length) return [];

    const grouped = _.groupBy(data, "scroll.id");
    return Object.entries(grouped)
      .map(([scrollId, segments]) => ({
        scrollId,
        scrollNum: segments[0].scroll.num,
        isFragment: segments[0].scroll.isFragment,
        segments: sortConfig.field
          ? _.orderBy(
              segments,
              [
                (item) => {
                  const value = getSortValue(item, sortConfig.field);
                  return typeof value === "string"
                    ? value.toLowerCase()
                    : value;
                },
              ],
              [sortConfig.direction]
            )
          : segments,
      }))
      .sort(
        (a, b) =>
          (a.isFragment ? 10000 : 0) +
          a.scrollNum -
          ((b.isFragment ? 10000 : 0) + b.scrollNum)
      );
  }, [data, sortConfig]);

  if (loading)
    return (
      <div className="w-full p-4 text-center">
        Loading segment URL report...
      </div>
    );
  if (error)
    return (
      <div className="w-full p-4 text-center text-red-600">
        Error loading report: {error}
      </div>
    );
  if (!data?.length)
    return (
      <div className="w-full p-4 text-center">
        No segment URL data available.
      </div>
    );

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="group-by-scroll"
            checked={isGrouped}
            onCheckedChange={setIsGrouped}
          />
          <label htmlFor="group-by-scroll" className="text-sm font-medium">
            Group by Scroll
          </label>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableHeaderRow
              fileTypes={fileTypes}
              handleSort={handleSort}
              renderSortIcon={(field) => (
                <ArrowUpDown
                  size={16}
                  className={`ml-1 inline-block ${
                    sortConfig.field === field
                      ? "text-blue-500"
                      : "text-gray-400"
                  }`}
                />
              )}
              calculateColumnSummary={(type) => {
                const total = data.length;
                const ok = data.filter((item) =>
                  type === "overall"
                    ? fileTypes.every(
                        (t) => item[t]?.status?.status?.toLowerCase() === "ok"
                      )
                    : item[type]?.status?.status?.toLowerCase() === "ok"
                ).length;
                return { ok, total };
              }}
            />
          </TableHeader>
          <TableBody>
            {isGrouped
              ? sortedData.map(({ scrollId, segments }) => (
                  <React.Fragment key={scrollId}>
                    <TableRow className="bg-gray-100">
                      <TableCell colSpan={3}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setExpandedGroups((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(scrollId)) {
                                  newSet.delete(scrollId);
                                } else {
                                  newSet.add(scrollId);
                                }
                                return newSet;
                              })
                            }
                            className="hover:bg-gray-200 p-1 rounded"
                          >
                            {expandedGroups.has(scrollId) ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </button>
                          <span className="font-medium">
                            {segments[0].scroll.isFragment
                              ? "Fragment"
                              : "Scroll"}{" "}
                            {segments[0].scroll.num}/{scrollId}
                          </span>
                          <span className="text-sm ml-2">
                            ({segments.length} segments)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const stats = segments.reduce(
                            (acc, item) => {
                              if (
                                fileTypes.every(
                                  (t) =>
                                    item[t]?.status?.status?.toLowerCase() ===
                                    "ok"
                                )
                              ) {
                                acc.ok++;
                              }
                              acc.total++;
                              return acc;
                            },
                            { ok: 0, total: 0 }
                          );
                          return <StatusSummary {...stats} />;
                        })()}
                      </TableCell>
                      {fileTypes.map((type) => {
                        const stats = segments.reduce(
                          (acc, item) => {
                            const status =
                              item[type]?.status?.status?.toLowerCase();
                            if (status === "ok") acc.ok++;
                            if (status) acc.total++;
                            return acc;
                          },
                          { ok: 0, total: 0 }
                        );
                        return (
                          <TableCell
                            key={`${scrollId}-${type}-summary`}
                            colSpan={2}
                            className="text-center"
                          >
                            <StatusSummary {...stats} />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {expandedGroups.has(scrollId) &&
                      segments.map((segment) => (
                        <SegmentRow
                          key={`${segment.scroll.id}-${segment.id}`}
                          segment={segment}
                          fileTypes={fileTypes}
                        />
                      ))}
                  </React.Fragment>
                ))
              : (sortConfig.field
                  ? _.orderBy(
                      data,
                      [
                        (item) => {
                          const value = getSortValue(item, sortConfig.field);
                          return typeof value === "string"
                            ? value.toLowerCase()
                            : value;
                        },
                      ],
                      [sortConfig.direction]
                    )
                  : data
                ).map((segment) => (
                  <SegmentRow
                    key={`${segment.scroll.id}-${segment.id}`}
                    segment={segment}
                    fileTypes={fileTypes}
                  />
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SegmentUrlReport;
