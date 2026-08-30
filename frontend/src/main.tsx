import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { App } from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        success: {
          style: {
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontWeight: '600',
            fontSize: '14px',
          },
        },
        error: {
          style: {
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontWeight: '600',
            fontSize: '14px',
          },
        },
      }}
    />
  </StrictMode>,
)