function changeSpeechBubble() {
    // console.log("-------------");
    var bubbleStrokewidht = parseFloat($("bubbleStrokewidht").value);
    var fillColor   = $("bubbleFillColor").value;
    var strokeColor = $("bubbleStrokeColor").value;
    var opacity     = $("speechBubbleOpacity").value;
    changeSpeechBubbleSVG(bubbleStrokewidht, fillColor, strokeColor, opacity);

}
function changeSpeechBubbleSVG(bubbleStrokewidht, fillColor, strokeColor, opacity){
    opacity = opacity / 100;  
    var fillColorRgba   = hexToRgba(fillColor,opacity);
    var strokeColorRgba = hexToRgba(strokeColor,1.0);

    console.log("changeSpeechBubbleSVG:", bubbleStrokewidht, fillColorRgba, strokeColorRgba, opacity);

    var activeObject = canvas.getActiveObject();
    if (activeObject) {

            let isExistsFillArea = false;
            if(isPath(activeObject)){
                activeObject.set({
                    stroke: strokeColorRgba,
                    strokeWidth: bubbleStrokewidht,
                    fill: fillColorRgba
                });
            }else{
                activeObject.forEachObject((obj) => {
                    if( obj.data?.originalId === "fillArea"){
                        isExistsFillArea = true;
                        return;
                    }
                });
                activeObject.forEachObject((obj) => {
                    if( isExistsFillArea ){
                        if( obj.data?.originalId === "fillArea"){
                            obj.set({ stroke: "rgba(0,0,0,0)", fill:fillColorRgba, strokeWidth:0});
                        }else{
                            obj.set({ stroke: strokeColorRgba , fill:"rgba(0,0,0,0)", strokeWidth:bubbleStrokewidht});
                        }
                    }else{
                        obj.set({ stroke: strokeColorRgba , fill:fillColorRgba, strokeWidth:bubbleStrokewidht});
                    }
                });    
            }
        canvas.requestRenderAll();
    }
}

function getSpeechBubbleTextFill(activeObject, type){
    let isExistsFillArea = false;
    if(isPath(activeObject)){
        if(type == 'fill'){
            return activeObject.fill;
        }
        if(type == 'stroke'){
            return activeObject.stroke;
        }
        if(type == 'strokeWidth'){
            return activeObject.strokeWidth;
        }
    }else{
        activeObject.forEachObject((obj) => {
            if( obj.data?.originalId === "fillArea"){
                isExistsFillArea = true;
                return;
            }
        });
        activeObject.forEachObject((obj) => {
            if( isExistsFillArea ){
                if( obj.data?.originalId === "fillArea"){

                    if(type == 'fill'){
                        return obj.fill;
                    }
                    if(type == 'stroke'){
                        return obj.stroke;
                    }
                    if(type == 'strokeWidth'){
                        return obj.strokeWidth;
                    }
                }else{
                    if(type == 'fill'){
                        return obj.fill;
                    }
                    if(type == 'stroke'){
                        return obj.stroke;
                    }
                    if(type == 'strokeWidth'){
                        return obj.strokeWidth;
                    }
                }
            }else{
                if(type == 'fill'){
                    return obj.fill;
                }
                if(type == 'stroke'){
                    return obj.stroke;
                }
                if(type == 'strokeWidth'){
                    return obj.strokeWidth;
                }
            }
        });    
    }

    if(type == 'fill'){
        return "rgba(255, 255, 255, 0)";
    }
    if(type == 'stroke'){
        return "rgba(0, 0, 0, 0)";
    }
    if(type == 'strokeWidth'){
        return 10;
    }
    return null;
}

function loadSpeechBubbleSVGReadOnly(svgString, name) {
    fabric.loadSVGFromString(svgString, function (objects, options) {
        
        const svgObject = fabric.util.groupSVGElements(objects, options);

        let svgData =null;
        if (name.startsWith("90_focus_")) {
            //skip
        }else{
            svgData = parseSvg(svgString);
        }

        
        let initialWidth = canvas.width * 0.35
        
        svgObject.scaleToWidth(initialWidth);
        svgObject.baseScaleX = svgObject.scaleX;
        svgObject.baseScaleY = svgObject.scaleY;

        svgObject.set({
           left: 50,
           selectable: true,
           hasControls: true,
           hasBorders: true
        });

        const selectedValue = getSelectedValueByGroup("sbTextGroup");
        if (name.startsWith("90_focus_") || selectedValue === "Nothing") {
            canvas.add(svgObject);
        }else{
            changeDoNotSaveHistory();
                canvas.add(svgObject);
            changeDoSaveHistory();
            createSpeechBubbleMetrics(svgObject, svgData);
        }
        canvas.setActiveObject(svgObject);
        changeSpeechBubble();
        canvas.discardActiveObject();
        canvas.renderAll();
        updateLayerPanel();
    });
}

/** load svg. */
const previewAreaVertical = $(
    "svg-preview-area-vertical"
);
const previewAreaLandscape = $(
    "svg-preview-area-landscape"
);
const speechBubbleArea = $(
    "speech-bubble-preview"
);

