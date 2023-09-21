import React, { useEffect, useRef } from "react";
import cornerstone from "cornerstone-core";
import * as cornerstoneMath from "cornerstone-math";
import dicomParser from "dicom-parser";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";

// Externals
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;

// WadoImageLoader Registration/Config
if (!cornerstoneWADOImageLoader.initialized) {
  const config = {
    webWorkerPath: "/codecs/cornerstoneWADOImageLoaderWebWorker.js",
    taskConfiguration: {
      decodeTask: {
        codecsPath: "/codecs/cornerstoneWADOImageLoaderCodecs.js",
      },
    },
  };
  cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
  cornerstoneWADOImageLoader.initialized = true;
}

function DicomViewer() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    // Enable the Canvas for use with Cornerstone
    cornerstone.enable(canvas, {
      renderer: "webgl",
    });

    // Grab Tool Classes
    const WwwcTool = cornerstoneTools.WwwcTool;
    const PanTool = cornerstoneTools.PanTool;
    const PanMultiTouchTool = cornerstoneTools.PanMultiTouchTool;
    const ZoomTool = cornerstoneTools.ZoomTool;
    const ZoomTouchPinchTool = cornerstoneTools.ZoomTouchPinchTool;
    const ZoomMouseWheelTool = cornerstoneTools.ZoomMouseWheelTool;

    // Add them
    cornerstoneTools.addTool(PanTool);
    cornerstoneTools.addTool(ZoomTool);
    cornerstoneTools.addTool(WwwcTool);
    cornerstoneTools.addTool(PanMultiTouchTool);
    cornerstoneTools.addTool(ZoomTouchPinchTool);
    cornerstoneTools.addTool(ZoomMouseWheelTool);

    // Set tool modes
    cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 4 }); // Middle
    cornerstoneTools.setToolActive("Zoom", { mouseButtonMask: 2 }); // Right
    cornerstoneTools.setToolActive("Wwwc", { mouseButtonMask: 1 }); // Left & Touch
    cornerstoneTools.setToolActive("PanMultiTouch", {});
    cornerstoneTools.setToolActive("ZoomMouseWheel", {});
    cornerstoneTools.setToolActive("ZoomTouchPinch", {});
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
  
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target.result;
        const blob = new Blob([fileData]);
        const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(blob);
  
        await cornerstone.loadImage(imageId)
          .then((image) => {
            // Retrieve image dimensions
            console.log(image);
            const width = image.width;
            const height = image.height;
  
            // Set the canvas size to match the image dimensions
            const canvas = canvasRef.current;
            console.log(canvas);
            canvas.width = width;
            canvas.height = height;
            console.log(canvas);
            cornerstone.displayImage(canvas, image);
          })
          .catch((error) => {
            console.error("Error loading or displaying image:", error);
          });
      };
  
      reader.readAsArrayBuffer(file);
    }
  };

  // const canvasStyle = {
  //   width: "100%",
  //   height: "500px",
  // };

  return (
    <main>
      <input
        type="file"
        accept=".dcm"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <div ref={canvasRef}></div>
    </main>
  );
}

export default DicomViewer;
