# From URL to PNG: Building a Lightweight Full Page Screenshot API

A is a lightweight, backend-only API designed for a single purpose: capturing screenshots of web pages. Built with Kotlin and Spring Boot, the service programmatically drives a headless Chrome browser using Selenium to render and capture any given URL. Users can submit a POST request specifying the target URL along with optional parameters like viewport dimensions, capture delay, and full-page mode. In response, the API generates a PNG image of the page, returning both the local file path and the image data encoded in base64, providing a simple and efficient way to integrate web page snapshots into any application.

- Stack: Kotlin, Spring Boot, Selenium (ChromeDriver), WebDriverManager
- Output: PNG files saved to local storage (configurable)

## Configuration (application.yml)
```yaml
server:
  port: 8080
spring:
  application:
    name: ScreenShotAPI
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB
app:
  storage:
    type: local
    path: uploads/screenshots
  screenshot:
    timeout: 30 # seconds
    user-agent: bot 2.0
    disable-sandbox: false
```
- app.storage.path: Target directory for saved PNGs
- app.screenshot.timeout: Page load + implicit wait timeouts (seconds)
- app.screenshot.user-agent: Custom UA string for requests
- app.screenshot.disable-sandbox: Map to Chrome flags for containerized environments

## Core types and configuration binding
```kotlin
@ConfigurationProperties(prefix = "app")
class AppProperties(
    var storage: Storage,
    var screenshot: Screenshot,
) {
    class Storage(
        var type: String,
        var path: String
    )
    class Screenshot(
        var timeout: Long,
        var userAgent: String,
        var disableSandbox: Boolean
    )
}

data class Screenshot(
    val url: String,
    val width: Int? = null,
    val height: Int? = null,
    val delay: Int? = null,
    val fullPage: Boolean = false
) {
    var path: String? = null
    var bytes: ByteArray? = null
}
```
- ConfigurationProperties strongly types the YAML.
- Screenshot is both the request DTO and the response model; path and bytes are filled on success.

## REST endpoint and Chrome setup
```kotlin
@SpringBootApplication
@ConfigurationPropertiesScan
@RestController
@RequestMapping(value = ["/screenshot"])
class Application(
    private val appProperties: AppProperties
) {
    init {
        WebDriverManager.chromedriver().setup()
    }

    @PostMapping
    fun createScreenshot(@Valid @RequestBody request: Screenshot): Screenshot =
        capture(data = request, filename = generateFilename())

    /**
     * Generate a unique filename for the screenshot.
     */
    private fun generateFilename(): String =
        "${System.currentTimeMillis()}_${UUID.randomUUID().toString().replace(oldValue = "-", newValue = "")}.png"

    fun capture(data: Screenshot, filename: String): Screenshot {
        // Create storage directory if it doesn't exist
        val directory = File(appProperties.storage.path)
        if (!directory.exists()) {
            directory.mkdirs()
        }

        // Configure Chrome options
        val options = ChromeOptions()
        options.addArguments("--headless")
        options.addArguments("--disable-gpu")
        options.addArguments("--window-size=${data.width ?: 1024},${data.height ?: 768}")
        options.addArguments("--user-agent=${appProperties.screenshot.userAgent}")

        if (appProperties.screenshot.disableSandbox) {
            options.addArguments("--no-sandbox")
            options.addArguments("--disable-dev-shm-usage")
        }
        if (data.fullPage)
            options.addArguments("--hide-scrollbars")
        val driver = ChromeDriver(options)

        try {
            // Set timeouts
            driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(appProperties.screenshot.timeout))
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(appProperties.screenshot.timeout))
            // Set window size
            driver.manage().window().size = Dimension(data.width ?: 1024, data.height ?: 768)
            // Navigate to URL
            driver.get(data.url)
            // Wait for the specified delay
            if (data.delay != null && data.delay > 0) {
                Thread.sleep(data.delay.toLong() * 1000)
            }
            // Take screenshot
            val screenshotFile: File

            if (data.fullPage) {
                // Execute JavaScript to get page dimensions
                val pageHeightObj = driver.executeScript("return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);")
                val pageHeight: Long = when (pageHeightObj) {
                    is Long -> pageHeightObj
                    is Int -> pageHeightObj.toLong()
                    is Double -> pageHeightObj.toLong()
                    is Float -> pageHeightObj.toLong()
                    else -> (pageHeightObj.toString().toDoubleOrNull() ?: 768.0).toLong()
                }

                // Set window size to full page height
                driver.manage().window().size = Dimension(data.width ?: 1024, pageHeight.toInt())

                // Wait a bit for the page to adjust
                Thread.sleep(500)

                // Take the screenshot
                screenshotFile = driver.getScreenshotAs(OutputType.FILE)
            } else {
                // For regular screenshots, use standard method
                screenshotFile = driver.getScreenshotAs(OutputType.FILE)
            }
            // Save screenshot to storage
            val fullPath = "${appProperties.storage.path}/$filename"
            Files.copy(screenshotFile.toPath(), Paths.get(fullPath))
            return data.also { it: Screenshot ->
                it.path = fullPath
                it.bytes = screenshotFile.readBytes()
            }
        } finally {
            driver.quit()
        }
    }
}
```
Key points:
- WebDriverManager fetches a matching ChromeDriver for the installed Chrome.
- ChromeOptions: headless, UA, window-size; sandbox flags for containers.
- Timeouts: pageLoadTimeout + implicitlyWait share the same configurable budget.
- Full-page: measure document height in JS, resize, then capture.
- Storage: ensure directory exists; copy screenshot file and return path + bytes.

