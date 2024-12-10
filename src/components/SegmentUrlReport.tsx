import React, { useState, useEffect } from "react";
import { Table } from "@/components/ui/table";
import { CheckCircle, XCircle, AlertCircle, ArrowUpDown } from "lucide-react";
import _ from "lodash";

const SegmentUrlReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/segments/url-report");
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

  // Order of file types matching the SegmentReport class
  const fileTypes = ["mask", "area", "obj", "ppm", "meta", "layer0", "layer32"];

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
        <td className="p-2 border text-center" colSpan="2">
          -
        </td>
      );

    const status = normalizeStatus(fileInfo.status);
    const showLink = status?.toLowerCase() !== "404";

    return (
      <>
        <td className={`p-2 border text-center ${getStatusColor(status)}`}>
          {showLink ? (
            <a
              href={fileInfo.url}
              className="hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {status}
            </a>
          ) : (
            <span>{status}</span>
          )}
        </td>
        <td className="p-2 border text-right">
          {status === "404" ? "-" : formatFileSize(fileInfo.size)}
        </td>
      </>
    );
  };

  const sortedData = React.useMemo(() => {
    if (!sortField) return data;

    return _.orderBy(
      data,
      [
        (item) => {
          const value = getSortValue(item, sortField);
          return typeof value === "string" ? value.toLowerCase() : value;
        },
      ],
      [sortDirection]
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

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left border" colSpan="2">
              Scroll
            </th>
            <th className="p-2 text-left border">Segment ID</th>
            <th
              className="p-2 text-center border cursor-pointer"
              onClick={() => handleSort("overallStatus")}
            >
              Status {renderSortIcon("overallStatus")}
              {renderStatusSummary(calculateOverallSummary())}
            </th>
            {fileTypes.map((type) => (
              <th
                key={type}
                className="p-2 text-left border bg-gray-200"
                colSpan="2"
              >
                {type}
                {renderStatusSummary(calculateColumnSummary(type))}
              </th>
            ))}
          </tr>
          <tr className="bg-gray-50">
            <th className="p-2 text-left border">ID</th>
            <th className="p-2 text-left border">#</th>
            <th className="p-2 text-left border">ID</th>
            <th className="p-2 text-center border">All OK?</th>
            {fileTypes.map((type) => (
              <React.Fragment key={`${type}-subheaders`}>
                <th
                  className="p-2 text-left border cursor-pointer"
                  onClick={() => handleSort(`${type}_status`)}
                >
                  Status/URL {renderSortIcon(`${type}_status`)}
                </th>
                <th
                  className="p-2 text-left border cursor-pointer"
                  onClick={() => handleSort(`${type}_size`)}
                >
                  Size {renderSortIcon(`${type}_size`)}
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => {
            const row = createSegmentRow(item);
            return (
              <tr
                key={`${row.scrollId}-${row.id}`}
                className="hover:bg-gray-50"
              >
                <td className="p-2 border font-medium">{row.scrollId}</td>
                <td className="p-2 border">{row.scrollNum}</td>
                <td className="p-2 border">{row.id}</td>
                <td className="p-2 border text-center">
                  {renderStatusIcon(item)}
                </td>
                {fileTypes.map((type) => (
                  <React.Fragment key={`${row.id}-${type}`}>
                    {renderFileColumn(row[type])}
                  </React.Fragment>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SegmentUrlReport;
