import { useEffect, useMemo, useRef, useState } from "react";
import OpenSeadragon from "openseadragon";

const OpenSeadragonViewer = ({
  containerId = "openseadragon1",
  scrollNum,
  segmentId,
  allLayers = [],
  extraLayers = [],
}) => {
  const viewerRef = useRef(null);
  const [extIndex, setExtIndex] = useState(0);
  const [position, setPosition] = useState("");
  const [fragment, setFragment] = useState({});
  const [viewerContainer, setViewerContainer] = useState(null);

  useEffect(() => {
    const getFragmentValues = () => {
      const fragment = window.location.hash.substring(1);

      setFragment(fragment);
    };

    getFragmentValues();
  }, []);

  const [ppmSocket, setPpmSocket] = useState(null);

  const layerSource = (layer) => {
    const relative = `/scroll/${scrollNum}/segment/${segmentId}/${layer}/dzi`;
    return relative;
  };

  const requestInfo = useRef({
    cachedPosition: { x: 0, y: 0, z: 0 },
    lastRequest: { u: 0, v: 0 },
    lastResponse: { x: 0, y: 0, z: 0 },
    nextRequest: { u: 0, v: 0 },
    callback: null,
  });

  useEffect(() => {
    const connectSocket = () => {
      //const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
      //const host = window.location.host;
      const protocol = "wss://";
      const host = "vesuvius.virtual-void.net";
      const socket = new WebSocket(
        `${protocol}${host}/scroll/${scrollNum}/segment/${segmentId}/ppm`
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
        if (
          requestInfo.current.nextRequest.u == u &&
          requestInfo.current.nextRequest.v == v
        ) {
          requestInfo.current.lastResponse = { x: x, y: y, z: z };
          requestInfo.current.lastRequest = requestInfo.current.nextRequest;
          if (requestInfo.current.callback) {
            requestInfo.current.callback(requestInfo.current.lastResponse);
            requestInfo.current.callback = null;
          }
        }
      };
    };

    connectSocket();
  }, [scrollNum, segmentId]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewerContainer) return;

    const layers = allLayers;

    function requestXYZ(webPoint, f) {
      const viewportPoint = viewer.viewport.pointFromPixel(webPoint);
      const tiledImage = viewer.world.getItemAt(extIndex);
      const imagePoint = tiledImage.viewportToImageCoordinates(viewportPoint);
      const u = imagePoint.x.toFixed();
      const v = imagePoint.y.toFixed();

      if (
        requestInfo.current.lastRequest.u == u &&
        requestInfo.current.lastRequest.v == v
      ) {
        f(requestInfo.current.lastResponse);
      } else if (ppmSocket && ppmSocket.readyState == 1) {
        requestInfo.current.nextRequest.u = u;
        requestInfo.current.nextRequest.v = v;
        requestInfo.current.callback = f;
        ppmSocket.send(`${u},${v}`);
      }
    }

    function updatePosition(position) {
      const positionEl = document.querySelectorAll("#position")[0];
      if (position) {
        const webPoint = position;
        const viewportPoint = viewer.viewport.pointFromPixel(webPoint);
        const tiledImage = viewer.world.getItemAt(extIndex);
        const imagePoint = tiledImage.viewportToImageCoordinates(viewportPoint);
        const u = imagePoint.x.toFixed();
        const v = imagePoint.y.toFixed();

        requestXYZ(webPoint, (data) => {
          requestInfo.current.cachedPosition = data;
          positionEl.innerHTML =
            `u: ${u} v: ${v} layer:${layers[extIndex]}` +
            "<br>" +
            `x: ${data.x}, y: ${data.y}, z: ${data.z}`;
        });

        let color;
        if (
          requestInfo.current.lastRequest.u == u &&
          requestInfo.current.lastRequest.v == v
        ) {
          color = "";
        } else {
          color = "color: #eee;";
        }
        positionEl.innerHTML =
          `u: ${u} v: ${v} layer:${layers[extIndex]}` +
          "<br>" +
          `<span style="${color}">x: ${requestInfo.current.cachedPosition.x}, y: ${requestInfo.current.cachedPosition.y}, z: ${requestInfo.current.cachedPosition.z}</span> (Shift-click to open volume at this position)`;
      } else {
        positionEl.innerHTML = "";
      }
    }

    new OpenSeadragon.MouseTracker({
      element: viewerContainer,
      moveHandler: function (event) {
        updatePosition(event.position);
      },
    });
    viewer.addHandler("canvas-click", function (event) {
      if (event.shift) {
        // The canvas-click event gives us a position in web coordinates.
        const webPoint = event.position;

        if (scrollNum == 1)
          requestXYZ(webPoint, (data) => {
            window.open(
              `https://neuroglancer-demo.appspot.com/#!%7B%22dimensions%22:%7B%22z%22:%5B1%2C%22%22%5D%2C%22y%22:%5B1%2C%22%22%5D%2C%22x%22:%5B1%2C%22%22%5D%7D%2C%22position%22:%5B${data.z}%2C${data.y}%2C${data.x}%5D%2C%22crossSectionOrientation%22:%5B0.5%2C0.5%2C-0.5%2C-0.5%5D%2C%22crossSectionScale%22:9.97573495387749%2C%22projectionOrientation%22:%5B-0.15356537699699402%2C0.12269044667482376%2C0.013992083258926868%2C0.9803922176361084%5D%2C%22projectionScale%22:13614.041135923644%2C%22layers%22:%5B%7B%22type%22:%22image%22%2C%22source%22:%7B%22url%22:%22zarr2://https://dl.ash2txt.org/other/dev/scrolls/1/volumes/54keV_7.91um.zarr/%22%2C%22subsources%22:%7B%22default%22:true%2C%22bounds%22:true%7D%2C%22enableDefaultSubsources%22:false%7D%2C%22tab%22:%22source%22%2C%22name%22:%2254keV_7.91um.zarr%22%7D%5D%2C%22selectedLayer%22:%7B%22visible%22:true%2C%22layer%22:%2254keV_7.91um.zarr%22%7D%2C%22layout%22:%224panel%22%7D`,
              "_blank"
            );
          });
      }
    });
  }, [
    ppmSocket,
    scrollNum,
    segmentId,
    allLayers,
    viewerRef,
    extIndex,
    viewerContainer,
  ]);

  useEffect(() => {
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
      maxZoomLevel: 500,
      debugMode: false,
    });

    viewerRef.current = viewer;
    //setIndex(0);
    let index = 0;

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

      console.log("show", nextIndex);
      index = nextIndex;
      setExtIndex(nextIndex);

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
    const showPrevious = () => {
      show(index - 1);
    };

    viewer.bindSequenceControls();
    viewer.previousButton.removeAllHandlers("release");
    viewer.previousButton.addHandler("release", showPrevious);
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

    viewer.addHandler("canvas-scroll", function (event) {
      event.preventDefault = event.originalEvent.ctrlKey; // prevent zooming in web page when ctrl is pressed
      event.preventDefaultAction = !event.originalEvent.ctrlKey; // prevent zooming in image viewer when ctrl is not pressed
    });

    viewer.addHandler("open", () => {
      const hash = fragment;
      viewer.canvas.focus();
      setViewerContainer(viewer.container);

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

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [fragment, scrollNum, segmentId, allLayers, extraLayers]);

  return (
    <div className="w-full">
      <div id="position" className="position">
        Position: {position}
      </div>
      <div id={containerId} className="w-full h-screen"></div>
    </div>
  );
};

export default OpenSeadragonViewer;
