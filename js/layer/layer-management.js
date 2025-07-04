let finalLayerOrder = [];
let lastHighlightGuid = null;

function updateLayerPanel() {
  console.time('updateLayerPanel');


  var layers = canvas.getObjects().slice().reverse();
  var layerContent = $("layer-content");
  layerContent.innerHTML = "";
  var guidMap = createGUIDMap(layers);

  layers.forEach((layer) => {
    if (!layer.guids || layer.guids.length === 0) {
      layer.guids = [];
    }
  });

  let isEven = true;
  finalLayerOrder = [];

  function processLayerHierarchy(layer, processedLayers = new Set(), level = 0) {
    if (processedLayers.has(layer)) {
      return;
    }
    
    processedLayers.add(layer);
    finalLayerOrder.push({layer: layer, level: level});

    if (layer.guids && layer.guids.length > 0) {
      const childLayers = layer.guids
        .map(guid => guidMap.get(guid))
        .filter(child => child !== undefined)
        .sort((a, b) => {
          const aIsBubblePart = isSpeechBubblePart(a);
          const bIsBubblePart = isSpeechBubblePart(b);

          if (aIsBubblePart && !bIsBubblePart) {
            return -1; // a (bubble part) comes before b (non-bubble part)
          } else if (!aIsBubblePart && bIsBubblePart) {
            return 1;  // b (bubble part) comes before a (non-bubble part)
          }

          // If both are bubble parts or neither are, maintain original order
          const indexA = layers.indexOf(a);
          const indexB = layers.indexOf(b);
          return indexA - indexB;
        });

      childLayers.forEach(childLayer => {
        processLayerHierarchy(childLayer, processedLayers, level + 1);
      });
    }
  }

  const topLevelLayers = layers.filter(layer => {
    const isChildOfAnotherLayer = layers.some(parentLayer => 
      parentLayer.guids && parentLayer.guids.includes(layer.guid)
    );
    return (layer.isPanel || isSpeechBubbleSVG(layer)) && !isChildOfAnotherLayer;
  });

  topLevelLayers.forEach(layer => {
    processLayerHierarchy(layer);
  });

  const remainingLayers = layers.filter(layer => 
    !finalLayerOrder.some(item => item.layer === layer)
  );

  remainingLayers.forEach(layer => {
    finalLayerOrder.push({layer: layer, level: 0});
  });

  finalLayerOrder.forEach(({layer, level}, index) => {
    if (!layer.excludeFromLayerPanel) {
      var layerDiv = Object.assign(document.createElement("div"), {
        className: "layer-item",
      });
      var previewDiv = Object.assign(document.createElement("div"), {
        className: "layer-preview",
      });
      var detailsDiv = Object.assign(document.createElement("div"), {
        className: "layer-details",
      });
      var nameTextArea = Object.assign(document.createElement("input"), {
        className: "layer-name",
      });
      var buttonsDiv = Object.assign(document.createElement("div"), {
        className: "layer-buttons",
      });

      if (isLayerPreview(layer)) {
        createPreviewImage(layer, previewDiv);
      } else if (isText(layer)) {
        var fullText = layer.text;
        nameTextArea.value = fullText.substring(0, 20);
      } else if (isVerticalText(layer)) {
        var fullText = layer.name;
        if (fullText) {
          nameTextArea.value = fullText.substring(0, 15);
        } else {
          layer.name = "verticalText";
          fullText = layer.name;
          nameTextArea.value = fullText.substring(0, 15);
        }
      }

      setNameTextAreaProperties(layer, nameTextArea, index);

      if (isText(layer)) {
        detailsDiv.style.display = "flex";
        detailsDiv.style.alignItems = "center";
      }

      detailsDiv.appendChild(nameTextArea);

      putViewButton(buttonsDiv, layer, index);
      putMoveLockButton(buttonsDiv, layer, index);
      if (isImage(layer)) {
        putCheckButton(buttonsDiv, layer, index);
      }

      if (layer.isPanel) {
        putRunT2IButton(buttonsDiv, layer, index);
        putSeedButton(buttonsDiv, layer, index);
        putCropImageDownloadButton(buttonsDiv, layer, index);
      }
      if (layer.type == "image") {
        putRunI2IButton(buttonsDiv, layer, index);
        putPromptButton(buttonsDiv, layer, index);
        putInterrogateDanbooruButtons(buttonsDiv, layer, index);
        putInterrogateClipButtons(buttonsDiv, layer, index);
        putImageDownloadButton(buttonsDiv, layer, index);
        putRembgButton(buttonsDiv, layer, index);
      }
      putDeleteButton(buttonsDiv, layer, index);

      layerDiv.setAttribute("data-guid", layer.guid);


      if (isLayerPreview(layer)) {
        layerDiv.appendChild(previewDiv);
      }

      layerDiv.appendChild(detailsDiv);
      detailsDiv.appendChild(buttonsDiv);

      layerDiv.onclick = function () {
        canvas.setActiveObject(layer);
        canvas.renderAll();
        highlightActiveLayer(index);
        updateControls(layer);
      };

      if (level > 0) {
        layerDiv.style.border = 'none';
        layerDiv.style.marginLeft = `${level * 18}px`;
        layerDiv.style.paddingLeft = "5px";
        layerDiv.style.borderLeft = getCssValue('--boader-color-2px-solid-C');
      } else {
        layerDiv.style.border = 'none';
        isEven = !isEven;
      }

      const activeObject = canvas.getActiveObject();
      if(lastHighlightGuid && activeObject && 
         layer.guid == activeObject.guid && 
         lastHighlightGuid == layer.guid){
          
        layerDiv.style.background = "#9da600";
      }else if(isEven) {
        layerDiv.style.background = getCssValue('--odd-layer');
      } else {
        layerDiv.style.background = getCssValue('--even-layer');
      }

      layerContent.appendChild(layerDiv);
    }
  });

  console.timeEnd('updateLayerPanel');
}

