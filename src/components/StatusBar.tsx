import React, { useState, useEffect } from "react";
import { Server, Monitor } from "lucide-react";

const formatDate = (timestamp) => {
  try {
    return new Date(timestamp).toISOString();
  } catch (err) {
    console.warn("Failed to parse date:", timestamp, err);
    return "";
  }
};

const BuildInfo = ({ icon: Icon, label, buildInfo }) => (
  <div className="flex items-center space-x-4">
    <div className="flex items-center space-x-1">
      <Icon size={14} />
      <span className="text-gray-400">{label}:</span>
    </div>
    <span>{formatDate(buildInfo.buildTimeMillis)}</span>
    <span className="text-gray-400">|</span>
    <span>{buildInfo.commit}</span>
    <span className="text-gray-400">|</span>
    <span>{buildInfo.version}</span>
  </div>
);

const StatusBar = () => {
  const [backendInfo, setBackendInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBuildInfo = async () => {
      try {
        const response = await fetch("/api/version");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setBackendInfo(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchBuildInfo();
    const interval = setInterval(fetchBuildInfo, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const uiBuildInfo = {
    buildTimeMillis: import.meta.env.VITE_BUILD_TIME,
    commit: import.meta.env.VITE_BUILD_GIT_VERSION,
    version: import.meta.env.VITE_BUILD_VERSION,
  };

  return (
    <div className="bg-gray-100 text-gray-400 px-4 py-1.5 flex items-center justify-start space-x-8 text-xs">
      <BuildInfo icon={Monitor} label="UI" buildInfo={uiBuildInfo} />
      {error ? (
        <span className="text-red-400">Backend: {error}</span>
      ) : (
        backendInfo && (
          <BuildInfo icon={Server} label="API" buildInfo={backendInfo} />
        )
      )}
    </div>
  );
};

export default StatusBar;
