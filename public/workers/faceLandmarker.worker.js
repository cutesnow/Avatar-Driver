self.exports = {};
importScripts("../wasm/vision_bundle.js");

let landmarker;

function post(response) {
  self.postMessage(response);
}

self.onmessage = async (event) => {
  try {
    if (event.data.type === "init") {
      const { FaceLandmarker, FilesetResolver } = self.exports;
      const fileset = await FilesetResolver.forVisionTasks(
        event.data.wasmBasePath,
      );

      landmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: event.data.modelPath,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });

      post({ type: "ready" });
      return;
    }

    if (!landmarker) {
      throw new Error("FaceLandmarker worker has not been initialized.");
    }

    const startedAt = performance.now();
    const { bitmap, timestampMs } = event.data;
    const result = landmarker.detectForVideo(bitmap, timestampMs);
    bitmap.close();

    const blendshapes =
      result.faceBlendshapes[0]?.categories.reduce((scores, category) => {
        scores[category.categoryName] = category.score;
        return scores;
      }, {}) ?? {};

    const landmarks = result.faceLandmarks[0]?.map((landmark) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
    }));

    const matrix =
      result.facialTransformationMatrixes[0]?.data !== undefined
        ? Array.from(result.facialTransformationMatrixes[0].data)
        : undefined;

    const frame = {
      timestampMs,
      detected: result.faceLandmarks.length > 0,
      blendshapes,
      landmarks,
      headPose: matrix
        ? {
            rotation: matrixToEuler(matrix),
            matrix,
          }
        : undefined,
    };

    post({
      type: "result",
      frame,
      latencyMs: performance.now() - startedAt,
    });
  } catch (error) {
    post({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

function matrixToEuler(matrix) {
  const m11 = matrix[0];
  const m12 = matrix[4];
  const m13 = matrix[8];
  const m22 = matrix[5];
  const m23 = matrix[9];
  const m32 = matrix[6];
  const m33 = matrix[10];

  const y = Math.asin(Math.max(-1, Math.min(1, m13)));
  const x =
    Math.abs(m13) < 0.99999 ? Math.atan2(-m23, m33) : Math.atan2(m32, m22);
  const z = Math.abs(m13) < 0.99999 ? Math.atan2(-m12, m11) : 0;

  return { x, y, z };
}
