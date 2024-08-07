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

const NiftiSingleFileViewer = () => {
    const fileInputRef = useRef(null);
    const [currentImageIdIndex, setCurrentImageIdIndex] = useState(0);
    const [stack, setStack] = useState(null);
    const [element, setElement] = useState(null);

    useEffect(() => {
        const element = document.getElementById('nifti-image');
        setElement(element);
        cornerstone.enable(element);
    }, []);

    const loadAndViewImage = (imageId) => {
        const imageIdObject = ImageId.fromURL(imageId);
        cornerstone.loadAndCacheImage(imageIdObject.url).then((image) => {
            const numberOfSlices = cornerstone.metaData.get('multiFrameModule', imageIdObject.url)?.numberOfFrames || 1;
            const newStack = {
                currentImageIdIndex: imageIdObject.slice.index,
                imageIds: Array.from({ length: numberOfSlices }, (_, i) => `nifti:${imageIdObject.filePath}#${imageIdObject.slice.dimension}-${i}`)
            };
            setStack(newStack);
            setCurrentImageIdIndex(imageIdObject.slice.index);
            const viewport = cornerstone.getDefaultViewportForImage(element, image);
            cornerstone.displayImage(element, image, viewport);
        }).catch((err) => {
            alert(err);
            console.error("Error loading NIfTI image:", err);
        });
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            loadAndViewImage(`nifti:${url}`);
        }
    };

    const showPreviousSlice = () => {
        if (stack && currentImageIdIndex > 0) {
            const newIndex = currentImageIdIndex - 1;
            cornerstone.loadAndCacheImage(stack.imageIds[newIndex]).then((image) => {
                setCurrentImageIdIndex(newIndex);
                cornerstone.displayImage(element, image);
            });
        }
    };

    const showNextSlice = () => {
        if (stack && currentImageIdIndex < stack.imageIds.length - 1) {
            const newIndex = currentImageIdIndex + 1;
            cornerstone.loadAndCacheImage(stack.imageIds[newIndex]).then((image) => {
                setCurrentImageIdIndex(newIndex);
                cornerstone.displayImage(element, image);
            });
        }
    };

    return (
        <div className="nifti-viewer">
            <header className="nifti-header">Single NIFTI Image Viewer</header>
            <input
                type="file"
                accept=".nii,.nii.gz"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="file-input"
            />
            <div className="viewer-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                    id="nifti-image"
                    style={{ width: '600px', height: '600px', backgroundColor: 'black' }}
                ></div>
                {stack && (
                    <div className="controls" style={{ marginTop: '10px' }}>
                        <button onClick={showPreviousSlice}>Previous Slice</button>
                        <button onClick={showNextSlice}>Next Slice</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NiftiSingleFileViewer;
