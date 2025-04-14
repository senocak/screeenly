import React from 'react';
import { Screenshot } from '../types/Screenshot';

interface ScreenshotResultProps {
  screenshot: Screenshot;
}

const ScreenshotResult: React.FC<ScreenshotResultProps> = ({ screenshot }) => {
  // Extract the filename from the path
  const filename: string | undefined = screenshot.path ? screenshot.path.split('/').pop() : ''

  return (
    <div className="card screenshot-result">
      <h2>Screenshot Created</h2>

      <div className="form-group">
        <label>Screenshot URL</label>
        <div className="form-control" style={{ overflow: 'auto' }}>
          {screenshot.path ? `/${screenshot.path}` : 'Path not available'}
        </div>
      </div>

      <div className="form-group">
        <label>Preview</label>
        {screenshot.path ? (
          <div>
            <img
              src={`data:image/jpeg;base64, ${screenshot.bytes}`}
              alt={`Screenshot of ${screenshot.url}`}
            />
          </div>
        ) : (
          <p>Preview not available</p>
        )}
      </div>

      <div className="form-group">
        <label>Details</label>
        <ul>
          <li><strong>URL:</strong> {screenshot.url}</li>
          <li><strong>Dimensions:</strong> {screenshot.width || 1024}x{screenshot.height || 768}</li>
          <li><strong>Delay:</strong> {screenshot.delay || 0} seconds</li>
          <li><strong>Full Page:</strong> {screenshot.fullPage ? 'Yes' : 'No'}</li>
          <li><strong>Filename:</strong> {filename}</li>
        </ul>
      </div>

      {screenshot.path && (
        <div className="form-group">
          <a
            href={`/${screenshot.path}`}
            download={filename}
            className="btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Screenshot
          </a>
        </div>
      )}
    </div>
  );
};

export default ScreenshotResult
