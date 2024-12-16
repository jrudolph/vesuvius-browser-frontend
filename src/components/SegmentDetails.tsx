import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import OpenSeadragonViewer from "./OpenSeadragonViewer";
import { ExternalLink } from "lucide-react";
import VolumeBadge from "./VolumeBadge";
import { getLayerUrl, layerLabels } from "./VesuviusTable";

const SegmentDetail = () => {
  const { scrollNum, segmentId } = useParams();
  const [segmentData, setSegmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/segments/scroll/${scrollNum}/${segmentId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((jsonData) => {
        setSegmentData(jsonData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [segmentId]);

  if (!segmentData) return <div>Loading...</div>;

  const getImageUrl = (layer) => {
    const baseUrl = `https://vesuvius.virtual-void.net/scroll/${scrollNum}/segment/${segmentId}`;
    if (layer === "mask") {
      return `${baseUrl}/mask?v2`;
    }
    return `${baseUrl}/inferred/${layer}?v2`;
  };

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">
                <div className="flex flex-nowrap mb-1">
                  <span>
                    Scroll {segmentData.scroll.num} / {segmentData.scroll.id} /{" "}
                    Segment {segmentData.id}
                  </span>
                  <a href={segmentData.urls.baseUrl} target="_blank">
                    <ExternalLink className="h-7 w-7" />
                  </a>
                </div>
                <div>{VolumeBadge(segmentData.volume)}</div>
              </CardTitle>
              <div className="flex flex-nowrap"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="gap-2 text-sm">
              <div>
                Author:{" "}
                <span className="font-medium">{segmentData.author}</span>
              </div>
              <div>
                Area:{" "}
                <span className="font-medium">{segmentData.areaCm2} cm²</span>
              </div>
              <div>
                Width:{" "}
                <span className="font-medium">{segmentData.width}px</span>
              </div>
              <div>
                Height:{" "}
                <span className="font-medium">{segmentData.height}px</span>
              </div>
              <div>
                Min Z: <span className="font-medium">{segmentData.minZ}</span>
              </div>
              <div>
                Max Z: <span className="font-medium">{segmentData.maxZ}</span>
              </div>
            </div>
          </div>
          <OpenSeadragonViewer
            scrollNum={scrollNum}
            segmentId={segmentId}
            allLayers={["32", "34", "36", "38", ...segmentData.layers]}
            extraLayers={segmentData.layers}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Layers</CardTitle>
        </CardHeader>
        <CardContent>
          {segmentData.layers.map((layer) => (
            <div className="grid grid-cols-2 mb-2">
              <div className="flex align-middle">
                <div>{layerLabels[layer]}</div>
                <a
                  href={getLayerUrl(scrollNum, segmentId, layer, true)}
                  className="ml-2"
                  download
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
              <div>
                <a
                  href={getLayerUrl(scrollNum, segmentId, layer, true, true)}
                  target="_blank"
                >
                  <img
                    src={getLayerUrl(scrollNum, segmentId, layer)}
                    loading="lazy"
                  />
                </a>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SegmentDetail;
