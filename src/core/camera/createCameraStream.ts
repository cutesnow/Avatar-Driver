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

    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.srcObject = stream;

    await waitForVideoReady(video, signal);
    await playVideo(video, signal);

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

function waitForVideoReady(video: HTMLVideoElement, signal?: AbortSignal) {
  if (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
  ) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Camera video did not become ready. Try Start Camera again."));
    }, 8000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };

    const onReady = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("Camera video stream failed to load."));
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Camera start was cancelled.", "AbortError"));
    };

    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("error", onError);
    signal?.addEventListener("abort", onAbort, { once: true });

    if (signal?.aborted) {
      onAbort();
      return;
    }

    onReady();
  });
}

async function playVideo(video: HTMLVideoElement, signal?: AbortSignal) {
  try {
    await video.play();
  } catch (error) {
    if (signal?.aborted) {
      throw new DOMException("Camera start was cancelled.", "AbortError");
    }

    const mediaError = error as DOMException;

    if (mediaError.name === "AbortError") {
      await waitForVideoReady(video, signal);
      await video.play();
      return;
    }

    throw error;
  }
}
