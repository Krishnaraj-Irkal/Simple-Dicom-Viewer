import React, { useEffect, useRef, useState } from "react";
import cornerstone from "cornerstone-core";
import * as cornerstoneMath from "cornerstone-math";
import * as cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import * as cornerstoneNIFTIImageLoader from "cornerstone-nifti-image-loader";

// Initialize cornerstone tools
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

cornerstoneTools.init();
cornerstoneNIFTIImageLoader.external.cornerstone = cornerstone;

const ImageId = cornerstoneNIFTIImageLoader.nifti.ImageId;

const NiftiViewer = () => {
  const fileInputRef = useRef(null);
  const viewerZRef = useRef(null);
  const viewerXRef = useRef(null);
  const viewerYRef = useRef(null);
  const [stacks, setStacks] = useState({ z: null, x: null, y: null });

  useEffect(() => {
    cornerstone.enable(viewerZRef.current);
    cornerstone.enable(viewerXRef.current);
    cornerstone.enable(viewerYRef.current);
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      loadAndViewImage(`nifti:${url}`);
    }
  };

  const loadAndViewImage = (imageId) => {
    console.log("Loading and viewing NIFTI imageId:", imageId);

    const loadAndDisplayImage = (element, imageId, dimension) => {
      const imageIdObject = ImageId.fromURL(imageId);
      cornerstone.loadImage(imageIdObject.url).then((image) => {
        console.log('image', image);
        const numberOfSlices = cornerstone.metaData.get(
          "multiFrameModule",
          image.imageId
        ).numberOfFrames;

        const stack = {
          currentImageIdIndex: imageIdObject.slice.index,
          imageIds: Array.from(
            Array(numberOfSlices),
            (_, i) =>
              `nifti:${imageIdObject.filePath}#${dimension}-${i},t-${imageIdObject.timePoint}`
          ),
        };

        const viewport = cornerstone.getDefaultViewportForImage(element, image);
        console.log('viewport', viewport);
        cornerstone.displayImage(element, image, viewport);

        setStacks((prevStacks) => ({
          ...prevStacks,
          [dimension]: stack,
        }));
      });
    };

    loadAndDisplayImage(viewerZRef.current, `${imageId}`);
    // loadAndDisplayImage(viewerXRef.current, `${imageId}`, "x");
    // loadAndDisplayImage(viewerYRef.current, `${imageId}`, "y");
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
    <div className="nifti-viewer">
      <header className="nifti-header">NIFTI Image Viewer</header>
      <input
        type="file"
        accept=".nii,.nii.gz"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="file-input"
      />
      <div className="viewer-container" style={{ display: 'flex', justifyContent: 'space-around' }}>
        <div>
          <h3>Axial</h3>
          <div
            ref={viewerZRef}
            id="nifti-image-z"
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
            id="nifti-image-x"
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
            id="nifti-image-y"
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

export default NiftiViewer;
