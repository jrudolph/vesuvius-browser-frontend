import React, { useState, useEffect, useRef } from "react";

const Range = ({ min = 0, max = 100, start = 25, end = 75 }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const validMin = Math.min(min, max);
  const validMax = Math.max(min, max);
  const validStart = Math.max(validMin, Math.min(validMax, start));
  const validEnd = Math.max(validStart, Math.min(validMax, end));

  const range = validMax - validMin;
  const startPercent = ((validStart - validMin) / range) * 100;
  const endPercent = ((validEnd - validMin) / range) * 100;

  const showLabels = containerWidth > 160;
  const showValues = containerWidth > 120;

  return (
    <div className="w-full" ref={containerRef}>
      {showValues && (
        <div className="flex items-center">
          <div className="" />
          <div className="flex-1 relative">
            <div className="h-4 text-xs text-gray-600">
              <span
                className="absolute"
                style={{
                  left: `${startPercent}%`,
                  transform: "translateX(-100%)",
                }}
              >
                {validStart}
              </span>
              <span
                className="absolute"
                style={{ left: `${endPercent}%`, transform: "translateX(0%)" }}
              >
                {validEnd}
              </span>
            </div>
          </div>
          <div className="" />
        </div>
      )}

      <div className="flex items-center">
        <span className="text-xs text-gray-500 w-6 text-right pr-2">
          {showLabels && validMin}
        </span>

        <div className="flex-1 relative h-2 bg-gray-100 rounded-full">
          <div
            className="absolute inset-y-0 bg-blue-400 rounded-full"
            style={{
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`,
            }}
          />
        </div>

        <span className="text-xs text-gray-500 w-6 pl-2">
          {showLabels && validMax}
        </span>
      </div>
    </div>
  );
};

export default Range;
