import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

export async function loadVRM(url: string): Promise<VRM> {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  const gltf = await loader.loadAsync(url);
  const vrm = gltf.userData.vrm as VRM | undefined;

  if (!vrm) {
    throw new Error("Loaded model is not a VRM avatar.");
  }

  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.removeUnnecessaryJoints(gltf.scene);
  vrm.scene.rotation.y = Math.PI;

  return vrm;
}
