import React, { useEffect, useRef } from "react";
import cornerstone from "cornerstone-core";
// import * as cornerstoneMath from "cornerstone-math";
import dicomParser from "dicom-parser";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
// import * as cornerstoneTools from "cornerstonejs/tools";
// import Hammer from "hammerjs";

// import "./DicomViewer.css"; // Import CSS for styling
// console.log(corne/rstoneTools);
// Externals
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
// cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
// cornerstoneTools.external.cornerstone = cornerstone;
// cornerstoneTools.external.Hammer = Hammer;

// WadoImageLoader Registration/Config
if (!cornerstoneWADOImageLoader.initialized) {
  const config = {
    webWorkerPath: "/static/codecs/cornerstoneWADOImageLoaderWebWorker.js",
    taskConfiguration: {
      decodeTask: {
        codecsPath: "static/codecs/cornerstoneWADOImageLoaderCodecs.js",
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
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target.result;
        const blob = new Blob([fileData]);
        const imageId =
          cornerstoneWADOImageLoader.wadouri.fileManager.add(blob);

        await cornerstone
          .loadImage(imageId)
          .then((image) => {
            // Retrieve image dimensions
            const width = image.width;
            const height = image.height;
            console.log(image);
            console.log(width);
            console.log(height);

            // Set the canvas size to match the image dimensions
            const canvas = canvasRef.current;
            canvas.width = width;
            canvas.height = height;
            console.log(canvas.width);
            cornerstone.resize(canvas);
            cornerstone.displayImage(canvas, image);
          })
          .catch((error) => {
            console.error("Error loading or displaying image:", error);
          });
      };

      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="dicom-viewer">
      <header className="dicom-header">DICOM Image Viewer</header>
      <input
        type="file"
        accept=".dcm"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="file-input"
      />
      <div ref={canvasRef} style={{ width: "800px", height: "600px" }}></div>
    </div>
  );
}

export default DicomViewer;