function setNameTextAreaProperties(layer, nameTextArea, index) {
  nameTextArea.value = layer.name || nameTextArea.value || layer.type + `${index + 1}`;

  layer.name = nameTextArea.value;
  nameTextArea.rows = 1;
  nameTextArea.style.resize = "none";
  nameTextArea.style.width = "100%";
  nameTextArea.style.boxSizing = "border-box";
  nameTextArea.style.border = "none";
  // nameTextArea.style.borderBottom = '1px solid #cccccc';
  nameTextArea.style.outline = "none";
  nameTextArea.style.color = getCssValue("--text-color-B");
  nameTextArea.style.borderColor = getCssValue("--boader-color-1px-solid-B");
  nameTextArea.style.background = getCssValue("--background-color-B");
  nameTextArea.oninput = function () {
    layer.name = nameTextArea.value;
  };

  if (isText(layer)) {
    nameTextArea.value = layer.text;
    nameTextArea.style.flex = "1";
    nameTextArea.style.marginRight = "5px";
  }
  // console.log("layer.text", layer.text);
  if (isImage(layer) && layer.text) {
    nameTextArea.value = layer.text;
  }
}


function calculateCenter(layer) {
  const centerX = layer.left + (layer.width / 2) * layer.scaleX;
  const centerY = layer.top + (layer.height / 2) * layer.scaleY;
  return { centerX, centerY };
}

function createPreviewImage(layer, layerDiv) {
  var previewDiv = document.createElement("div");
  var canvasSize = 120;

  var tempCanvas = document.createElement("canvas");

  tempCanvas.width = canvasSize;
  tempCanvas.height = canvasSize;
  var tempCtx = tempCanvas.getContext("2d");
  tempCtx.fillStyle = "#ffcccc";

  var nowVisible = layer.visible;
  layer.visible = true;
  
  if (isGroup(layer)) {
    var boundingBox = layer.getBoundingRect();
    var groupWidth = boundingBox.width;
    var groupHeight = boundingBox.height;

    var scale = Math.min(canvasSize / groupWidth, canvasSize / groupHeight);

    var offsetX = (canvasSize - groupWidth * scale) / 2;
    var offsetY = (canvasSize - groupHeight * scale) / 2;

    tempCtx.save();
    tempCtx.translate(offsetX, offsetY);
    tempCtx.scale(scale, scale);
    tempCtx.translate(-boundingBox.left, -boundingBox.top);

    layer.getObjects().forEach(function (obj) {
      obj.render(tempCtx);
    });

    tempCtx.restore();
  } else if (layer.type === "path") {
    // console.log("Layer is a path");
    var pathBounds = layer.getBoundingRect();
    var pathWidth = pathBounds.width;
    var pathHeight = pathBounds.height;

    var scale = Math.min(canvasSize / pathWidth, canvasSize / pathHeight);
    var offsetX = (canvasSize - pathWidth * scale) / 2;
    var offsetY = (canvasSize - pathHeight * scale) / 2;

    tempCtx.save();
    tempCtx.translate(offsetX, offsetY);
    tempCtx.scale(scale, scale);
    tempCtx.translate(-pathBounds.left, -pathBounds.top);
    layer.render(tempCtx);

    tempCtx.restore();
  } else if (isImage(layer) && typeof layer.getElement === "function") {
    var imgElement = layer.getElement();
    var imgWidth = imgElement.width;
    var imgHeight = imgElement.height;

    var scale = Math.min(canvasSize / imgWidth, canvasSize / imgHeight);
    var drawWidth = imgWidth * scale;
    var drawHeight = imgHeight * scale;

    var offsetX = (canvasSize - drawWidth) / 2;
    var offsetY = (canvasSize - drawHeight) / 2;

    tempCtx.drawImage(imgElement, offsetX, offsetY, drawWidth, drawHeight);
  } else if (isPanelType(layer)) {
    var layerCanvas = layer.toCanvasElement();
    var layerWidth = layer.width;
    var layerHeight = layer.height;

    var layerScale = Math.min(
      canvasSize / layerWidth,
      canvasSize / layerHeight
    );
    var layerDrawWidth = layerWidth * layerScale;
    var layerDrawHeight = layerHeight * layerScale;

    var layerOffsetX = (canvasSize - layerDrawWidth) / 2;
    var layerOffsetY = (canvasSize - layerDrawHeight) / 2;

    tempCtx.drawImage(
      layerCanvas,
      layerOffsetX,
      layerOffsetY,
      layerDrawWidth,
      layerDrawHeight
    );
  } else {
    layer.render(tempCtx);
  }
  layer.visible = nowVisible;
  
  var imageUrl = tempCanvas.toDataURL();
  previewDiv.style.backgroundImage = "url(" + imageUrl + ")";
  previewDiv.style.backgroundSize = "contain";
  previewDiv.style.backgroundPosition = "center";
  previewDiv.style.backgroundRepeat = "no-repeat";
  previewDiv.className = "layer-preview";
  layerDiv.appendChild(previewDiv);
}

