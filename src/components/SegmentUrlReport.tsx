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

const SegmentUrlReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [isGrouped, setIsGrouped] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/segments/url-report");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "ok":
        return "text-green-600";
      case "error":
      case "404":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const fileTypes = [
    "mask",
    "area",
    "obj",
    "ppm",
    "meta",
    "composite",
    "layer0",
    "layer32",
  ];

  const normalizeStatus = (status) => {
    return status?.toLowerCase() === "not-found" ? "404" : status;
  };

  const checkSegmentStatus = (item) => {
    const allStatuses = fileTypes
      .map((type) => item[type]?.status?.status)
      .filter((status) => status !== undefined);

    if (allStatuses.length === 0) return "unknown";
    return allStatuses.every((status) => status?.toLowerCase() === "ok")
      ? "ok"
      : "error";
  };

  const calculateColumnSummary = (type) => {
    if (!data?.length) return { ok: 0, total: 0 };

    const total = data.length;
    const ok = data.filter(
      (item) => item[type]?.status?.status?.toLowerCase() === "ok"
    ).length;

    return { ok, total };
  };

  const calculateOverallSummary = () => {
    if (!data?.length) return { ok: 0, total: 0 };

    const total = data.length;
    const ok = data.filter((item) => checkSegmentStatus(item) === "ok").length;

    return { ok, total };
  };

  const calculateScrollSummary = (scrollGroup) => {
    const summary = {
      totalSegments: scrollGroup.length,
      fileTypes: {},
    };

    fileTypes.forEach((type) => {
      const typeStats = scrollGroup.reduce(
        (acc, item) => {
          const status = item[type]?.status?.status?.toLowerCase();
          if (status === "ok") acc.ok++;
          if (status) acc.total++;
          return acc;
        },
        { ok: 0, total: 0 }
      );

      summary.fileTypes[type] = typeStats;
    });

    return summary;
  };

  const renderStatusSummary = ({ ok, total }) => {
    const percentage = ((ok / total) * 100).toFixed(1);
    return (
      <div className="text-xs text-center pb-1">
        <span className={ok === total ? "text-green-600" : "text-gray-600"}>
          {ok}/{total} ({percentage}%)
        </span>
      </div>
    );
  };

  const getSortValue = (item, field) => {
    if (field === "overallStatus") {
      return checkSegmentStatus(item);
    }
    if (field.endsWith("_status")) {
      const type = field.replace("_status", "");
      return normalizeStatus(item[type]?.status?.status) || "";
    }
    if (field.endsWith("_size")) {
      const type = field.replace("_size", "");
      return item[type]?.status?.size || 0;
    }
    return "";
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleGroup = (scrollId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(scrollId)) {
      newExpanded.delete(scrollId);
    } else {
      newExpanded.add(scrollId);
    }
    setExpandedGroups(newExpanded);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown size={16} className="ml-1 inline-block text-gray-400" />
      );
    }
    return (
      <ArrowUpDown
        size={16}
        className={`ml-1 inline-block ${sortField === field ? "text-blue-500" : "text-gray-400"}`}
      />
    );
  };

  const getStatusSummary = (item) => {
    const counts = fileTypes.reduce(
      (acc, type) => {
        const status = item[type]?.status?.status?.toLowerCase();
        if (status === "ok") acc.ok++;
        if (status) acc.total++;
        return acc;
      },
      { ok: 0, total: 0 }
    );
    return counts;
  };

  const renderStatusIcon = (item) => {
    const status = checkSegmentStatus(item);
    const counts = getStatusSummary(item);

    const icon = (() => {
      switch (status) {
        case "ok":
          return <CheckCircle className="text-green-600 mb-1" size={20} />;
        case "error":
          return <XCircle className="text-red-600 mb-1" size={20} />;
        default:
          return <AlertCircle className="text-gray-400 mb-1" size={20} />;
      }
    })();

    return (
      <div className="flex flex-col items-center">
        {icon}
        <div className="text-xs">
          <span
            className={status === "ok" ? "text-green-600" : "text-gray-600"}
          >
            {counts.ok}/{counts.total}
          </span>
        </div>
      </div>
    );
  };

  const createSegmentRow = (item) => {
    const row = {
      scrollId: item.scroll.id,
      scrollNum: item.scroll.num,
      baseUrl: item.baseUrl,
      oldId: item.scroll.oldId,
      isFragment: item.scroll.isFragment,
      id: item.id,
      overallStatus: checkSegmentStatus(item),
    };

    fileTypes.forEach((type) => {
      if (item[type]) {
        row[type] = {
          status: item[type].status.status,
          size: item[type].status.size,
          url: item[type].url,
        };
      }
    });

    return row;
  };

  const renderFileColumn = (fileInfo) => {
    if (!fileInfo)
      return (
        <TableCell colSpan={2} className="text-center">
          -
        </TableCell>
      );

    const status = normalizeStatus(fileInfo.status);

    return (
      <>
        <TableCell className={`text-center ${getStatusColor(status)}`}>
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

  const sortedData = React.useMemo(() => {
    if (!data?.length) return [];

    const grouped = _.groupBy(data, "scroll.id");

    return Object.entries(grouped)
      .map(([scrollId, segments]) => ({
        scrollId,
        scrollNum: segments[0].scroll.num,
        isFragment: segments[0].scroll.isFragment,
        segments: sortField
          ? _.orderBy(
              segments,
              [
                (item) => {
                  const value = getSortValue(item, sortField);
                  return typeof value === "string"
                    ? value.toLowerCase()
                    : value;
                },
              ],
              [sortDirection]
            )
          : segments,
      }))
      .sort(
        (a, b) =>
          (a.isFragment ? 10000 : 0) +
          a.scrollNum -
          ((b.isFragment ? 10000 : 0) + b.scrollNum)
      );
  }, [data, sortField, sortDirection]);

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

  const SegmentRow = ({
    row,
    item,
    fileTypes,
    renderStatusIcon,
    renderFileColumn,
  }) => (
    <TableRow key={`${row.scrollId}-${row.id}`} className="hover:bg-gray-50">
      <TableCell className="font-medium">{row.scrollId}</TableCell>
      <TableCell>{row.scrollNum}</TableCell>
      <TableCell>
        <a
          href={row.baseUrl}
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {row.id}
        </a>
      </TableCell>
      <TableCell className="text-center">{renderStatusIcon(item)}</TableCell>
      {fileTypes.map((type) => (
        <React.Fragment key={`${row.id}-${type}`}>
          {renderFileColumn(row[type])}
        </React.Fragment>
      ))}
    </TableRow>
  );

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="group-by-scroll"
            checked={isGrouped}
            onCheckedChange={(checked) => setIsGrouped(checked)}
          />
          <label
            htmlFor="group-by-scroll"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Group by Scroll
          </label>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
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
                {renderStatusSummary(calculateOverallSummary())}
              </TableHead>
              {fileTypes.map((type) => (
                <TableHead key={type} colSpan={2} className="bg-gray-50">
                  {type}
                  {renderStatusSummary(calculateColumnSummary(type))}
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
                      Status/URL {renderSortIcon(`${type}_status`)}
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
          </TableHeader>
          <TableBody>
            {isGrouped
              ? sortedData.map(({ scrollId, segments }) => {
                  const isExpanded = expandedGroups.has(scrollId);
                  return (
                    <React.Fragment key={scrollId}>
                      <TableRow className="bg-gray-100">
                        <TableCell colSpan={3}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleGroup(scrollId)}
                              className="hover:bg-gray-200 p-1 rounded"
                            >
                              {isExpanded ? (
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
                            const allStats = segments.reduce(
                              (acc, item) => {
                                const status = checkSegmentStatus(item);
                                if (status === "ok") acc.ok++;
                                acc.total++;
                                return acc;
                              },
                              { ok: 0, total: 0 }
                            );
                            const percentage = (
                              (allStats.ok / allStats.total) *
                              100
                            ).toFixed(1);
                            return (
                              <div
                                className={`text-sm ${allStats.ok === allStats.total ? "text-green-600" : "text-gray-600"}`}
                              >
                                {allStats.ok}/{allStats.total}
                                <br />({percentage}%)
                              </div>
                            );
                          })()}
                        </TableCell>
                        {fileTypes.map((type) => {
                          const stats =
                            calculateScrollSummary(segments).fileTypes[type];
                          const percentage = stats.total
                            ? ((stats.ok / stats.total) * 100).toFixed(1)
                            : 0;
                          return (
                            <React.Fragment key={`${scrollId}-${type}-summary`}>
                              <TableCell colSpan={2} className="text-center">
                                <div
                                  className={`text-sm ${stats.ok === stats.total ? "text-green-600" : "text-gray-600"}`}
                                >
                                  {stats.ok}/{stats.total}
                                  <br />({percentage}%)
                                </div>
                              </TableCell>
                            </React.Fragment>
                          );
                        })}
                      </TableRow>
                      {isExpanded &&
                        segments.map((item) => {
                          const row = createSegmentRow(item);
                          return (
                            <SegmentRow
                              key={`${row.scrollId}-${row.id}`}
                              row={row}
                              item={item}
                              fileTypes={fileTypes}
                              renderStatusIcon={renderStatusIcon}
                              renderFileColumn={renderFileColumn}
                            />
                          );
                        })}
                    </React.Fragment>
                  );
                })
              : (sortField
                  ? _.orderBy(
                      data,
                      [
                        (item) => {
                          const value = getSortValue(item, sortField);
                          return typeof value === "string"
                            ? value.toLowerCase()
                            : value;
                        },
                      ],
                      [sortDirection]
                    )
                  : data
                ).map((item) => {
                  const row = createSegmentRow(item);
                  return (
                    <SegmentRow
                      key={`${row.scrollId}-${row.id}`}
                      row={row}
                      item={item}
                      fileTypes={fileTypes}
                      renderStatusIcon={renderStatusIcon}
                      renderFileColumn={renderFileColumn}
                    />
                  );
                })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SegmentUrlReport;
