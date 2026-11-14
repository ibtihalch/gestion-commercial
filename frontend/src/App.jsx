import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import PrivateRoute from './routes/PrivateRoute'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ClientsPage from './pages/clients/ClientsPage'
import FournisseursPage from './pages/fournisseurs/FournisseursPage'
import ArticlesPage from './pages/articles/ArticlesPage'
import AffairesPage from './pages/affaires/AffairesPage'
import DevisView from './pages/vente/devis/DevisView'
import DevisPage from './pages/vente/devis/DevisPage'
import DevisForm from './pages/vente/devis/DevisForm'
// ✅ VENTE
import CommandesClientPage from './pages/vente/commandes/CommandesClientPage'
import BonCommandeClientForm from './pages/vente/commandes/BonCommandeClientForm'
import BonCommandeClientView from './pages/vente/commandes/BonCommandeClientView'

// ✅ ACHAT
import CommandesFournisseurPage from './pages/achat/commandes/Commandesfournisseurpage'
import BonCommandeFournisseurForm from './pages/achat/commandes/Boncommandefournisseurform'
import BonCommandeFournisseurView from './pages/achat/commandes/Boncommandefournisseurview'

import BonsLivraisonPage     from './pages/vente/livraisons/Bonslivraisonpage'
import BonLivraisonForm      from './pages/vente/livraisons/Bonlivraisonform'
import BonLivraisonView      from './pages/vente/livraisons/Bonlivraisonview'

import FacturesClientPage from './pages/vente/factures/FacturesClientPage'
import FactureClientForm from './pages/vente/factures/FactureClientForm'
import FactureClientView from './pages/vente/factures/FactureClientView'

import StockPage from './pages/stock/StockPage'
import UtilisateursPage from './pages/utilisateurs/UtilisateursPage'
import EntrepriseSettings from './pages/entreprises/Entreprisesettings'
import Layout from './components/Layout'

import BonsReceptionFournisseurPage from './pages/achat/receptions/Bonsreceptionfournisseurpage'
import BonReceptionFournisseurForm  from './pages/achat/receptions/Bonreceptionfournisseurform'
import BonReceptionFournisseurView  from './pages/achat/receptions/Bonreceptionfournisseurview'

import FacturesFournisseurPage from './pages/achat/factures/Facturesfournisseurpage'
import FactureFournisseurForm  from './pages/achat/factures/Facturefournisseurform'
import FactureFournisseurView  from './pages/achat/factures/Facturefournisseurview'

// ✅ PROFIL
import ProfilPage from './pages/profil/Profilpage'

// Wrapper pour passer l'id depuis l'URL
function EntrepriseSettingsWrapper() {
  const { id } = useParams()
  return <EntrepriseSettings entrepriseId={id} />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="fournisseurs" element={<FournisseursPage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="affaires" element={<AffairesPage />} />

        {/* Devis */}
        <Route path="vente/devis" element={<DevisPage />} />
        <Route path="devis/nouveau" element={<DevisForm />} />
        <Route path="devis/:id" element={<DevisView />} />
        <Route path="devis/:id/modifier" element={<DevisForm />} />

        {/* Bons de commande client */}
        <Route path="commandes-client/nouveau"      element={<BonCommandeClientForm />} />
        <Route path="commandes-client/:id"          element={<BonCommandeClientView />} />
        <Route path="commandes-client/:id/modifier" element={<BonCommandeClientForm />} />
        <Route path="vente/commandes" element={<CommandesClientPage />} />

        {/* Livraisons */}
        <Route path="vente/livraisons"              element={<BonsLivraisonPage />} />
        <Route path="livraisons/nouveau"            element={<BonLivraisonForm />} />
        <Route path="livraisons/:id"                element={<BonLivraisonView />} />
        <Route path="livraisons/:id/modifier"       element={<BonLivraisonForm />} />

        {/* Factures client */}
        <Route path="vente/factures"                element={<FacturesClientPage />} />
        <Route path="factures/nouvelle"             element={<FactureClientForm />} />
        <Route path="factures/:id"                  element={<FactureClientView />} />
        <Route path="factures/:id/modifier"         element={<FactureClientForm />} />

        {/* Stock */}
        <Route path="stock" element={<StockPage />} />

        {/* Bons de commande fournisseur */}
        <Route path="/achat/commandes"                        element={<CommandesFournisseurPage />} />
        <Route path="/commandes-fournisseur/nouveau"          element={<BonCommandeFournisseurForm />} />
        <Route path="/commandes-fournisseur/:id"              element={<BonCommandeFournisseurView />} />
        <Route path="/commandes-fournisseur/:id/modifier"     element={<BonCommandeFournisseurForm />} />

        {/* Bons de réception fournisseur */}
        <Route path="achat/receptions"                        element={<BonsReceptionFournisseurPage />} />
        <Route path="receptions-fournisseur/nouveau"          element={<BonReceptionFournisseurForm />} />
        <Route path="receptions-fournisseur/:id"              element={<BonReceptionFournisseurView />} />
        <Route path="receptions-fournisseur/:id/modifier"     element={<BonReceptionFournisseurForm />} />

        {/* Factures fournisseur */}
        <Route path="achat/factures"                          element={<FacturesFournisseurPage />} />
        <Route path="/factures-fournisseur/nouvelle"          element={<FactureFournisseurForm />} />
        <Route path="/factures-fournisseur/:id"               element={<FactureFournisseurView />} />
        <Route path="/factures-fournisseur/:id/modifier"      element={<FactureFournisseurForm />} />

        {/* Entreprise */}
        <Route path="parametres/entreprise"     element={<EntrepriseSettings />} />
        <Route path="parametres/entreprise/:id" element={<EntrepriseSettingsWrapper />} />

        {/* ✅ Profil utilisateur — accessible à tous les rôles connectés */}
        <Route path="profil/me"   element={<ProfilPage />} />
        <Route path="profil/:id"  element={
          <PrivateRoute roles={['ROLE_ADMIN']}>
            <ProfilPage />
          </PrivateRoute>
        } />

        {/* Admin — gestion utilisateurs */}
        <Route path="utilisateurs" element={
          <PrivateRoute roles={['ROLE_ADMIN']}>
            <UtilisateursPage />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="/403" element={
        <div style={{ textAlign: 'center', marginTop: 100 }}>
          <h2>403 — Accès refusé</h2>
          <p>Vous n'avez pas les droits pour accéder à cette page.</p>
        </div>
      } />
    </Routes>
  )
} 
