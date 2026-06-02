export async function createCameraStream(
  video: HTMLVideoElement,
  signal?: AbortSignal,
) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support camera access.");
  }

  if (!window.isSecureContext) {
    throw new Error("Camera access requires HTTPS, except on localhost.");
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
      audio: false,
    });

    if (signal?.aborted) {
      stream.getTracks().forEach((track) => track.stop());
      throw new DOMException("Camera start was cancelled.", "AbortError");
    }

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();

    return stream;
  } catch (error) {
    const mediaError = error as DOMException;

    if (mediaError.name === "NotAllowedError") {
      throw new Error(
        "Camera permission was denied. If you are using the Codex in-app browser, open this page in Chrome instead. Otherwise, allow camera access for this site and make sure Chrome has camera permission in system settings, then click Start Camera again.",
      );
    }

    if (mediaError.name === "NotReadableError") {
      throw new Error("The camera is already in use by another app.");
    }

    if (mediaError.name === "AbortError") {
      throw mediaError;
    }

    throw new Error(mediaError.message || "Unable to start the camera.");
  }
}
