### `js/ai/ComfyUI/comfyui-management.js` - ComfyUI Backend Integration

This file provides the comprehensive logic for interacting with a ComfyUI backend:

*   **`ComfyUIEndpoints` Class:** Dynamically constructs API endpoint URLs based on the user-configured ComfyUI server address. This allows for flexibility if the server is not on the default host/port.
*   **WebSocket Communication:** Establishes and manages a WebSocket connection (`Comfyui_connect`) to the ComfyUI server for real-time progress updates during prompt execution. Each client session gets a unique UUID.
*   **API Heartbeat:** Implements `Comfyui_apiHeartbeat` to check connectivity to the ComfyUI server by fetching `/settings`. It updates UI labels with the status and, on the first successful connection, triggers fetching of model/sampler information.
*   **Workflow Management & Execution:**
    *   `Comfyui_handle_process_queue`: The core function for T2I, I2I, and Rembg. It loads a base ComfyUI workflow JSON (from files like `Comfy_T2I_Simple_Default_v2.json`), modifies it by injecting user parameters (prompts, models, seeds, dimensions) from the UI into the appropriate nodes, and then queues it for execution.
    *   For I2I/Rembg, it first uploads the input image to ComfyUI using `Comfyui_uploadImage`.
    *   `Comfyui_queue_prompt`: Sends the prepared workflow JSON to ComfyUI's `/prompt` endpoint to start execution.
    *   `Comfyui_put_queue`: Manages the overall process by adding tasks to the `comfyuiQueue`. This includes queueing the prompt, tracking progress via WebSocket, fetching results, and updating the application's canvas layer.
*   **Image Handling:**
    *   `Comfyui_uploadImage`: Converts Fabric.js layer content to a Blob and uploads it to ComfyUI's `/upload/image` endpoint.
    *   `Comfyui_get_history` and `Comfyui_get_image`: Fetch the output image details from the execution history and then download the image data from the `/view` endpoint.
*   **Fetching Node Information (for UI Dropdowns):**
    *   A set of `Comfyui_Fetch...` functions (`Comfyui_FetchModels`, `Comfyui_FetchSampler`, etc.) retrieve lists of available checkpoint models, samplers, upscalers, CLIP models, and VAEs.
    *   They use the `/object_info/:nodeName` ComfyUI API endpoint to get details about specific nodes (like "KSampler", "CheckpointLoaderSimple") and extract the available input options.
    *   This data is then used to populate the relevant dropdown menus in the application's UI (via `updateModelDropdown`, etc., from `ai-management.js`).
    *   `Comfyui_FetchObjectInfoOnly` gets a list of all available node types.

This file demonstrates a sophisticated integration with ComfyUI, leveraging its API for workflow submission, image transfer, and dynamic population of UI elements based on the backend's capabilities.

### `js/ai/SDWebUI/sdwebui-settings.js` - SD WebUI Endpoint and Request Configuration

`js/ai/SDWebUI/sdwebui-settings.js` is responsible for configuring communication with the Stable Diffusion WebUI (A1111) and preparing the JSON data payloads for API requests.

*   **`SDWebUIEndpoints` Class:**
    *   This class dynamically generates the full API endpoint URLs for the SD WebUI.
    *   It parses the user-configured SD WebUI server address (from the `sdWebUIPageUrl` input field).
    *   Using a JavaScript `Proxy`, it constructs complete URLs by combining the base server address with predefined API paths for various functionalities (e.g., `/sdapi/v1/txt2img`, `/sdapi/v1/samplers`, `/rembg`, `/adetailer/v1/ad_model`). This allows flexible connection to SD WebUI instances at different addresses or ports.

