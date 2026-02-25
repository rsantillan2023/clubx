export const openCameraRN = (type = "dniScanner") => {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type,
      })
    );
  }
};

export const downloadFileRN = ({data, fileName, exportType}) => {
  console.log('intenta descargar')
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "downloadFile",
        data,
        fileName,
        exportType,
      })
    );
  }
};
