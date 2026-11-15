import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import type { DataError } from './data/validate'
import { formatErrors } from './data/validate'
import type { Dataset } from './data/schema'
import { AppStateProvider, useApp } from './state/AppState'
import { GlossaryProvider } from './ui/Glossary'
import Compare from './pages/Compare'
import Detail from './pages/Detail'
import Explore from './pages/Explore'
import Favorites from './pages/Favorites'
import Home from './pages/Home'
import Method from './pages/Method'
import Quiz from './pages/Quiz'
import Results from './pages/Results'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo?.(0, 0)
  }, [pathname])
  return null
}

function Layout() {
  const { dataset, favorites, compare } = useApp()
  const hasDemo = dataset.programs.some((p) => p.demo)
  return (
    <>
      <a className="skip" href="#main">Aller au contenu</a>
      {hasDemo && (
        <div className="demo-banner" role="note">
          Prototype : les programmes affichés sont des <strong>démonstrations fictives</strong>, pas des offres réelles.
        </div>
      )}
      <header className="site-header">
        <Link to="/" className="brand"><span className="logo" aria-hidden="true">↗</span> Prop Firm Finder</Link>
        <nav aria-label="Navigation principale">
          <NavLink to="/questionnaire">Questionnaire</NavLink>
          <NavLink to="/explorer">Explorer</NavLink>
          <NavLink to="/comparer">Comparer{compare.length > 0 ? ` (${compare.length})` : ''}</NavLink>
          <NavLink to="/favoris">Favoris{favorites.length > 0 ? ` (${favorites.length})` : ''}</NavLink>
          <NavLink to="/methode">Méthode</NavLink>
        </nav>
      </header>
      <main id="main">
        <ScrollTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/questionnaire" element={<Quiz />} />
          <Route path="/resultats" element={<Results />} />
          <Route path="/explorer" element={<Explore />} />
          <Route path="/comparer" element={<Compare />} />
          <Route path="/programme/:id" element={<Detail />} />
          <Route path="/favoris" element={<Favorites />} />
          <Route path="/methode" element={<Method />} />
          <Route path="*" element={<div className="page narrow"><h1>Page introuvable</h1><Link className="btn primary" to="/">Retour à l'accueil</Link></div>} />
        </Routes>
      </main>
      <footer className="site-footer">
        <p>Comparateur indépendant à vocation éducative. Les conditions des entreprises peuvent évoluer ; vérifie toujours les règles sur le site officiel. Ce site est public et n'est pas un conseil financier.</p>
      </footer>
    </>
  )
}

export function DataErrorScreen({ errors }: { errors: DataError[] }) {
  return (
    <div className="page narrow">
      <h1>Données invalides</h1>
      <p>Le site ne peut pas s'afficher : les fichiers de données contiennent des erreurs.</p>
      <pre className="errors">{formatErrors(errors)}</pre>
    </div>
  )
}

export default function App({ dataset, errors, now }: { dataset: Dataset | null; errors: DataError[]; now?: Date }) {
  if (!dataset) return <DataErrorScreen errors={errors} />
  return (
    <HashRouter>
      <AppStateProvider dataset={dataset} now={now}>
        <GlossaryProvider>
          <Layout />
        </GlossaryProvider>
      </AppStateProvider>
    </HashRouter>
  )
}
