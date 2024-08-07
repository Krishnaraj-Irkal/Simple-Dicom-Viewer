import React, { useEffect, useRef, useState } from "react";
import cornerstone from "cornerstone-core";
import * as cornerstoneTools from "cornerstone-tools";
import * as dicomParser from "dicom-parser";
import dcmjs from "dcmjs";
import Hammer from "hammerjs";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as cornerstoneMath from "cornerstone-math";

// Function to extract metadata using dcmjs
const extractMetaDataWithDcmjs = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
  const metaData = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);
  return metaData;
};

// Initialize cornerstone tools
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.init();

// Initialize cornerstoneWADOImageLoader
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

if (!cornerstoneWADOImageLoader.initialized) {
  const config = {
    webWorkerPath: "/static/codecs/cornerstoneWADOImageLoaderWebWorker.js",
    taskConfiguration: {
      decodeTask: {
        codecsPath: "/static/codecs/cornerstoneWADOImageLoaderCodecs.js",
      },
    },
  };
  cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
  cornerstoneWADOImageLoader.initialized = true;
}

const DicomViewports = () => {
  const fileInputRef = useRef(null);
  const viewerZRef = useRef(null); // Axial view
  const viewerXRef = useRef(null); // Coronal view
  const viewerYRef = useRef(null); // Sagittal view
  const [stacks, setStacks] = useState({ z: null, x: null, y: null });

  useEffect(() => {
    cornerstone.enable(viewerZRef.current);
    cornerstone.enable(viewerXRef.current);
    cornerstone.enable(viewerYRef.current);
  }, []);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const metaData = await extractMetaDataWithDcmjs(file);
      loadAndViewImage(`wadouri:${url}`, metaData);
    }
  };

  const loadAndViewImage = (imageId, metaData) => {
    console.log("Loading and viewing DICOM imageId:", imageId);
    console.log("Extracted metadata:", metaData);

    const loadAndDisplayImage = (element, imageId, dimension) => {
      cornerstone.loadImage(imageId).then((image) => {
        const numberOfSlices = metaData.NumberOfFrames || 1;
        const stack = {
          currentImageIdIndex: 0,
          imageIds: Array.from(Array(numberOfSlices), (_, i) => `${imageId}?frame=${i}`),
        };

        const viewport = cornerstone.getDefaultViewportForImage(element, image);
        cornerstone.displayImage(element, image, viewport);

        setStacks((prevStacks) => ({
          ...prevStacks,
          [dimension]: stack,
        }));

      }).catch(error => {
        console.error("Error loading image:", error);
      });
    };

    loadAndDisplayImage(viewerZRef.current, `${imageId}`, "z");
    loadAndDisplayImage(viewerXRef.current, `${imageId}`, "x");
    loadAndDisplayImage(viewerYRef.current, `${imageId}`, "y");
  };

  const changeFrame = (dimension, step) => {
    const stack = stacks[dimension];
    if (stack) {
      const newIndex = stack.currentImageIdIndex + step;
      if (newIndex >= 0 && newIndex < stack.imageIds.length) {
        setStacks((prevStacks) => ({
          ...prevStacks,
          [dimension]: { ...stack, currentImageIdIndex: newIndex },
        }));
        const newImageId = stack.imageIds[newIndex];
        cornerstone.loadImage(newImageId).then((image) => {
          cornerstone.displayImage(
            dimension === "z" ? viewerZRef.current : dimension === "x" ? viewerXRef.current : viewerYRef.current,
            image
          );
        });
      }
    }
  };

  return (
    <div className="dicom-viewer">
      <header className="dicom-header">DICOM Image Viewer</header>
      <input
        type="file"
        accept=".dcm,.dicom"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="file-input"
      />
      <div className="viewer-container" style={{ display: 'flex', justifyContent: 'space-around' }}>
        <div>
          <h3>Axial</h3>
          <div
            ref={viewerZRef}
            id="dicom-image-z"
            style={{ width: "500px", height: "500px", background: "black" }}
          ></div>
          {stacks.z && (
            <div className="navigation-buttons">
              <button onClick={() => changeFrame("z", -1)}>Previous Z Frame</button>
              <button onClick={() => changeFrame("z", 1)}>Next Z Frame</button>
            </div>
          )}
        </div>
        <div>
          <h3>Coronal</h3>
          <div
            ref={viewerXRef}
            id="dicom-image-x"
            style={{ width: "500px", height: "500px", background: "black" }}
          ></div>
          {stacks.x && (
            <div className="navigation-buttons">
              <button onClick={() => changeFrame("x", -1)}>Previous X Frame</button>
              <button onClick={() => changeFrame("x", 1)}>Next X Frame</button>
            </div>
          )}
        </div>
        <div>
          <h3>Sagittal</h3>
          <div
            ref={viewerYRef}
            id="dicom-image-y"
            style={{ width: "500px", height: "500px", background: "black" }}
          ></div>
          {stacks.y && (
            <div className="navigation-buttons">
              <button onClick={() => changeFrame("y", -1)}>Previous Y Frame</button>
              <button onClick={() => changeFrame("y", 1)}>Next Y Frame</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DicomViewports;