### Step-by-Step Breakdown
#### Application Setup
- @SpringBootApplication: A standard annotation that enables auto-configuration and component scanning in Spring Boot.
- @RestController: Marks this class as a request handler, and all its methods will return data directly as an HTTP response (e.g., JSON).
- @RequestMapping("/screenshot"): Maps all requests starting with /screenshot to this class. 

#### Driver Initialization
The init block runs once when the application starts.
- WebDriverManager.chromedriver().setup(): This command automatically detects the version of Chrome installed on the machine, downloads the corresponding ChromeDriver, and sets it up. This avoids having to manually download and manage browser drivers.

#### Handling Incoming Requests
The createScreenshot function is the API endpoint.
- @PostMapping: This maps HTTP POST requests to the /screenshot endpoint.
- @RequestBody request: Screenshot: Spring automatically converts the JSON body of the POST request into a Screenshot object.
- The function then calls the main capture logic, passing along the request data and a newly generated unique filename.

### The capture Function (Core Logic)
This function performs the actual browser automation and screenshot capture.

- Prepare Storage: It first checks if the directory specified in application.yml exists. If not, it creates it.
- Configure Chrome: It creates a ChromeOptions object to customize how the browser will run.
  - --headless: Runs Chrome without a visible UI window, which is essential for a server-side API.
  - --window-size: Sets the initial size of the browser's viewport.
  - --user-agent: Sets a custom user agent string for all requests made by the browser.
  - --no-sandbox: A flag often required to run Chrome inside container environments like Docker.
- Start Chrome: val driver = ChromeDriver(options) launches a new instance of the Chrome browser with the configuration from the previous step.
- Navigate and Capture: The entire process is wrapped in a try...finally block. This is critical because it ensures driver.quit() is always called in the finally block, which closes the browser and cleans up resources, even if an error occurs during the process.
  - Timeouts: Sets a maximum time to wait for the page to load and for elements to appear.
  - Navigation: driver.get(data.url) tells the browser to navigate to the requested URL.
  - Delay: If a delay is specified, the code pauses to allow time for JavaScript or other dynamic content on the page to finish loading.
  - Take Screenshot:
    - If fullPage is true, it executes a piece of JavaScript to find the total height of the web page. It then resizes the browser window to that full height before taking the screenshot.
    - Otherwise, it takes a standard screenshot of the visible part of the page (the viewport).
- Save and Return:
  - The captured screenshot (initially a temporary file) is copied to the final destination path.
  - The original Screenshot object is updated with the final file path and the image bytes. This updated object is then returned as the JSON response to the API call.

## API in one minute
Endpoint: POST /screenshot

Request body fields:
- url: string (required)
- width: number (optional, default 1024)
- height: number (optional, default 768)
- delay: number seconds (optional)
- fullPage: boolean (optional, default false)

Response body adds:
- path: filesystem path to the saved PNG
- bytes: base64-encoded screenshot bytes

```http request
POST http://localhost:8080/screenshot
Content-Type: application/json

{
  "url": "https://github.com/senocak/screeenly",
  "width": 1920,
  "height": 1080,
  "delay": 1,
  "fullPage": true
}
```

## What's next?

- Validate/allowlist URLs; add auth and rate limiting.
- Prefer returning a public URL instead of bytes for large responses.
- Swap local storage for S3/GCS and return signed URLs.
- Add device presets (mobile/tablet/desktop) and DPR scaling.
