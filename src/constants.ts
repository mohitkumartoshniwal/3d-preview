export enum APPLICATION_CONSTANTS {
  viewTypeId = "3d-preview.viewer",
  READY = "ready",

  openInTextEditorCommand = "3d-preview.openInTextEditor",
  openPreviewCommand = "3d-preview.showPreview",
  openInViewerCommand = "3d-preview.openInViewer",
}

export enum MODEL_TYPES {
  FBX = "fbx",
  GLB = "glb",
  GLTF = "gltf",
}
// ~ /glb$|gltf$|3ds$|dae$|fbx$|obj$|stl$|ply$/

// (resourceExtname == '.glb' || resourceExtname == '.fbx' ||  resourceExtname == '.gltf')
