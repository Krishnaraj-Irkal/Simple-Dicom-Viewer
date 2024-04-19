import React from "react";

export default function Header() {
  return (
    <div>
      <div>
        <div className="page-header">
          <h1>
            Example of displaying a DICOM P10 multiframe images using
            Cornerstone
          </h1>
          <p className="lead">
            Select a DICOM file from your local system to view it using
            cornerstone.
            <button
              id="toggleCollapseInfo"
              className="btn btn-primary"
              type="button"
            >
              Click for more info
            </button>
          </p>
        </div>
        <div id="collapseInfo" className="collapse" style={{ display: "none" }}>
          <p>
            This example illustrates how to use the cornerstoneWADOImageLoader
            to get a DICOM P10 SOP instance using HTTP and display it in your
            web browser using cornerstone. Not all transfer syntaxes are
            currently supported,
            <a href="https://github.com/cornerstonejs/cornerstoneWADOImageLoader/blob/master/docs/TransferSyntaxes.md">
              click here for the full list.
            </a>
            For WADO-URI requests, you can request that the server return the
            SOP Instance in explicit little endian by appending the following
            query string to your URL:
            <code>&amp;transferSyntax=1.2.840.10008.1.2.1</code>
          </p>
          <strong>
            If you get an HTTP error and your URL is correct, it is probably
            because the server is not configured to allow
            <a href="http://en.wikipedia.org/wiki/Cross-origin_resource_sharing">
              Cross Origin Requests
            </a>
            . Most browsers will allow you to enable cross domain requests via
            settings or command line switches, you can start chrome with the
            command line switch <code>--disable-web-security</code> to allow
            cross origin requests. See the
            <a href="http://enable-cors.org/">Enable CORS site</a> for
            information about CORS.
          </strong>
          <br />
          <br />
          <p>
            Looking for a CORS proxy? Try
            <a href="https://www.npmjs.com/package/corsproxy">CORSProxy</a>
          </p>
          <strong>
            Use of this example require IE10+ or any other modern browser.
          </strong>
          <hr />
        </div>
      </div>
    </div>
  );
}
