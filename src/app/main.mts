import "./style.css";

import {
  AmbientLight,
  AnimationAction,
  AnimationMixer,
  Clock,
  DirectionalLight,
  LoadingManager,
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import { Pane } from "tweakpane";

import type { WebviewApi } from "vscode-webview";
import { APPLICATION_CONSTANTS, MODEL_TYPES } from "../constants.js";

// @ts-ignore
const vscode: WebviewApi<unknown> = acquireVsCodeApi();

vscode.postMessage({ type: APPLICATION_CONSTANTS.READY });

const overlay = document.querySelector(".model-preview-overlay") as HTMLElement;
const loaderContainer = document.querySelector(
  ".loader-container"
) as HTMLElement;
const errorMessage = document.querySelector(".error-message") as HTMLElement;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.5/"
);

const loadingManager = new LoadingManager();

// loadingManager.onError = () => {
// };

// ADD LOADERS HERE
const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);

const fbxLoader = new FBXLoader(loadingManager);

const pane = new Pane() as any;

const environmentFolder = pane.addFolder({
  title: "Environment",
});

const PARAMS = {
  Theme: "dark",
  Scale: 1,
  Animations: "",
};

const lightBinding = environmentFolder.addBinding(PARAMS, "Theme", {
  options: { Dark: "dark", Light: "light" },
});

const modelFolder = pane.addFolder({
  title: "Model",
});

const scaleBinding = modelFolder.addBinding(PARAMS, "Scale", {
  step: 0.1,
  min: 0.1,
  max: 5,
});

lightBinding.on("change", (e: any) => {
  if (e.value === "light") {
    renderer.setClearColor("#D3D3D3");
  } else if (e.value === "dark") {
    renderer.setClearColor("#1e1e1e");
  }
});

scaleBinding.on("change", (e: any) => {
  let scale = e.value;
  model?.scale.set(scale, scale, scale);
});

// Canvas
const canvas = document.querySelector(".experience") as HTMLCanvasElement;

// Scene
const scene = new Scene();

const ambientLight = new AmbientLight();
scene.add(ambientLight);

// Create directional light
const directionalLight = new DirectionalLight(0xffffff, 2); // color, intensity
directionalLight.position.set(0, 10, 2); // Set position of the light
scene.add(directionalLight); // Add light to the scene

let model: Object3D | null = null;
let animationMixer: AnimationMixer | null = null;
let animationActions: Record<string, AnimationAction> = {};

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(0, 0, 8);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new WebGLRenderer({
  canvas,
  antialias: true,
  // alpha: true,
});

environmentFolder.on("change", (e: any) => {
  if (e.value === "light") {
    renderer.setClearColor("#D3D3D3");
  } else if (e.value === "dark") {
    renderer.setClearColor("#1e1e1e");
  }
});
renderer.setClearColor("#1e1e1e");
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const clock = new Clock();

renderer.setAnimationLoop((time) => {
  const delta = clock.getDelta();

  controls.update();

  if (animationMixer) {
    animationMixer.update(delta);
  }

  renderer.render(scene, camera);
});

window.addEventListener("message", async (event) => {
  const message = event.data;
  const { type } = message;
  const url = URL.createObjectURL(new Blob([event.data.blob as Uint8Array]));

  // ADD LOADERS HANDLE LOGIC HERE
  try {
    if (type === MODEL_TYPES.FBX) {
      const fbxModel = await fbxLoader.loadAsync(url);
      // model = fbxModel.children[0];
      model = fbxModel;
      scene.add(model);
      addAnimationsToFolder({ model: fbxModel, type });
    } else if ([MODEL_TYPES.GLB, MODEL_TYPES.GLTF].includes(type)) {
      const gltfModel = await gltfLoader.loadAsync(url);
      model = gltfModel.scene;
      scene.add(model);
      addAnimationsToFolder({ model: gltfModel, type });
    }
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
  } catch (error) {
    loaderContainer.style.display = "none";
    errorMessage.style.display = "block";
  }
});

let currentAnimation: AnimationAction | null = null;
let DEFAULT = "DEFAULT";

function addAnimationsToFolder({
  model,
  type,
}: {
  model: any;
  type: MODEL_TYPES;
}) {
  if (model.animations.length === 0) {
    return;
  }

  // SPECIFIC LOADER ANIMATION LOGIC
  if (type === MODEL_TYPES.FBX) {
    animationMixer = new AnimationMixer(model);
  } else if ([MODEL_TYPES.GLTF, MODEL_TYPES.GLB].includes(type)) {
    animationMixer = new AnimationMixer(model.scene);
  }

  for (const animation of model.animations) {
    animationActions[animation.name] = animationMixer!.clipAction(animation);
  }

  const options = Object.keys(animationActions).map((value) => ({
    text: value,
    value: value,
  }));

  // Added no animation entry in the ui panel
  options.unshift({
    text: "",
    value: DEFAULT,
  });

  const animationsBinding = modelFolder.addBinding(PARAMS, "Animations", {
    view: "list",
    options,
    value: "",
  });

  animationsBinding.on("change", (e: any) => {
    const name = e.value;

    const newAction = animationActions[name];
    const oldAction = currentAnimation;

    if (name === DEFAULT) {
      oldAction?.fadeOut(0.5);
      return;
    }

    if (oldAction) {
      oldAction.fadeOut(0.5);
      newAction.reset().play().fadeIn(0.5);
    } else {
      newAction.play();
    }
    currentAnimation = newAction;
  });
}
