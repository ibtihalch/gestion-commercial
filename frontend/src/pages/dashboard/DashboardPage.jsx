import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Grid, Stack, CircularProgress, Divider
} from '@mui/material'
import {
  People, Business, Inventory, Receipt,
  TrendingUp, ShoppingCart, AccountBalance, Warning,
  ArrowForward
} from '@mui/icons-material'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import dashboardService from '../../services/dashboardService'
import { useAuth } from '../../context/AuthContext'

const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'
const ORANGE  = '#F59E0B'

// ─── Rôles ────────────────────────────────────────────────────────────────────
const ROLES = {
  ADMIN:      'ROLE_ADMIN',
  VENDEUR:    'ROLE_VENDEUR',
  ACHETEUR:   'ROLE_ACHETEUR',
  MAGASINIER: 'ROLE_MAGASINIER',
  CONSULTANT: 'ROLE_CONSULTANT',
}

const fmtMAD = (v) =>
  new Intl.NumberFormat('fr-MA', {
    style: 'currency', currency: 'MAD', minimumFractionDigits: 0,
  }).format(v || 0)

const fmtShort = (v) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M'
  if (v >= 1_000)     return Math.round(v / 1_000) + ' k'
  return String(v ?? '—')
}

// ─── Tooltip graphique ────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{
      bgcolor: 'white',
      border: `1px solid #e2e8f0`,
      borderRadius: 1.5,
      px: 1.5, py: 1,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: BLUE_DD, mb: 0.3 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: BLUE }}>
        {fmtMAD(payload[0]?.value)}
      </Typography>
    </Box>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, money, onClick, highlight }) => (
  <Box
    onClick={onClick}
    sx={{
      bgcolor     : 'white',
      border      : `1px solid ${highlight ? BLUE + '40' : '#e2e8f0'}`,
      borderRadius: 2,
      p           : '14px 16px',
      cursor      : onClick ? 'pointer' : 'default',
      transition  : 'all 0.15s',
      '&:hover'   : onClick ? {
        borderColor: BLUE + '60',
        transform  : 'translateY(-1px)',
        boxShadow  : `0 4px 16px ${BLUE}12`,
      } : {},
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.2}>
      <Box sx={{
        width: 32, height: 32, borderRadius: '8px',
        bgcolor: highlight ? BLUE : '#EEF2FB',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon sx={{ fontSize: 17, color: highlight ? 'white' : BLUE }} />
      </Box>
      {onClick && <ArrowForward sx={{ fontSize: 13, color: '#c7d4e8' }} />}
    </Stack>
    <Typography sx={{
      fontSize: '1.15rem', fontWeight: 700, color: BLUE_DD,
      lineHeight: 1, mb: 0.5, letterSpacing: '-0.01em',
    }}>
      {money ? fmtShort(value) : (value ?? '—')}
    </Typography>
    <Typography sx={{
      fontSize: '0.7rem', fontWeight: 600, color: '#64748b',
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {label}
    </Typography>
    {sub && (
      <Typography sx={{ fontSize: '0.63rem', color: '#94a3b8', mt: 0.3 }}>
        {sub}
      </Typography>
    )}
  </Box>
)

// ═════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { user }              = useAuth()
  const navigate              = useNavigate()
  const [stats,   setStats]   = useState(null)
  const [caData,  setCaData]  = useState([])
  const [loading, setLoading] = useState(true)

  const entrepriseId = user?.entrepriseId
  const annee        = new Date().getFullYear()

  // ─── Helpers rôles ──────────────────────────────────────────────────────────
  const hasRole      = (role) => user?.roles?.includes(role)
  const isAdmin      = hasRole(ROLES.ADMIN)
  const isVendeur    = hasRole(ROLES.VENDEUR)
  const isAcheteur   = hasRole(ROLES.ACHETEUR)
  const isMagasinier = hasRole(ROLES.MAGASINIER)

  // ─── Permissions d'affichage ────────────────────────────────────────────────
  const canSeeFinancial = isAdmin || isVendeur           // CA, commandes, impayées
  const canSeeGraph     = isAdmin                        // graphique CA mensuel uniquement
  const canSeeStock     = isAdmin || isVendeur || isAcheteur || isMagasinier
  const canSeeVenteRA   = isAdmin || isVendeur           // accès rapide vente
  const canSeeAchatRA   = isAdmin || isAcheteur          // accès rapide achat
  const canSeeAccesRapide = canSeeVenteRA || canSeeAchatRA

  useEffect(() => {
    const calls = [dashboardService.getStats(entrepriseId)]
    // Graphique uniquement pour admin — inutile de fetch sinon
    if (canSeeGraph) calls.push(dashboardService.getCaMensuel(entrepriseId, annee))

    Promise.all(calls)
      .then(([s, ca]) => {
        setStats(s)
        if (ca) setCaData(ca)
      })
      .finally(() => setLoading(false))
  }, [entrepriseId])

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" mt={12}>
      <CircularProgress sx={{ color: BLUE }} size={28} />
    </Box>
  )

  const today = new Date().toLocaleDateString('fr-MA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const caTotal    = caData.reduce((s, d) => s + Number(d.montant || 0), 0)
  const activeMois = caData.filter(d => d.montant > 0).length

  // ─── Accès rapide selon rôle ────────────────────────────────────────────────
  const accesRapideItems = [
    ...(canSeeVenteRA ? [
      { label: 'Nouvelle facture client',  path: '/factures/nouvelle',  color: BLUE    },
      { label: 'Nouveau bon de livraison', path: '/livraisons/nouveau', color: BLUE_D  },
    ] : []),
    ...(canSeeAchatRA ? [
      { label: 'Nouvelle facture fournisseur', path: '/factures-fournisseur/nouvelle',  color: '#7C3AED' },
      { label: 'Nouveau bon de réception',     path: '/receptions-fournisseur/nouveau', color: '#0891B2' },
    ] : []),
  ]

  // ─── Layout de la section inférieure ────────────────────────────────────────
  // Graphique prend 8/12, sidebar 4/12 — si pas de graphique, sidebar plein 12
  const showRightCol   = canSeeStock || canSeeAccesRapide
  const graphColSize   = showRightCol ? 8 : 12
  const sidebarColSize = 4

  return (
    <Box>

      {/* ── BANDE DÉGRADÉ ────────────────────────────────────────────────────── */}
      <Box sx={{
        height: 3, borderRadius: 2,
        background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)',
        mb: 2,
      }} />

      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <Stack
        direction="row" alignItems="center" justifyContent="space-between"
        mb={2.5}
        sx={{
          bgcolor: 'white', border: '1px solid #e2e8f0',
          borderRadius: 2, px: 2.5, py: 1.5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BLUE_DD }}>
            Tableau de bord
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500, mt: 0.3 }}>
            Vue d'ensemble · {today}
          </Typography>
        </Box>
        <Box sx={{
          bgcolor: '#FFFBEB', border: `1px solid ${ORANGE}30`,
          borderRadius: 1.5, px: 1.5, py: 0.5,
        }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: ORANGE }}>
            {annee}
          </Typography>
        </Box>
      </Stack>

      {/* ── KPIs COMPTAGE — tous les rôles ───────────────────────────────────── */}
      <Grid container spacing={1.5} mb={1.5}>
        {[
          { icon: People,    label: 'Clients',      value: stats?.totalClients,      sub: 'Actifs',       path: '/clients' },
          { icon: Business,  label: 'Fournisseurs', value: stats?.totalFournisseurs, sub: 'Référencés',   path: '/fournisseurs' },
          { icon: Inventory, label: 'Articles',     value: stats?.totalArticles,     sub: 'En catalogue', path: '/articles' },
          { icon: Receipt,   label: 'Devis',        value: stats?.totalDevis,        sub: 'En cours',     path: '/vente/devis' },
        ].map(({ icon, label, value, sub, path }) => (
          <Grid item xs={6} sm={3} key={label}>
            <KpiCard icon={icon} label={label} value={value} sub={sub} onClick={() => navigate(path)} />
          </Grid>
        ))}
      </Grid>

      {/* ── KPIs FINANCIERS — admin + vendeur seulement ──────────────────────── */}
      {canSeeFinancial && (
        <Grid container spacing={1.5} mb={2.5}>
          <Grid item xs={12} sm={4}>
            <KpiCard
              icon={TrendingUp} label="CA réalisé" value={stats?.chiffreAffaires}
              sub="Factures payées · MAD HT" money highlight
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KpiCard
              icon={ShoppingCart} label="Commandes client" value={stats?.totalCommandesClient}
              sub="Total TTC" money onClick={() => navigate('/vente/commandes')}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KpiCard
              icon={AccountBalance} label="Impayées" value={stats?.facturesImpayees}
              sub="À recouvrer" money onClick={() => navigate('/vente/factures')}
            />
          </Grid>
        </Grid>
      )}

      {/* ── GRAPHIQUE + SIDEBAR ───────────────────────────────────────────────── */}
      {(canSeeGraph || showRightCol) && (
        <Grid container spacing={1.5}>

          {/* Graphique CA mensuel — admin uniquement */}
          {canSeeGraph && (
            <Grid item xs={12} md={graphColSize}>
              <Box sx={{
                bgcolor: 'white', border: '1px solid #e2e8f0',
                borderRadius: 2, p: 2.2,
              }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2}>
                  <Box>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: BLUE_DD }}>
                      CA mensuel — {annee}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 0.3 }}>
                      Factures payées en MAD HT
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#EEF2FB', borderRadius: 1.5, px: 1.2, py: 0.4 }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: BLUE_D }}>
                      {activeMois} mois actifs
                    </Typography>
                  </Box>
                </Stack>

                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={caData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={BLUE} stopOpacity={0.12} />
                        <stop offset="95%" stopColor={BLUE} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="mois"
                      tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Outfit' }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Outfit' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={fmtShort} width={48}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: `${BLUE}20`, strokeWidth: 1 }} />
                    <Area
                      type="monotone" dataKey="montant"
                      stroke={BLUE} strokeWidth={2} fill="url(#caGrad)"
                      dot={false} activeDot={{ r: 4, fill: BLUE, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                <Divider sx={{ mt: 2, mb: 1.5 }} />
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
                    Total {annee}
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: BLUE_D }}>
                    {fmtMAD(caTotal)}
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          )}

          {/* Colonne droite — stock + accès rapide */}
          {showRightCol && (
            <Grid item xs={12} md={canSeeGraph ? sidebarColSize : 12}>
              <Stack gap={1.5} height="100%">

                {/* Alerte stock — admin, vendeur, acheteur, magasinier */}
                {canSeeStock && (
                  <Box
                    onClick={() => navigate('/stock')}
                    sx={{
                      bgcolor : stats?.articlesAlerteStock > 0 ? '#FFFBEB' : 'white',
                      border  : `1px solid ${stats?.articlesAlerteStock > 0 ? ORANGE + '40' : '#e2e8f0'}`,
                      borderRadius: 2, p: '12px 14px',
                      cursor: 'pointer', transition: 'all 0.15s',
                      '&:hover': { borderColor: ORANGE + '80' },
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '8px',
                        bgcolor: stats?.articlesAlerteStock > 0 ? '#FEF3C7' : '#EEF2FB',
                        border: `1px solid ${stats?.articlesAlerteStock > 0 ? ORANGE + '30' : '#e2e8f0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Warning sx={{ fontSize: 17, color: stats?.articlesAlerteStock > 0 ? ORANGE : '#94a3b8' }} />
                      </Box>
                      <Box flex={1}>
                        <Typography sx={{
                          fontSize: '0.78rem', fontWeight: 700,
                          color: stats?.articlesAlerteStock > 0 ? '#92400E' : BLUE_DD,
                        }}>
                          {stats?.articlesAlerteStock > 0
                            ? `${stats.articlesAlerteStock} articles sous seuil`
                            : 'Stock OK'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.63rem', color: '#94a3b8', mt: 0.3 }}>
                          {stats?.articlesAlerteStock > 0 ? 'Réapprovisionnement requis' : 'Aucune alerte'}
                        </Typography>
                      </Box>
                      <ArrowForward sx={{ fontSize: 13, color: '#c7d4e8' }} />
                    </Stack>
                  </Box>
                )}

                {/* Accès rapide — admin, vendeur, acheteur */}
                {canSeeAccesRapide && (
                  <Box sx={{
                    bgcolor: 'white', border: '1px solid #e2e8f0',
                    borderRadius: 2, p: '14px 16px',
                    flex: canSeeStock ? 1 : undefined,
                  }}>
                    <Typography sx={{
                      fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8',
                      textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.5,
                    }}>
                      Accès rapide
                    </Typography>
                    <Stack gap={0.3}>
                      {accesRapideItems.map(item => (
                        <Stack
                          key={item.path}
                          direction="row" alignItems="center" justifyContent="space-between"
                          onClick={() => navigate(item.path)}
                          sx={{
                            px: 1, py: '7px', borderRadius: '8px',
                            cursor: 'pointer', transition: 'background 0.12s',
                            '&:hover': { bgcolor: '#EEF2FB' },
                          }}
                        >
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Box sx={{
                              width: 6, height: 6, borderRadius: '50%',
                              bgcolor: item.color, flexShrink: 0,
                            }} />
                            <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, color: '#475569' }}>
                              {item.label}
                            </Typography>
                          </Stack>
                          <ArrowForward sx={{ fontSize: 12, color: '#c7d4e8' }} />
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}

              </Stack>
            </Grid>
          )}

        </Grid>
      )}

    </Box>
  )
}