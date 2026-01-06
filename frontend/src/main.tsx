import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PostHogProvider } from 'posthog-js/react'
import { API_URL } from './config'

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;

console.log('[PostHog] Initializing with proxy at:', `${API_URL}/api/posthog/`);

const options = {
  api_host: `${API_URL}/api/posthog/`,  // Use our Django proxy
  ui_host: 'https://us.i.posthog.com',
  autocapture: true,
  capture_pageview: true,
  capture_pageleave: true,
  loaded: (posthog: any) => {
    console.log('[PostHog] Successfully loaded!', posthog);
  },
} as const

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider 
      apiKey={posthogKey} 
      options={options}
    >
      <App />
    </PostHogProvider>
  </StrictMode>,
)
