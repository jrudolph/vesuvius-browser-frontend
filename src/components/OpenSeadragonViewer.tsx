import React, { useEffect, useRef, useState } from "react";
import OpenSeadragon from "openseadragon";

const OpenSeadragonViewer = ({
  containerId = "openseadragon1",
  allLayers = [],
  extraLayers = [],
}) => {
  const viewerRef = useRef(null);
  //const [index, setIndex] = useState(0);
  const [position, setPosition] = useState("");
  const [ppmSocket, setPpmSocket] = useState(null);

  const layerSource = (layer) => {
    const relative = `${layer}/dzi`;
    return relative;
  };

  useEffect(() => {
    let index = 0;

    console.log("All Layers:", allLayers);
    const viewer = OpenSeadragon({
      id: containerId,
      prefixUrl: "/openseadragon/images/",
      tileSources: allLayers.map((l) => ({
        tileSource: layerSource(l),
        opacity: 0,
        preload: 0,
        layer: l,
      })),
      initialPage: 6,
      showNavigator: true,
      showRotationControl: true,
      zoomPerClick: 1.0,
      preserveViewport: true,
      preload: true,
      debugMode: false,
    });

    viewerRef.current = viewer;
    //setIndex(0);

    const sibling = (idx, shownIdx) => {
      if (idx >= viewer.world.getItemCount())
        idx = viewer.world.getItemCount() - 1;
      if (idx < 0) idx = 0;
      if (idx === shownIdx) return;

      const tiledImage = viewer.world.getItemAt(idx);
      tiledImage.setOpacity(0);
      tiledImage.setPreload(true);
    };

    const disableSibling = (idx) => {
      if (idx >= viewer.world.getItemCount())
        idx = viewer.world.getItemCount() - 1;
      if (idx < 0) idx = 0;

      const tiledImage = viewer.world.getItemAt(idx);
      tiledImage.setPreload(false);
    };

    const show = (nextIndex) => {
      disableSibling(index - 1);
      disableSibling(index + 1);

      const oldTiledImage = viewer.world.getItemAt(index);
      const oldIndex = index;

      if (nextIndex >= viewer.world.getItemCount())
        nextIndex = viewer.world.getItemCount() - 1;
      if (nextIndex < 0) nextIndex = 0;

      index = nextIndex;

      const newTiledImage = viewer.world.getItemAt(nextIndex);
      oldTiledImage.setOpacity(0);
      oldTiledImage.setPreload(false);
      newTiledImage.setOpacity(1);

      sibling(nextIndex - 1, nextIndex);
      sibling(nextIndex + 1, nextIndex);

      const showButton = (button, show) => {
        if (show) button.enable();
        else button.disable();
      };

      showButton(viewer.previousButton, nextIndex - 1 >= 0);
      showButton(
        viewer.nextButton,
        nextIndex + 1 < viewer.world.getItemCount()
      );
      updateHash();
    };

    const updateHash = () => {
      const tile = viewer.world.getItemAt(index);
      const imp = tile.viewportToImageCoordinates(
        viewer.viewport.getCenter(true)
      );
      const u = imp.x.toFixed(0);
      const v = imp.y.toFixed(0);
      const rot = viewer.viewport.getRotation();
      const flip = viewer.viewport.getFlip();
      const zoom = tile
        .viewportToImageZoom(viewer.viewport.getZoom(true))
        .toFixed(3);
      const newHash = `#u=${u}&v=${v}&zoom=${zoom}&rot=${rot}&flip=${flip}&layer=${allLayers[index]}`;
      history.replaceState(undefined, undefined, newHash);
    };

    const showNext = () => {
      show(index + 1);
    };

    viewer.bindSequenceControls();
    viewer.previousButton.removeAllHandlers("release");
    viewer.previousButton.addHandler("release", () => show(index - 1));
    viewer.nextButton.removeAllHandlers("release");
    viewer.nextButton.addHandler("release", showNext);

    viewer.goToPreviousPage = function () {
      show(index - 1);
    };
    viewer.goToNextPage = function () {
      show(index + 1);
    };

    viewer.addHandler("pan", updateHash);
    viewer.addHandler("zoom", updateHash);
    viewer.addHandler("rotate", updateHash);

    viewer.addHandler("open", () => {
      const hash = window.location.hash.substring(1);
      viewer.canvas.focus();

      const params = {};
      hash.split("&").forEach((hk) => {
        const [key, value] = hk.split("=");
        params[key] = value;
      });

      const tile = viewer.world.getItemAt(index);
      if (params.x || params.u) {
        const u = params.u ? parseFloat(params.u) : parseFloat(params.x);
        const v = params.v ? parseFloat(params.v) : parseFloat(params.y);
        const imp = new OpenSeadragon.Point(u, v);
        viewer.viewport.panTo(tile.imageToViewportCoordinates(imp), true);
      }

      if (params.zoom) {
        viewer.viewport.zoomTo(
          tile.imageToViewportZoom(parseFloat(params.zoom)),
          true
        );
      }
      if (params.rot) {
        viewer.viewport.setRotation(parseFloat(params.rot), true);
      }
      if (params.flip) {
        viewer.viewport.setFlip(params.flip === "true", true);
      }
      if (params.layer) {
        const i = allLayers.indexOf(params.layer);
        show(i);
      } else {
        show(allLayers.indexOf("32"));
      }
    });

    const keyMapping = {};
    extraLayers.forEach((layer, i) => {
      keyMapping[`${i + 1}`] = allLayers.indexOf(layer);
    });

    viewer.addHandler("canvas-key", (event) => {
      const idx = keyMapping[event.originalEvent.key];
      if (idx !== undefined) {
        const opacity = allLayers[idx] === "3000" ? 0.3 : 0.75;
        viewer.world.getItemAt(idx).setOpacity(opacity);
      }
    });

    viewer.innerTracker.keyUpHandler = (event) => {
      const idx = keyMapping[event.originalEvent.key];
      if (idx !== undefined) {
        viewer.world.getItemAt(idx).setOpacity(0);
      }
    };

    viewer.pixelsPerArrowPress = 250;

    // WebSocket connection setup
    const connectSocket = () => {
      //const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
      //const host = window.location.host;
      const protocol = "wss://";
      const host = "vesuvius.virtual-void.net";
      const socket = new WebSocket(
        `${protocol}${host}${window.location.pathname}ppm`
      );

      socket.onopen = () => {
        setPpmSocket(socket);
      };

      socket.onclose = () => {
        setTimeout(connectSocket, 3000);
      };

      socket.onmessage = (event) => {
        if (event.data === "ping") return;

        const [u, v, x, y, z] = event.data.split(",").map(Number);
        setPosition(
          `u: ${u} v: ${v} layer:${allLayers[index]}\nx: ${x}, y: ${y}, z: ${z}`
        );
      };
    };

    connectSocket();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div id={containerId} className="w-full h-screen">
        <div className="float-left w-96">
          <div className="position">{position}</div>
        </div>
      </div>
    </div>
  );
};

export default OpenSeadragonViewer;
