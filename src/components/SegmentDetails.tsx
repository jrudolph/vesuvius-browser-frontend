import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import OpenSeadragonViewer from "./OpenSeadragonViewer";

const SegmentDetail = () => {
  const { scrollNum, segmentId } = useParams();
  const [segmentData, setSegmentData] = useState(null);

  useEffect(() => {
    // Fetch segment data from your data source
    // For now using placeholder data structure
    const data = {
      scroll: {
        num: scrollNum,
        id: "scroll_id",
        volume: "volume_1",
      },
      id: segmentId,
      energy: "40keV",
      resolution: "8μm",
      layers: [
        "mask",
        "grand-prize_17_32",
        "first-word_15_32",
        "grand-prize-inklabels",
        "first-letters-inklabels",
      ],
    };
    setSegmentData(data);
  }, [scrollNum, segmentId]);

  if (!segmentData) return <div>Loading...</div>;

  const getImageUrl = (layer) => {
    const baseUrl = `https://vesuvius.virtual-void.net/scroll/${scrollNum}/segment/${segmentId}`;
    if (layer === "mask") {
      return `${baseUrl}/mask?v2`;
    }
    return `${baseUrl}/inferred/${layer}?v2`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">
                Segment {segmentData.id}
              </CardTitle>
              <div className="space-y-1">
                <p className="text-gray-600">
                  Scroll: {segmentData.scroll.num}
                </p>
                <p className="text-gray-600">
                  Volume: {segmentData.scroll.volume}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{segmentData.energy}</Badge>
                  <Badge variant="outline">{segmentData.resolution}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layer Visualizations</CardTitle>
        </CardHeader>

        <CardContent>
          <OpenSeadragonViewer
            scrollNum={scrollNum}
            segmentId={segmentId}
            allLayers={["32", "34", "36"]} //segmentData.layers}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SegmentDetail;
