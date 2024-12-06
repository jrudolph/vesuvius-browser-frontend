import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";

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
          <Tabs defaultValue="texture" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="texture">Texture</TabsTrigger>
              <TabsTrigger value="surface">Surface Volume</TabsTrigger>
              <TabsTrigger value="models">ML Models</TabsTrigger>
              <TabsTrigger value="inklabels">Ink Labels</TabsTrigger>
            </TabsList>

            <TabsContent value="texture">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={getImageUrl("mask")}
                  alt="Texture Image"
                  className="rounded-lg object-cover w-full"
                />
              </div>
            </TabsContent>

            <TabsContent value="surface">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="relative">
                    <img
                      src={getImageUrl(`surface_${i + 1}`)}
                      alt={`Surface Layer ${i + 1}`}
                      className="rounded-lg object-cover w-full"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
                      Layer {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="models">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="mb-2 font-semibold">Grand Prize Model</h3>
                  <img
                    src={getImageUrl("grand-prize_17_32")}
                    alt="Grand Prize Model"
                    className="rounded-lg object-cover w-full"
                  />
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">First Letters Model</h3>
                  <img
                    src={getImageUrl("first-word_15_32")}
                    alt="First Letters Model"
                    className="rounded-lg object-cover w-full"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inklabels">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {segmentData.layers.includes("grand-prize-inklabels") && (
                  <div>
                    <h3 className="mb-2 font-semibold">
                      Grand Prize Ink Labels
                    </h3>
                    <img
                      src={getImageUrl("grand-prize-inklabels")}
                      alt="Grand Prize Ink Labels"
                      className="rounded-lg object-cover w-full"
                    />
                  </div>
                )}
                {segmentData.layers.includes("first-letters-inklabels") && (
                  <div>
                    <h3 className="mb-2 font-semibold">
                      First Letters Ink Labels
                    </h3>
                    <img
                      src={getImageUrl("first-letters-inklabels")}
                      alt="First Letters Ink Labels"
                      className="rounded-lg object-cover w-full"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SegmentDetail;
