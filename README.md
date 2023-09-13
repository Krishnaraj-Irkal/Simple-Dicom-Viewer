# Simple DICOM Image Viewer

This is a simple DICOM image viewer created using DicomParser, Cornerstone, and Cornerstone WADO Image Loader. It allows users to load and view DICOM images in a web application.

## Installation

To use this DICOM image viewer in your project, you can install the required packages using npm. Run the following command:

```bash
npm install cornerstone-core cornerstone-web-image-loader dicom-parser
```

## SimpleExampleViewer Component

The `SimpleExampleViewer` component is a React-based DICOM image viewer that provides the following features:

- Select a DICOM file using a file input.
- Display the selected DICOM image on an interactive canvas.
- Automatically resize the canvas to fit the viewport.
- Enable zooming, panning, and window leveling for image navigation.
- Properly clean up resources and event listeners when the component is unmounted.

You can customize the appearance and behavior of the viewer by modifying the component's code to suit your specific requirements.
