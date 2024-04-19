import React from "react";
import DicomViewer from "./DicomViewer.js";
import Header from "./Header.js";
import DicomMultiframeViewer from "./DicomMultiframeViewer.js";
// import DicomViewerOther from "./DicomeVieweOther";

function App() {
  return (
    <div className="App">
      <Header />
      <DicomMultiframeViewer />
      {/* <DicomViewer /> */}
    </div>
  );
}

export default App;
