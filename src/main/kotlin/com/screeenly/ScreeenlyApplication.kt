package com.screeenly

import io.github.bonigarcia.wdm.WebDriverManager
import jakarta.validation.Valid
import org.openqa.selenium.Dimension
import org.openqa.selenium.OutputType
import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.chrome.ChromeOptions
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Configuration
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.io.File
import java.nio.file.Files
import java.nio.file.Paths
import java.time.Duration
import java.util.UUID

@Configuration
class WebConfig : WebMvcConfigurer {
    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/**")
            .allowedOrigins("http://localhost:3000")
            .allowedMethods("POST")
            .allowedHeaders("*")
            .allowCredentials(true)
    }
}

@ConfigurationProperties(prefix = "screeenly")
class ScreeenlyProperties(
    var storage: ScreeenlyStorage,
    var screenshot: ScreeenlyScreenshot,
) {
    class ScreeenlyStorage(
        var type: String,
        var path: String
    )
    class ScreeenlyScreenshot(
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

@SpringBootApplication
@ConfigurationPropertiesScan
@RestController
@RequestMapping("/screenshot")
class ScreeenlyApplication(
    private val screeenlyProperties: ScreeenlyProperties
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
        val directory = File(screeenlyProperties.storage.path)
        if (!directory.exists()) {
            directory.mkdirs()
        }

        // Configure Chrome options
        val options = ChromeOptions()
        options.addArguments("--headless")
        options.addArguments("--disable-gpu")
        options.addArguments("--window-size=${data.width ?: 1024},${data.height ?: 768}")
        options.addArguments("--user-agent=${screeenlyProperties.screenshot.userAgent}")

        if (screeenlyProperties.screenshot.disableSandbox) {
            options.addArguments("--no-sandbox")
            options.addArguments("--disable-dev-shm-usage")
        }
        if (data.fullPage)
            options.addArguments("--hide-scrollbars")
        val driver = ChromeDriver(options)

        try {
            // Set timeouts
            driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(screeenlyProperties.screenshot.timeout))
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(screeenlyProperties.screenshot.timeout))
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
            val fullPath = "${screeenlyProperties.storage.path}/$filename"
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

fun main(args: Array<String>) {
    runApplication<ScreeenlyApplication>(*args)
}
