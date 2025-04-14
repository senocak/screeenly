import React from 'react';
import ScreenshotForm from './ScreenshotForm';
import ScreenshotResult from './ScreenshotResult';
import { Screenshot } from '../types/Screenshot';

const App: React.FC = () => {
  const [screenshot, setScreenshot] = React.useState<Screenshot | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="container">
      <header className="header">
        <h1>Screeenly</h1>
        <p>Create screenshots of any website through a simple interface</p>
      </header>

      <div className="card">
        <ScreenshotForm
          onSubmit={(data) => {
            setLoading(true);
            setError(null);

            fetch('http://localhost:8080/screenshot', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            })
              .then(response => {
                if (!response.ok) {
                  throw new Error('Failed to create screenshot');
                }
                return response.json();
              })
              .then(data => {
                setScreenshot(data);
                setLoading(false);
              })
              .catch(err => {
                setError(err.message);
                setLoading(false);
              });
          }}
          loading={loading}
        />
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          Creating screenshot... Please wait.
        </div>
      )}

      {screenshot && !loading && (
        <ScreenshotResult screenshot={screenshot} />
      )}
    </div>
  );
};

export default App;