*   **Request Data Preparation Functions:**
    *   **`rembgRequestData(layer)`:**
        *   Creates the JSON payload specifically for the background removal (`/rembg`) API endpoint.
        *   Sets default parameters for the `rembg` process, such as the model to use (e.g., `u2net`) and alpha matting settings. The actual input image data is expected to be added later.
    *   **`baseRequestData(layer)`:**
        *   Constructs the primary JSON payload for image generation requests (Text-to-Image and Image-to-Image).
        *   **Seed & Dimensions:** It intelligently determines the seed, width, and height for the generation based on whether it's a T2I or I2I operation, using values from the specific `layer` object or falling back to global `basePrompt` settings.
        *   **Prompts & Samplers:** It combines global prompts (`basePrompt`) with layer-specific prompts and sets sampler parameters (name, steps, CFG scale, scheduler) from `basePrompt`.
        *   **ADetailer Integration:** If ADetailer is enabled in the UI, it dynamically adds the `alwayson_scripts` configuration for ADetailer to the payload. This includes the selected ADetailer models and their specific positive/negative prompts.
        *   **HR Fix Integration:** If High-Resolution Fix is enabled and an upscaler is selected in `basePrompt`, it adds the necessary HR Fix parameters (`enable_hr`, `hr_upscaler`, `hr_scale`, etc.) to the payload. It also correctly handles "latent" upscalers by adjusting the payload as required by the SD WebUI API.

This file ensures that the application can correctly address the SD WebUI API and send well-formed JSON requests tailored to the user's settings and the specific operation being performed.

### `js/ai/SDWebUI/sdwebui-single-call-api.js` - SD WebUI Single API Call Management

`js/ai/SDWebUI/sdwebui-single-call-api.js` manages individual API interactions with the Stable Diffusion WebUI for Text-to-Image (T2I), Image-to-Image (I2I), and background removal (Rembg) operations. It ensures that these calls are processed sequentially using a queue system.

*   **Core `post(url, requestData)` Function:**
    *   A generic asynchronous function for making HTTP POST requests to the SD WebUI.
    *   Handles JSON request/response format and basic error reporting via toast messages.

*   **Image Generation (T2I & I2I):**
    *   **Queue Processing (`sdwebui_T2IProcessQueue`, `sdwebui_I2IProcessQueue`, `processQueue`):**
        *   User actions for T2I or I2I trigger these queue functions.
        *   They use a shared queue (`sdQueue`) to add image generation tasks, ensuring API calls are made one at a time.
        *   Manages UI spinners for visual feedback.
    *   **Fetching Data (`sdwebui_fetchText2Image`, `sdwebui_fetchImage2Image`):**
        *   `sdwebui_fetchText2Image`: Prepares T2I request data using `baseRequestData` (from `sdwebui-settings.js`) and calls the `/sdapi/v1/txt2img` endpoint.
        *   `sdwebui_fetchImage2Image`: Converts the input Fabric.js layer to base64, combines it with `baseRequestData`, adds I2I specific parameters (e.g., `denoising_strength`), and calls the `/sdapi/v1/img2img` endpoint.
    *   **Image Creation (`sdwebui_generateImage`):**
        *   Receives the API response, extracts the base64 image data.
        *   Creates a `fabric.Image` object from the received image.
    *   **Handling Success (`handleSuccessfulGeneration`):**
        *   Converts the generated image to WebP format.
        *   Adds the new image to the canvas using `putImageInFrame`.
        *   Stores generation metadata (seed, prompts) with the image/layer.
        *   Manages application history to group generation and placement into a single undoable action.
        *   Marks the project template as modified.

*   **Background Removal (Rembg):**
    *   **Queue Processing (`sdWebUI_RembgProcessQueue`):**
        *   Similar to image generation, it queues the background removal task.
    *   **Fetching Data (`sdwebui_removeBackground`):**
        *   Converts the input Fabric.js layer to base64.
        *   Prepares request data using `rembgRequestData` (from `sdwebui-settings.js`), adding the input image.
        *   Calls the `/rembg` endpoint.
    *   **Handling Success (`handleSuccessfulRembg`):**
        *   Creates a `fabric.Image` from the base64 image returned by the Rembg API.
        *   Adds the image (with background removed) to the canvas.
        *   Manages application history.

