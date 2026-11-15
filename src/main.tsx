import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { loadData } from './data/load'
import './styles.css'

const { dataset, errors } = loadData()
createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App dataset={dataset} errors={errors} />
  </StrictMode>,
)
