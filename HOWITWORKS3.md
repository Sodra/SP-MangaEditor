# Manga Editor: Analysis of Text, Speech Bubbles, and Image Handling

This document details the mechanisms behind creating and managing text, speech bubbles, and images within the SP-MangaEditor application, including their interactions and layering.

## Table of Contents

- [Text Creation and Styling](#text-creation-and-styling)
- [Speech Bubble Creation and Styling](#speech-bubble-creation-and-styling)
- [Image Handling](#image-handling)
- [Interactions and Layering](#interactions-and-layering)

## Text Creation and Styling

Text elements are primarily managed by `js/sidebar/text/text-effect.js`. They are Fabric.js `Textbox` objects, allowing for rich text features and interactivity.

### 1. Text Object Creation (`createTextbox()`)

- **Trigger:** Typically initiated by a user interface element (e.g., an "Add Text" button).
- **Core Object:** Creates a new `fabric.Textbox` object, initialized with the default text "New".
- **Initial Properties:** When a textbox is created, its initial appearance is determined by the current settings in the UI. This includes:
    - Font family (from `fontManager.getSelectedFont("fontSelector")`)
    - Font size (from `$("fontSizeSlider").value`)
    - Font stroke width (from `$("fontStrokeWidthSlider").value`)
    - Text alignment (e.g., left, center, right, from `getSelectedValueByGroup("align_group")`)
    - Fill color (text color, from `$("textColorPicker").value`)
    - Stroke color (outline color, from `$("textStrokeColorPicker").value`)
    - Shadow properties (color, offsets, blur, from various sliders and color pickers like `textShadowColorPicker`)
    - Neon effect settings (enabled status, color, intensity, from `neonEffectCheckbox`, `firstTextEffectColorPicker`, `neonIntensitySlider`).
- **Canvas Integration:** 
    - The new textbox is added to the main canvas (`canvas.add(textbox)`).
    - It's set as the currently active object (`canvas.setActiveObject(textbox)`).
    - The canvas is then re-rendered (`canvas.requestRenderAll()`).
- **State Management:** 
    - The function calls `markTemplateAsModified()` to indicate that the project has unsaved changes.
    - It likely also calls `updateLayerPanel()` (though commented out in some views) to refresh the list of layers in the UI.
- **Event Listeners:** Event listeners are attached to the textbox for interactions:
    - `'modified'`: For transformations (move, scale, rotate).
    - `'editing:entered'` & `'editing:exited'`: For when the user starts and stops editing the text content.
    - `'selection:changed'`: For when the object is selected or deselected.
    - These events typically trigger `markTemplateAsModified()`.

### 2. Dynamic Text Styling

Styling for an *existing, selected* text object is handled by a suite of functions, usually triggered by `oninput` or `onchange` events from UI controls. These functions modify the properties of `canvas.getActiveObject()`.

- **`changeTextColor(color)`:** Modifies the `fill` property (text color).
- **`changeOutlineTextColor(color)`:** Modifies the `stroke` property (outline color).
- **`changeFontSize(size)`:** 
    - Modifies the `fontSize`.
    - **Speech Bubble Integration:** If the selected text is part of a speech bubble (`isSpeechBubbleText(activeObject)` returns true), this function also calls `mainSpeechBubbleObjectResize()` and updates the associated SVG speech bubble shape. This indicates that the text's size directly influences its container bubble's dimensions.
- **`changeStrokeWidthSize(size)`:** Modifies the `strokeWidth` (outline thickness).
- **`toggleBold()`:** Toggles the `fontWeight` property. It includes logic to handle text within grouped objects (e.g., vertical text).
- **`toggleShadow()`:** Applies or removes a basic shadow effect.
- **`alignText(alignment, button)`:** Sets the `textAlign` property and updates the UI state of alignment buttons.
- **`changeFont(font)`:** While the provided snippet primarily shows this updating a preview area (`$("text-preview-area").style.fontFamily = font;`), the actual font of a `fabric.Textbox` is set during its creation or via a dedicated modification function (which would set the `fontFamily` property on the active object).
- **Neon Effect (`applyNeonEffect()`, `updateNeonEffect()`, `changeNeonColor()`, `changeNeonIntensity()`):** 
    - A global `isNeonEnabled` flag and variables for `neonColor` and `neonIntensity` control this effect.
    - `updateNeonEffect()` is the core function that applies/removes a `fabric.Shadow` and a stroke to the active text object to simulate a neon glow. The shadow's `blur` and `opacity` are tied to `neonIntensity`, and its `color` (and the text's `stroke`) are set by `neonColor`.
- **Complex Effects (`applyCSSTextEffect()`, `applyVividGradientEffect()`, `applyInnerShadow()`, `drawNeonJitterEffect()`):** 
    - These functions apply more sophisticated visual styles. For example, `applyVividGradientEffect()` uses `fabric.Gradient` to set a gradient fill. `drawNeonJitterEffect()` creates a more dynamic effect by cloning the text object multiple times with slight variations in position and shadow.

### 3. UI Synchronization (`updateTextControls(object)`)

- **Purpose:** Ensures that when a text object is selected on the canvas, the UI controls (sliders, color pickers, etc.) reflect the properties of that selected object.
- **Trigger:** Called when the canvas selection changes and the new active object is a text element.
- **Action:** Reads properties like `fill`, `fontSize`, `stroke`, `shadow`, etc., from the provided `object` and updates the `value` or state of the corresponding HTML input elements in the text styling panel.
