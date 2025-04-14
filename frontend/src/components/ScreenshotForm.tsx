import React, { useState } from 'react'
import { Screenshot } from '../types/Screenshot'

interface ScreenshotFormProps {
  onSubmit: (data: Screenshot) => void
  loading: boolean
}

const ScreenshotForm: React.FC<ScreenshotFormProps> = ({ onSubmit, loading }) => {
  const [url, setUrl] = useState<string>('https://github.com/senocak/screeenly')
  const [width, setWidth] = useState<string>('1920')
  const [height, setHeight] = useState<string>('1080')
  const [delay, setDelay] = useState<string>('1')
  const [fullPage, setFullPage] = useState<boolean>(true)

  const handleSubmit: (e: React.FormEvent) => void = (e: React.FormEvent): void => {
    e.preventDefault()
    const screenshotData: Screenshot = {
      url,
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      delay: delay ? parseInt(delay) : undefined,
      fullPage
    }
    onSubmit(screenshotData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="url">Website URL</label>
        <input
          type="url"
          id="url"
          className="form-control"
          value={url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="width">Width (pixels)</label>
        <input
          type="number"
          id="width"
          className="form-control"
          value={width}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setWidth(e.target.value)}
          placeholder="1024"
          min="1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="height">Height (pixels)</label>
        <input
          type="number"
          id="height"
          className="form-control"
          value={height}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setHeight(e.target.value)}
          placeholder="768"
          min="1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="delay">Delay (seconds)</label>
        <input
          type="number"
          id="delay"
          className="form-control"
          value={delay}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setDelay(e.target.value)}
          placeholder="0"
          min="0"
        />
      </div>

      <div className="checkbox-group">
        <input
          type="checkbox"
          id="fullPage"
          checked={fullPage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setFullPage(e.target.checked)}
        />
        <label htmlFor="fullPage">Capture full page (not just viewport)</label>
      </div>

      <button type="submit" className="btn" disabled={loading || !url}>
        {loading ? 'Creating...' : 'Create Screenshot'}
      </button>
    </form>
  )
}
export default ScreenshotForm
