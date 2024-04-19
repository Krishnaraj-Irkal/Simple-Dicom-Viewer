import React, { useEffect } from "react";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneMath from "cornerstone-math";
import * as cornerstoneTools from "cornerstone-tools";
import * as dicomParser from "dicom-parser";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import Hammer from "hammerjs";

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

cornerstoneTools.init();

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

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

console.log("cornerstoneTools", cornerstoneTools);

export default function DicomMultiframeViewer() {
  // Use useEffect to initialize cornerstoneWADOImageLoader
  useEffect(() => {
    // Configure cornerstoneWADOImageLoader
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    const element = document.getElementById("dicomImage");
    cornerstone.enable(element);
    console.log(cornerstone);
  }, []); // Empty dependency array ensures this effect runs only once

  // Function to handle file upload
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      loadAndViewImage(file);
    }
  };

  var loaded = false;
  // Function to load and view the DICOM file
  const loadAndViewImage = (file) => {
    const element = document.getElementById("dicomImage");
    const url = URL.createObjectURL(file);
    // Call your loadAndViewImage function here with the file or pass it to another component if needed
    console.log("Loading and viewing DICOM file:", file.name, url);
    cornerstoneWADOImageLoader.wadouri.dataSetCacheManager
      .load(url, cornerstoneWADOImageLoader.internal.xhrRequest)
      .then(function (dataSet) {
        // dataset is now loaded, get the # of frames so we can build the array of imageIds
        var numFrames = dataSet.intString("x00280008");
        console.log("dataset" + dataSet);
        console.log("Number of frames:" + numFrames);
        var FrameRate = 1000 / dataSet.floatString("x00181063");
        console.log("Frame Rate:" + FrameRate);
        if (!numFrames) {
          alert("Missing element NumberOfFrames (0028,0008)");
          return;
        }

        var imageIds = [];
        var imageIdRoot = "wadouri:" + url;

        for (var i = 0; i < numFrames; i++) {
          var imageId = imageIdRoot + "?frame=" + i;
          imageIds.push(imageId);
        }

        var stack = {
          currentImageIdIndex: 0,
          imageIds: imageIds,
        };

        // Load and cache the first image frame.  Each imageId cached by cornerstone increments
        // the reference count to make sure memory is cleaned up properly.
        cornerstone.loadAndCacheImage(imageIds[0]).then(
          function (image) {
            console.log(image);
            // now that we have an image frame in the cornerstone cache, we can decrement
            // the reference count added by load() above when we loaded the metadata.  This way
            // cornerstone will free all memory once all imageId's are removed from the cache
            cornerstoneWADOImageLoader.wadouri.dataSetCacheManager.unload(url);

            cornerstone.displayImage(element, image);
            if (loaded === false) {
              cornerstoneTools.setToolActive("Wwwc", { mouseButtonMask: 1 }); // Activate the WwwcTool
              // Set the stack as tool state
              cornerstoneTools.addStackStateManager(element, [
                "stack",
                "playClip",
              ]);
              cornerstoneTools.addToolState(element, "stack", stack);
              // Start playing the clip
              cornerstoneTools.playClip(element, FrameRate);
              loaded = true;
            }
          },
          function (err) {
            alert(err);
          }
        );
      });
  };

  return (
    <div>
      <div className="row">
        <form id="form" className="form-horizontal">
          <div className="form-group">
            <label className="control-label col-sm-1" htmlFor="dicomFile">
              DICOM File
            </label>
            <div className="col-sm-8">
              <input
                className="form-control"
                type="file"
                id="dicomFile"
                accept=".dcm"
                onChange={handleFileSelect} // Attach onChange event listener
              />
            </div>
          </div>
        </form>
      </div>
      <div
        style={{
          width: 512,
          height: 512,
          position: "relative",
          color: "white",
          display: "inline-block",
          borderStyle: "solid",
          borderColor: "black",
        }}
        className="disable-selection noIbar"
      >
        <div
          id="dicomImage"
          style={{
            width: 512,
            height: 512,
            top: 0,
            left: 0,
            position: "absolute",
          }}
        />
      </div>
    </div>
  );
}