*   **Key Features:**
    *   **Sequential API Calls:** Uses a queue (`sdQueue`) to prevent overloading the SD WebUI backend.
    *   **State Management:** Carefully controls history saving for better user experience.
    *   **Fabric.js Integration:** Seamlessly converts API image data into canvas objects.
    *   **Error Handling & UI Feedback:** Provides toast notifications for errors and spinners during processing.

This file acts as the primary interface for executing single, distinct operations on the SD WebUI backend and integrating the results back into the application's canvas and state.

### `js/ai/SDWebUI/sdwebui-multi-call-api.js` - SD WebUI Configuration and Utility API Calls

`js/ai/SDWebUI/sdwebui-multi-call-api.js` handles a variety of interactions with the Stable Diffusion WebUI (A1111) and SD WebUI Forge that are not direct image generation tasks. This includes fetching available models and options, setting configurations, monitoring API health, and performing image interrogation.

*   **Fetching Configuration Data:**
    *   **Models & Options:**
        *   `fetchSD_ADModels()`: Fetches ADetailer models and populates a Tagify UI component.
        *   `fetchSDOptions()`: Retrieves current SD WebUI/Forge settings like the active checkpoint model and Forge additional modules, storing them in `basePrompt`.
        *   `fetchSD_Sampler()`, `fetchSD_Upscaler()`, `fetchSD_LatentUpscaler()`, `fetchSD_Models()`: Fetch lists of available samplers, upscalers (regular and latent), and checkpoint models, respectively. They then update corresponding UI dropdowns (e.g., `updateSamplerDropdown`, `updateModelDropdown`).
        *   `fetchSD_Modules()`: Fetches "SD Modules" (likely LoRAs, TIs, etc., for Forge) and updates a Tagify dropdown, possibly for selecting CLIP-related modules.

*   **Setting Configuration Data:**
    *   `sendClipToServer()`: Sends selected "additional modules" (likely for Forge) to the SD WebUI options endpoint to activate them.
    *   `sendModelToServer()`: Sends the selected checkpoint model name to the SD WebUI options endpoint to switch the active model.

*   **API Heartbeat:**
    *   `sdwebui_apiHeartbeat()`: Performs a periodic check against the SD WebUI's `/internal/ping` endpoint.
    *   Updates a UI label to indicate whether the "SD WebUI or Forge" backend is "ON" (green) or "OFF" (red).
    *   On the first successful connection, it triggers `getDiffusionInfomation()` to load all initial model/sampler lists.

*   **Image Interrogation:**
    *   `sdWebUI_Interrogate(layer, model, spinnerId)`:
        *   Allows users to get a textual description (caption) for an image using a specified interrogation model (e.g., CLIP, DeepDanbooru).
        *   The operation is added to the `sdQueue` for sequential processing.
        *   It sends the image (as base64) and the chosen interrogation model to the `/sdapi/v1/interrogate` endpoint.
        *   On success, it displays the caption in a toast message and appends it to the image layer's positive prompt field (`layer.text2img_prompt`).
        *   Manages UI spinners and error toasts.

*   **Key Features:**
    *   **Comprehensive Option Management:** Provides functions to both fetch and set various SD WebUI/Forge configurations.
    *   **UI Integration:** Directly updates numerous UI elements based on API responses.
    *   **SD WebUI Forge Awareness:** Includes specific logic and labels for SD WebUI Forge.
    *   **Health Monitoring:** The heartbeat function gives users real-time status of the backend.
    *   **Utility Functions:** Offers an image interrogation feature.

This file complements `sdwebui-single-call-api.js` by managing the broader configuration and informational aspects of the SD WebUI integration, ensuring the UI reflects the available options and the backend is correctly configured.