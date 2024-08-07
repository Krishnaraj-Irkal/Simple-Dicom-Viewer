import React, { useState } from "react";
import DicomViewer from "./DicomViewer.js";
import Header from "./Header.js";
import DicomMultiframeViewer from "./DicomMultiframeViewer.js";
import NiftiViewer from "./NiftiViewer.js";
import DicomViewports from "./DicomViewports.js";
import DicomDirViewer from "./DicomDirViewer.js";
import NiftiSingleFileViewer from "./NiftiSingleFileViewer.js";

function App() {
  const [activeViewer, setActiveViewer] = useState(null);

  const renderViewer = () => {
    switch (activeViewer) {
      case "DicomViewer":
        return <DicomViewer />;
      case "DicomMultiframeViewer":
        return <DicomMultiframeViewer />;
      case "NiftiViewer":
        return <NiftiViewer />;
      case "NiftiSingleFileViewer":
        return <NiftiSingleFileViewer />;
      case "DicomViewports":
        return <DicomViewports />;
      case "DicomDirViewer":
        return <DicomDirViewer />;
      default:
        return <div>Please select a viewer</div>;
    }
  };

  return (
    <div className="App">
      <Header />
      <div>
        <button onClick={() => setActiveViewer("DicomViewer")}>
          Open DicomViewer
        </button>
        <button onClick={() => setActiveViewer("DicomMultiframeViewer")}>
          Open DicomMultiframeViewer
        </button>
        <button onClick={() => setActiveViewer("NiftiViewer")}>
          Open NiftiViewer
        </button>
        <button onClick={() => setActiveViewer("NiftiSingleFileViewer")}>
          Open Single NiftiViewer
        </button>
        <button onClick={() => setActiveViewer("DicomViewports")}>
          Open DicomViewports
        </button>
        <button onClick={() => setActiveViewer("DicomDirViewer")}>
          Open Dicom Director Viewer
        </button>
      </div>
      {renderViewer()}
    </div>
  );
}

export default App;
