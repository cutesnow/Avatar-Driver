type FrameLoopOptions = {
  video: HTMLVideoElement;
  targetFps: number;
  onFrame: (bitmap: ImageBitmap, timestampMs: number) => void;
};

export function startVideoFrameLoop({
  video,
  targetFps,
  onFrame,
}: FrameLoopOptions) {
  let stopped = false;
  let inFlight = false;
  let lastFrameAt = 0;
  const intervalMs = 1000 / targetFps;

  async function tick(now: number) {
    if (stopped) {
      return;
    }

    if (
      !inFlight &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      now - lastFrameAt >= intervalMs
    ) {
      inFlight = true;
      lastFrameAt = now;

      try {
        const bitmap = await createImageBitmap(video);
        onFrame(bitmap, now);
      } finally {
        inFlight = false;
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  return () => {
    stopped = true;
  };
}
