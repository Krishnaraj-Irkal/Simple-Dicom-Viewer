import React, { useEffect, useRef } from "react";
import * as cornerstone from "cornerstone-core";
import dicomParser from "dicom-parser";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";

// Configure the WADO image loader
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

cornerstoneWADOImageLoader.webWorkerManager.initialize({
  webWorkerPath: "/codecs/cornerstoneWADOImageLoaderWebWorker.js",
  taskConfiguration: {
    decodeTask: {
      codecsPath: "/codecs/cornerstoneWADOImageLoaderCodecs.js",
    },
  },
});

function DicomViewer() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Declare a variable to track if the component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;

    // Enable the Canvas for use with Cornerstone
    cornerstone.enable(canvas, {
      renderer: "webgl",
    });

    // Handle resizing of the canvas when the window size changes
    const handleResize = () => {
      cornerstone.resize(canvas);
    };

    window.addEventListener("resize", handleResize);

    const handleFileChange = async (e) => {
      const file = e.target.files[0];

      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const fileData = event.target.result;
          const byteArray = new Uint8Array(fileData);
          const blob = new Blob([byteArray]);
          const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(blob);

          if (isMountedRef.current) {
            // Check if the component is still mounted before displaying the image
            await cornerstone.loadImage(imageId)
              .then((image) => {
                cornerstone.displayImage(canvas, image);

                // Fit the image to the viewport
                cornerstone.fitToWindow(canvas);
              })
              .catch((error) => {
                console.error("Error loading or displaying image:", error);
              });
          }
        };

        reader.readAsArrayBuffer(file);
      }
    };

    fileInputRef.current.addEventListener("change", handleFileChange);

    return () => {
      // Clean up event listeners and disable Cornerstone on unmount
      window.removeEventListener("resize", handleResize);
      fileInputRef.current.removeEventListener("change", handleFileChange);
      cornerstone.disable(canvas);
    };
  }, []);

  return (
    <div>
      <h2>Simple Example Viewer</h2>
      <input type="file" accept=".dcm" ref={fileInputRef} />
      <div style={{ display: "flex", justifyContent: "center" }}>
        <canvas
          ref={canvasRef}
          style={{ maxWidth: "100%", maxHeight: "80vh", border: '2px solid black' }}
        />
      </div>
    </div>
  );
}

export default DicomViewer;
