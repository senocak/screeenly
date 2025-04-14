<p align="center"><img width="295" src="https://raw.githubusercontent.com/stefanzweifel/screeenly/master/readme-image.png" alt=""></p>

<p align="center">
<a href="https://github.com/stefanzweifel/screeenly/blob/master/LICENSE" title="License">
    <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square" alt="License">
</a>
<a href="https://github.com/stefanzweifel/screeenly/releases" title="Releases">
    <img src="https://img.shields.io/github/release/stefanzweifel/screeenly.svg?style=flat-square" alt="Releases">
</a>
</p>


screeenly is an open source web application which lets users create website screenshots through a simple API.
It's built with [Kotlin](https://kotlinlang.org/) and [Spring Boot](https://spring.io/projects/spring-boot) for the backend, and [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/) for the frontend.

---

## Features

- Create screenshots of any website through a simple REST API
- User-friendly web interface built with React and TypeScript
- Customize screenshot dimensions (width and height)
- Capture full-page screenshots (not just the viewport)
- Add delay before capturing to allow for page rendering
- Configurable user agent and timeouts
- Preview and download screenshots directly from the web interface

## API Usage

The API accepts POST requests to `/screenshot` with a JSON body:

```json
{
  "url": "https://github.com/senocak/screeenly",
  "width": 1920,
  "height": 1080,
  "delay": 1,
  "fullPage": true
}
```

Parameters:
- `url` (required): The website URL to capture
- `width` (optional): Screenshot width in pixels (default: 1024)
- `height` (optional): Screenshot height in pixels (default: 768)
- `delay` (optional): Wait time in seconds before taking the screenshot
- `fullPage` (optional): When true, captures the entire page, not just the viewport

The API returns a JSON response with the path to the saved screenshot.

## Requirements

- Java 21 or higher
- Chrome browser (for Selenium WebDriver)
- Node.js 16+ and npm 8+ (for building the React frontend, automatically downloaded by Gradle)

## Configuration

The application can be configured through the `application.yml` file:

```yaml
screeenly:
  storage:
    type: local
    path: uploads/screenshots
  screenshot:
    timeout: 30 # seconds
    user-agent: screeenly-bot 2.0
    disable-sandbox: false
```

## Self Hosting

### Running Locally

1. Clone the repository
2. Make sure you have Java 21+ installed
3. Run `./gradlew bootRun`
4. The application will be available at http://localhost:8080

#### Frontend Development

If you want to work on the frontend separately:

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. The frontend will be available at http://localhost:3000 and will proxy API requests to the backend at http://localhost:8080

### Docker

You can build a Docker image using the following Dockerfile:

```dockerfile
FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY . .

# Install Chrome
RUN apt-get update && apt-get install -y wget gnupg2 apt-utils
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list
RUN apt-get update && apt-get install -y google-chrome-stable

# Build the application (includes building the React frontend)
RUN ./gradlew build -x test

EXPOSE 8080

CMD ["java", "-jar", "build/libs/screeenly-0.0.1-SNAPSHOT.jar"]
```

Note: The Gradle build process will automatically download Node.js and npm, and build the React frontend as part of the application build.

## Security

If you discover a security vulnerability within this package, please e-mail us at hello@stefanzweifel.io. All security vulnerabilities will be promptly addressed.

## LICENSE

MIT