function removeLayer(layer) {
  canvas.remove(layer);
  updateLayerPanel();

  if (canvas.getActiveObject() === layer) {
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  } else {
    canvas.requestRenderAll();
  }
}

function highlightClear() {
  var layers = document.querySelectorAll(".layer-item");
  layers.forEach(layer => layer.classList.remove("active"));

  updateLayerPanel();
}


function highlightActiveLayer(activeIndex) {
  highlightActiveLayerByCanvas();
}

function highlightActiveLayerByCanvas(object=null) {

  highlightClear();

  lastHighlightGuid = null;
  let activeObject;
  if(object){
    activeObject = object;
  }else{
    activeObject = canvas.getActiveObject();
  }
  
  updateControls(activeObject);
  if(isPanel(activeObject)){
    showT2IPrompts(activeObject);
  }else if(isImage(activeObject)){
    showI2IPrompts(activeObject);
  }else{
    noShowPrompt();
  }

  const layerDiv = document.querySelector(`.layer-item[data-guid="${activeObject.guid}"]`);
  if(layerDiv) {
    layerDiv.style.background = "#9da600";
    lastHighlightGuid = activeObject.guid;
  }
}


function getLayerIndexByActiveObject(targetObject) {
  if (!targetObject || !finalLayerOrder || finalLayerOrder.length === 0) return -1;
   
  const normalIndex = finalLayerOrder.findIndex(item => item.layer === targetObject);
  const result = finalLayerOrder.length - normalIndex;
  return result;
 }

// Function to enforce the visual layer order onto the canvas stacking order
function enforceLayerOrder() {
  if (!canvas || finalLayerOrder.length === 0) {
    // console.log("enforceLayerOrder: Canvas not ready or finalLayerOrder is empty.");
    return;
  }

  const canvasObjects = canvas.getObjects();
  const totalObjectsOnCanvas = canvasObjects.length;
  let operationsPerformed = 0;

  // Iterate through finalLayerOrder (which is top-to-bottom visually)
  // The object at finalLayerOrder[0] should be at the highest canvas index.
  finalLayerOrder.forEach((itemInFinalOrder, indexInFinalOrder) => {
    const fabricObject = itemInFinalOrder.layer;
    // Desired canvas index: top item in finalLayerOrder -> highest index on canvas
    const desiredCanvasIndex = totalObjectsOnCanvas - 1 - indexInFinalOrder;

    // Current actual index of the object on the canvas
    const currentCanvasIndex = canvasObjects.indexOf(fabricObject);

    if (currentCanvasIndex !== -1 && currentCanvasIndex !== desiredCanvasIndex) {
      // console.log(`Moving '${fabricObject.name || fabricObject.type}' from canvas index ${currentCanvasIndex} to ${desiredCanvasIndex}`);
      fabricObject.moveTo(desiredCanvasIndex);
      operationsPerformed++;
      if (isSpeechBubblePart(fabricObject)) {
        fabricObject.set('dirty', true);
        fabricObject.set('visible', true); // Ensure it's visible
      }
    } else if (currentCanvasIndex === -1) {
      // This shouldn't happen if finalLayerOrder is correctly derived from current canvas objects
      // and no objects are removed between updateLayerPanel and this function.
      // console.warn("enforceLayerOrder: Object from finalLayerOrder not found on canvas:", fabricObject);
    }
  });

  if (operationsPerformed > 0) {
    // console.log(`enforceLayerOrder: ${operationsPerformed} objects moved. Rendering canvas.`);
    canvas.renderAll();
  } else {
    // console.log("enforceLayerOrder: Layer order already consistent. No canvas render needed.");
  }
}

function LayersUp() {
  var activeObject = canvas.getActiveObject();
  if (activeObject) {
    activeObject.bringForward();
    canvas.renderAll();
    updateLayerPanel();
    saveState();
  }
}

function LayersDown() {
  var activeObject = canvas.getActiveObject();
  if (activeObject) {
    activeObject.sendBackwards();
    canvas.renderAll();
    updateLayerPanel();
    saveState();
  }
}





