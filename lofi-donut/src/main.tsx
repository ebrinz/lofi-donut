import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { BasicProvider } from '@basictech/react'
import { schema } from '../basic.config'
import { AuthProvider } from './context/AuthContext'
import AuthCallback from './components/AuthCallback'
import 'maplibre-gl/dist/maplibre-gl.css';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BasicProvider project_id={schema.project_id} schema={schema}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/callback" element={<AuthCallback />} />
            <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </BasicProvider>
  </StrictMode>,
)