window.onload = function () {
    previewAreaVertical.innerHTML = "";

    /** Load vertical manga panel image. */
    MangaPanelsImage_Vertical.forEach((item) => {
        const img = document.createElement("img");
        img.src = "data:image/svg+xml;utf8," + encodeURIComponent(item.svg);
        img.classList.add("svg-preview");
        img.alt = item.name;
        img.addEventListener("click", async function () {
            console.log("new vertical panel selected");

            const loading = OP_showLoading({
                icon: 'process',step: 'Step1',substep: 'New Page',progress: 0
              });
            try{
                // Generate new GUID regardless of path
                const newGuid = generateGUID();
                console.log("Generated new GUID for vertical template:", newGuid);
                
                // Check if we should replace the existing template rather than add a new one
                const existingGuids = btmGetGuids();
                const shouldReplaceExisting = existingGuids.length > 0 && !currentTemplateModified;
                
                console.log("Should replace existing template:", shouldReplaceExisting);
                
                // If replacing, store the existing GUID
                let existingGuid = null;
                if (shouldReplaceExisting) {
                    // Get the most recent GUID to replace
                    existingGuid = getCanvasGUID();
                    console.log("Will replace template with GUID:", existingGuid);
                }
                
                if (stateStack.length > 2) {
                    OP_updateLoadingState(loading, {
                        icon: 'process',step: 'Step2',substep: 'Zip Start',progress: 20
                      });

                      await btmSaveProjectFile().then(() => {
                        // Use our new GUID
                        setCanvasGUID(newGuid);
                        loadSVGPlusReset(item.svg);
                      });
                } else {
                    // Use our new GUID
                    setCanvasGUID(newGuid);
                    loadSVGPlusReset(item.svg);
                }
                
                // Always add template to timeline, regardless of path
                console.log("Adding vertical template to timeline, always");
                const previewLink = getCropAndDownloadLinkByMultiplier(1, "jpeg");
                const guid = getCanvasGUID();
                console.log("Vertical template GUID:", guid);
                
                const lz4Blob = await generateBlobProjectFile(guid);
                setTimeout(() => {
                    if (shouldReplaceExisting && existingGuid) {
                        // Delete the existing template and add the new one
                        btmProjectsMap.delete(existingGuid);
                        
                        // Remove the template from the UI
                        const imageElement = document.querySelector(`.btm-image[data-index="${existingGuid}"]`);
                        if (imageElement && imageElement.parentElement) {
                            imageElement.parentElement.remove();
                        }
                        
                        btmAddImage(previewLink, lz4Blob, guid);
                        updateAllPageNumbers();
                        console.log("Replaced existing template in timeline");
                    } else {
                        btmAddImage(previewLink, lz4Blob, guid);
                        console.log("Added vertical template to timeline");
                    }
                    // Reset the modification flag for the new template
                    resetTemplateModification();
                }, 0);
            }finally{
                OP_hideLoading(loading);
            }
        });
        previewAreaVertical.appendChild(img);
    });

    /** Load landscape manga panel image. */
    previewAreaLandscape.innerHTML = "";
    MangaPanelsImage_Landscape.forEach((item) => {
        const img = document.createElement("img");
        img.src = "data:image/svg+xml;utf8," + encodeURIComponent(item.svg);
        img.classList.add("svg-preview");
        img.alt = item.name;
        img.addEventListener("click", async function () {
            console.log("new landscape panel selected");
            const loading = OP_showLoading({
                icon: 'process',step: 'Step1',substep: 'New Page',progress: 0
              });
            try{
                // Generate new GUID regardless of path
                const newGuid = generateGUID();
                console.log("Generated new GUID for landscape template:", newGuid);
                
                // Check if we should replace the existing template rather than add a new one
                const existingGuids = btmGetGuids();
                const shouldReplaceExisting = existingGuids.length > 0 && !currentTemplateModified;
                
                console.log("Should replace existing template:", shouldReplaceExisting);
                
                // If replacing, store the existing GUID
                let existingGuid = null;
                if (shouldReplaceExisting) {
                    // Get the most recent GUID to replace
                    existingGuid = getCanvasGUID();
                    console.log("Will replace template with GUID:", existingGuid);
                }
                
                if (stateStack.length > 2) {
                    OP_updateLoadingState(loading, {
                        icon: 'process',step: 'Step2',substep: 'Zip Start',progress: 20
                      });
                      await btmSaveProjectFile().then(() => {
                        // Use our new GUID
                        setCanvasGUID(newGuid);
                        loadSVGPlusReset(item.svg, true);
                    });
                } else {
                    // Use our new GUID
                    setCanvasGUID(newGuid);
                    loadSVGPlusReset(item.svg, true);
                }
                
                // Always add template to timeline, regardless of path
                console.log("Adding landscape template to timeline, always");
                const previewLink = getCropAndDownloadLinkByMultiplier(1, "jpeg");
                const guid = getCanvasGUID();
                console.log("Landscape template GUID:", guid);
                
                const lz4Blob = await generateBlobProjectFile(guid);
                setTimeout(() => {
                    if (shouldReplaceExisting && existingGuid) {
                        // Delete the existing template and add the new one
                        btmProjectsMap.delete(existingGuid);
                        
                        // Remove the template from the UI
                        const imageElement = document.querySelector(`.btm-image[data-index="${existingGuid}"]`);
                        if (imageElement && imageElement.parentElement) {
                            imageElement.parentElement.remove();
                        }
                        
                        btmAddImage(previewLink, lz4Blob, guid);
                        updateAllPageNumbers();
                        console.log("Replaced existing template in timeline");
                    } else {
                        btmAddImage(previewLink, lz4Blob, guid);
                        console.log("Added landscape template to timeline");
                    }
                    // Reset the modification flag for the new template
                    resetTemplateModification();
                }, 0);
            }finally{
                OP_hideLoading(loading);
            }
        });
        previewAreaLandscape.appendChild(img);
    });

    /** Load speech bubble manga panel image. */
    SpeechBubble.forEach((item) => {
        const img = document.createElement("img");
        img.src = "data:image/svg+xml;utf8," + encodeURIComponent(item.svg);
        img.classList.add("svg-preview");
        img.alt = item.name;
        img.addEventListener("click", function () {
            loadSpeechBubbleSVGReadOnly(item.svg, item.name);
        });
        speechBubbleArea.appendChild(img);
    });
};