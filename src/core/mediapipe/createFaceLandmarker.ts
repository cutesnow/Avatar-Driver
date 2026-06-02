import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export async function createFaceLandmarker(
  modelPath: string,
  wasmBasePath: string,
) {
  const vision = await FilesetResolver.forVisionTasks(wasmBasePath);

  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: modelPath,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  });
}
