import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import utilisateurService from '../services/utilisateurService'
import ChatWidget from './ChatWidget'
import notificationService from '../services/notificationService'
import globalSearchService from '../services/globalSearchService'

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'
const ORANGE  = '#F59E0B'

// ─── Définition des rôles ─────────────────────────────────────────────────────
const ROLES = {
  ADMIN:       'ROLE_ADMIN',
  VENDEUR:     'ROLE_VENDEUR',
  ACHETEUR:    'ROLE_ACHETEUR',
  MAGASINIER:  'ROLE_MAGASINIER',
  CONSULTANT:  'ROLE_CONSULTANT',
}

const PRINCIPAL_ITEMS = [
  { label: 'Tableau de bord', icon: 'bi-speedometer2',  path: '/dashboard' },
  { label: 'Clients',         icon: 'bi-people-fill',    path: '/clients' },
  { label: 'Fournisseurs',    icon: 'bi-building-fill',  path: '/fournisseurs' },
  { label: 'Articles',        icon: 'bi-box-seam-fill',  path: '/articles' },
  { label: 'Affaires',        icon: 'bi-briefcase-fill', path: '/affaires' },
]

const VENTE_ITEMS = [
  { label: 'Devis ',            path: '/vente/devis',      icon: 'bi-file-earmark-text-fill' },
  { label: 'Commande Client ',  path: '/vente/commandes',  icon: 'bi-cart-fill' },
  { label: 'Livraison Client ', path: '/vente/livraisons', icon: 'bi-truck' },
  { label: 'Facture Client ',   path: '/vente/factures',   icon: 'bi-receipt-cutoff' },
]

const ACHAT_ITEMS = [
  { label: 'Commande Fournisseur',  path: '/achat/commandes',  icon: 'bi-bag-plus-fill' },
  { label: 'Réception Fournisseur', path: '/achat/receptions', icon: 'bi-box-arrow-in-down' },
  { label: 'Factures Fournisseur',  path: '/achat/factures',   icon: 'bi-file-earmark-check-fill' },
]

const ADMIN_ITEMS = [
  { label: 'Utilisateurs', icon: 'bi-person-gear', path: '/utilisateurs' },
  { label: 'Entreprise',   icon: 'bi-gear-fill',   path: '/parametres/entreprise' },
]

const ALL_ITEMS = [
  ...PRINCIPAL_ITEMS,
  ...VENTE_ITEMS,
  ...ACHAT_ITEMS,
  ...ADMIN_ITEMS,
  { label: 'Stock',      icon: 'bi-archive-fill',  path: '/stock' },
  { label: 'Mon Profil', icon: 'bi-person-circle', path: '/profil/me' },
]

export default function Layout() {
  const { user, logout }               = useAuth()
  const navigate                       = useNavigate()
  const location                       = useLocation()
  const [collapsed,    setCollapsed]   = useState(false)
  const [mobileOpen,   setMobileOpen]  = useState(false)
  const [venteOpen,    setVenteOpen]   = useState(false)
  const [achatOpen,    setAchatOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen]= useState(false)
  const [avatarUrl,    setAvatarUrl]   = useState(null)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchSelection, setSearchSelection] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    const fetchAvatar = () => {
      utilisateurService.getMe()
  .then(data => {
    const img = data?.profil?.img
    setAvatarUrl(img ? (img.startsWith('http') ? img : `${BASE_URL}${img}`) : null)
  })
  .catch(() => {})
    }
    fetchAvatar()
    window.addEventListener('avatar-updated', fetchAvatar)
    return () => window.removeEventListener('avatar-updated', fetchAvatar)
  }, [user?.id])

  useEffect(() => {
    const handleShortcut = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        setNotificationOpen(false)
        setUserMenuOpen(false)
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    if (!searchOpen || searchQuery.trim().length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return undefined
    }
    setSearchLoading(true)
    const timer = window.setTimeout(() => {
      globalSearchService.search(searchQuery.trim())
        .then(data => { setSearchResults(data); setSearchSelection(0) })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery, searchOpen])

  useEffect(() => {
    if (!user?.id) return undefined
    const refreshCount = () => notificationService.getUnreadCount()
      .then(setUnreadCount).catch(() => {})
    refreshCount()
    const interval = window.setInterval(refreshCount, 60000)
    return () => window.clearInterval(interval)
  }, [user?.id])

  // ─── Helpers rôles ────────────────────────────────────────────────────────
  const hasRole  = (role) => user?.roles?.includes(role)
  const isAdmin      = hasRole(ROLES.ADMIN)
  const isVendeur    = hasRole(ROLES.VENDEUR)
  const isAcheteur   = hasRole(ROLES.ACHETEUR)
  const isMagasinier = hasRole(ROLES.MAGASINIER)
  const isConsultant = hasRole(ROLES.CONSULTANT)

  const canSeeVente    = isAdmin || isVendeur
  const canSeeAchat    = isAdmin || isAcheteur
  const canSeeStock    = isAdmin || isVendeur || isAcheteur || isMagasinier
  const canSeeAdmin    = isAdmin

  const initials = (user?.login || '?').charAt(0).toUpperCase()

  const getRoleLabel = () => {
    if (isAdmin)      return 'Administrateur'
    if (isVendeur)    return 'Vendeur'
    if (isAcheteur)   return 'Acheteur'
    if (isMagasinier) return 'Magasinier'
    if (isConsultant) return 'Consultant'
    return 'Utilisateur'
  }

  const currentItem = ALL_ITEMS.find(i => {
    if (i.path === '/profil/me' && location.pathname.startsWith('/profil/')) return true
    return i.path === location.pathname
  })

  const handleLogout = () => { logout(); navigate('/login') }

  const handleNotificationToggle = async () => {
    const nextOpen = !notificationOpen
    setNotificationOpen(nextOpen)
    setUserMenuOpen(false)
    if (!nextOpen) return
    setNotificationLoading(true)
    try {
      const data = await notificationService.getAll(30)
      setNotifications(data)
      setUnreadCount(data.filter(item => !item.lue).length)
    } finally {
      setNotificationLoading(false)
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.lue) {
      await notificationService.markAsRead(notification.id).catch(() => {})
      setNotifications(items => items.map(item => item.id === notification.id ? { ...item, lue: true } : item))
      setUnreadCount(count => Math.max(0, count - 1))
    }
    setNotificationOpen(false)
    if (notification.path) navigate(notification.path)
  }

  const handleReadAll = async () => {
    await notificationService.markAllAsRead()
    setNotifications(items => items.map(item => ({ ...item, lue: true })))
    setUnreadCount(0)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const openSearchResult = result => {
    closeSearch()
    navigate(result.path)
  }

  const handleSearchKeyDown = event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSearchSelection(index => Math.min(index + 1, searchResults.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSearchSelection(index => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && searchResults[searchSelection]) {
      event.preventDefault()
      openSearchResult(searchResults[searchSelection])
    }
  }

  const searchGroupLabel = type => {
    if (['CLIENT', 'FOURNISSEUR'].includes(type)) return 'Partenaires'
    if (['ARTICLE', 'AFFAIRE'].includes(type)) return 'Catalogue et affaires'
    if (['DEVIS', 'COMMANDE_CLIENT', 'LIVRAISON', 'FACTURE_CLIENT'].includes(type)) return 'Ventes'
    return 'Achats'
  }

  const groupedSearchResults = searchResults.reduce((groups, result, index) => {
    const label = searchGroupLabel(result.type)
    if (!groups[label]) groups[label] = []
    groups[label].push({ ...result, resultIndex: index })
    return groups
  }, {})

  const isVenteActive = VENTE_ITEMS.some(i => i.path === location.pathname)
  const isAchatActive = ACHAT_ITEMS.some(i => i.path === location.pathname)
  const filteredNotifications = notifications.filter(notification => {
    if (notificationFilter === 'unread') return !notification.lue
    if (notificationFilter === 'urgent') return notification.niveau === 'URGENT'
    return true
  })

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .ly-root {
      display: flex; height: 100vh; overflow: hidden;
      font-family: 'Outfit', sans-serif; background: #EEF2FB;
    }

    .ly-sidebar {
      width: 260px; height: 100vh; background: #fff;
      display: flex; flex-direction: column; flex-shrink: 0;
      position: relative; z-index: 100; border-right: 1px solid #e2e8f0;
      transition: width 0.25s cubic-bezier(.4,0,.2,1); overflow: hidden;
    }
    .ly-sidebar.collapsed { width: 64px; }
    .ly-sidebar::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, ${BLUE} 0%, ${ORANGE} 60%, #fde68a 100%); z-index: 5;
    }

    .ly-brand {
      display: flex; align-items: center; gap: 10px;
      padding: 22px 14px 16px; border-bottom: 1px solid #f1f5f9;
      min-height: 68px; flex-shrink: 0;
    }
    .ly-brand-icon {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
    .ly-brand-icon i { color: white; font-size: 1rem; }
    .ly-brand-text {
      flex: 1; min-width: 0; overflow: hidden;
      transition: opacity 0.2s, max-width 0.25s;
      max-width: 180px; white-space: nowrap;
    }
    .collapsed .ly-brand-text { opacity: 0; max-width: 0; }
    .ly-brand-name { font-size: .78rem; font-weight: 800; color: ${BLUE_DD}; letter-spacing: 1px; text-transform: uppercase; line-height: 1.2; }
    .ly-brand-sub  { font-size: .58rem; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600; }

    .ly-toggle {
  width: 15px; height: 15px; background: #fff; border: 1.5px solid #e2e8f0;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,.08);
  transition: background 0.15s, border-color 0.15s;
  margin-left: auto;
}
    .ly-toggle:hover { background: ${ORANGE}; border-color: ${ORANGE}; }
    .ly-toggle:hover i { color: white; }
    .ly-toggle i { color: #64748b; font-size: .65rem; transition: color 0.15s; }
   .collapsed .ly-brand {
  justify-content: center;
  padding: 22px 0 16px;
  flex-direction: column;
  gap: 8px;
}
.collapsed .ly-toggle { margin-left: 0; }

    .ly-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 10px 0; }
    .ly-nav::-webkit-scrollbar { width: 3px; }
    .ly-nav::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

    .ly-section-label {
      padding: 10px 14px 3px; font-size: .6rem; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 2px; white-space: nowrap;
      overflow: hidden; transition: opacity 0.2s, max-height 0.2s;
      max-height: 30px;
    }
    .collapsed .ly-section-label { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }

    .ly-nav-item {
      display: flex; align-items: center; gap: 9px; padding: 8px 12px; margin: 1px 8px;
      border-radius: 8px; cursor: pointer; border-left: 2px solid transparent;
      transition: all 0.15s; position: relative; overflow: hidden;
    }
    .ly-nav-item i.icon { font-size: .95rem; color: #94a3b8; flex-shrink: 0; width: 20px; text-align: center; transition: color 0.15s; }
    .ly-nav-item span {
      font-size: .8rem; font-weight: 600; color: #64748b; white-space: nowrap;
      flex: 1; transition: color 0.15s, opacity 0.2s, max-width 0.25s;
      max-width: 160px; overflow: hidden;
    }
    .collapsed .ly-nav-item span { opacity: 0; max-width: 0; }
    .collapsed .ly-nav-item { margin: 1px 6px; padding: 8px 10px; justify-content: center; }
    .ly-nav-item:hover { background: #f8faff; border-left-color: #c7d8fa; }
    .ly-nav-item:hover i.icon { color: ${BLUE}; }
    .ly-nav-item:hover span { color: ${BLUE_D}; }
    .ly-nav-item.active { background: #eff5ff; border-left-color: ${ORANGE}; }
    .ly-nav-item.active i.icon { color: ${BLUE}; }
    .ly-nav-item.active span { color: ${BLUE_D}; font-weight: 700; }
    .ly-nav-item.active::after {
      content: ''; position: absolute; right: 10px; top: 50%;
      transform: translateY(-50%); width: 6px; height: 6px;
      border-radius: 50%; background: ${ORANGE};
    }
    .collapsed .ly-nav-item.active::after { display: none; }

    .ly-arrow { font-size: .65rem; color: #c7d4e8; margin-left: auto; flex-shrink: 0; transition: transform 0.2s; }
    .ly-nav-item.menu-open .ly-arrow { transform: rotate(90deg); }
    .collapsed .ly-arrow { display: none; }

    .ly-submenu { overflow: hidden; max-height: 0; transition: max-height 0.25s cubic-bezier(.4,0,.2,1); }
    .ly-submenu.open { max-height: 300px; }
    .collapsed .ly-submenu { display: none !important; }

    .ly-sub-item {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 12px 7px 34px; margin: 1px 8px; border-radius: 7px; cursor: pointer;
      font-size: .76rem; font-weight: 600; color: #94a3b8;
      border-left: 2px solid transparent; transition: all 0.15s; white-space: nowrap;
    }
    .ly-sub-item i { font-size: .82rem; color: #b0bdcc; flex-shrink: 0; width: 16px; text-align: center; transition: color 0.15s; }
    .ly-sub-item:hover { background: #f8faff; color: ${BLUE}; border-left-color: #c7d8fa; }
    .ly-sub-item:hover i { color: ${BLUE}; }
    .ly-sub-item.active { color: ${BLUE_D}; background: #eff5ff; border-left-color: ${ORANGE}; font-weight: 700; }
    .ly-sub-item.active i { color: ${ORANGE}; }

    .ly-divider { height: 1px; background: #f1f5f9; margin: 8px 14px; }

    .ly-user {
      padding: 10px; border-top: 1px solid #f1f5f9;
      display: flex; align-items: center; gap: 9px;
      cursor: pointer; background: #fafbfe; overflow: hidden; transition: background 0.15s;
      flex-shrink: 0;
    }
    .ly-user:hover { background: #f0f4ff; }
    .ly-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: ${ORANGE};
      display: flex; align-items: center; justify-content: center;
      font-size: .82rem; font-weight: 800; color: white; flex-shrink: 0;
      overflow: hidden; border: 2px solid rgba(245,158,11,.35);
    }
    .ly-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

    .ly-user-info {
      flex: 1; min-width: 0; overflow: hidden;
      transition: opacity 0.2s, max-width 0.25s; max-width: 160px;
    }
    .collapsed .ly-user-info { opacity: 0; max-width: 0; }
    .ly-user-name { font-size: .78rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ly-user-role { font-size: .62rem; font-weight: 700; color: ${ORANGE}; text-transform: uppercase; letter-spacing: .8px; }
    .ly-user-role.normal { color: #94a3b8; }
    .ly-logout-btn {
      background: none; border: none; cursor: pointer; padding: 5px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s;
    }
    .ly-logout-btn i { color: #c7d4e8; font-size: .9rem; transition: color 0.15s; }
    .ly-logout-btn:hover { background: rgba(220,38,38,.1); }
    .ly-logout-btn:hover i { color: #ef4444; }
    .collapsed .ly-logout-btn { display: none; }

    .ly-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .ly-topbar {
      height: 56px; background: white; display: flex; align-items: center;
      padding: 0 24px; gap: 14px; flex-shrink: 0; position: relative; border-bottom: 1px solid #e9eef8;
    }
    .ly-topbar::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, ${BLUE} 0%, ${ORANGE} 45%, rgba(245,158,11,.1) 70%, transparent 100%);
    }
    .ly-burger { display: none; background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; transition: background 0.15s; }
    .ly-burger:hover { background: rgba(26,111,232,.08); }
    .ly-burger i { color: ${BLUE_D}; font-size: 1.1rem; }

    .ly-breadcrumb { display: flex; align-items: center; gap: 8px; flex: 1; }
    .ly-breadcrumb-home { font-size: .72rem; font-weight: 600; color: rgba(26,111,232,.5); cursor: pointer; transition: color 0.15s; }
    .ly-breadcrumb-home:hover { color: ${BLUE}; }
    .ly-breadcrumb-sep { color: rgba(26,111,232,.3); font-size: .8rem; }
    .ly-page-title { font-size: .9rem; font-weight: 700; color: ${BLUE_DD}; letter-spacing: .5px; text-transform: uppercase; }

    .ly-topbar-right { display: flex; align-items: center; gap: 8px; }
    .ly-topbar-btn {
      background: none; border: 1px solid #e2e8f0; border-radius: 8px;
      width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s; position: relative;
    }
    .ly-topbar-btn i { color: #94a3b8; font-size: .9rem; }
    .ly-topbar-btn:hover { background: #f0f5ff; border-color: #c7d8fa; }
    .ly-topbar-btn:hover i { color: ${BLUE}; }
    .ly-notif-dot {
      position: absolute; top: 6px; right: 7px; width: 7px; height: 7px;
      border-radius: 50%; background: ${ORANGE}; border: 1.5px solid white;
    }
    .ly-notif-wrap { position: relative; }
    .ly-notif-count {
      position: absolute; top: -6px; right: -7px; min-width: 17px; height: 17px; padding: 0 4px;
      border-radius: 9px; background: ${ORANGE}; color: white; border: 2px solid white;
      font-size: .55rem; font-weight: 800; display: flex; align-items: center; justify-content: center;
    }
    .ly-notif-panel {
      position: absolute; top: calc(100% + 10px); right: 0; width: 360px; max-height: 470px;
      background: white; border: 1px solid #dfe7f3; border-radius: 12px;
      box-shadow: 0 18px 46px rgba(14,61,156,.16); overflow: hidden; z-index: 300;
    }
    .ly-notif-panel::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, ${BLUE}, ${ORANGE}, #fde68a);
    }
    .ly-notif-header { padding: 15px 14px 11px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #edf1f7; }
    .ly-notif-title { font-size: .84rem; color: ${BLUE_DD}; font-weight: 800; }
    .ly-notif-read-all { border: 0; background: none; color: ${BLUE}; font: inherit; font-size: .65rem; font-weight: 700; cursor: pointer; }
    .ly-notif-read-all:hover { text-decoration: underline; }
    .ly-notif-list { max-height: 405px; overflow-y: auto; }
    .ly-notif-filters { display: flex; gap: 5px; padding: 8px 12px; border-bottom: 1px solid #edf1f7; background: #fafcff; }
    .ly-notif-filter { border: 1px solid #dfe7f3; background: white; color: #718198; border-radius: 7px; padding: 4px 9px; font: inherit; font-size: .62rem; font-weight: 700; cursor: pointer; }
    .ly-notif-filter:hover { color: ${BLUE}; border-color: #b9d0f2; }
    .ly-notif-filter.active { color: white; background: ${BLUE}; border-color: ${BLUE}; }
    .ly-notif-item { display: flex; gap: 10px; padding: 11px 13px; cursor: pointer; border-bottom: 1px solid #f0f3f8; transition: background .15s; }
    .ly-notif-item:hover { background: #f7faff; }
    .ly-notif-item.unread { background: #f0f5ff; }
    .ly-notif-icon { width: 31px; height: 31px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #eef4ff; color: ${BLUE}; }
    .ly-notif-icon.urgent { background: #fff0f0; color: #dc2626; }
    .ly-notif-body { min-width: 0; flex: 1; }
    .ly-notif-item-title { font-size: .72rem; font-weight: 750; color: #26364d; display: flex; align-items: center; gap: 6px; }
    .ly-notif-unread-dot { width: 6px; height: 6px; border-radius: 50%; background: ${ORANGE}; flex-shrink: 0; }
    .ly-notif-message { margin-top: 3px; font-size: .66rem; line-height: 1.4; color: #718198; }
    .ly-notif-time { margin-top: 4px; font-size: .57rem; color: #a0aec0; }
    .ly-notif-empty { padding: 35px 20px; text-align: center; color: #94a3b8; font-size: .72rem; }

    .ly-topbar-user {
      display: flex; align-items: center; gap: 8px; padding: 4px 10px 4px 4px;
      border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer;
      transition: all 0.15s; background: white; position: relative;
    }
    .ly-topbar-user:hover { background: #f0f5ff; border-color: #c7d8fa; }
    .ly-topbar-avatar {
      width: 28px; height: 28px; border-radius: 50%; background: ${ORANGE};
      display: flex; align-items: center; justify-content: center;
      font-size: .78rem; font-weight: 800; color: white;
      overflow: hidden; border: 2px solid rgba(245,158,11,.3);
    }
    .ly-topbar-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

    .ly-topbar-name { font-size: .78rem; font-weight: 700; color: ${BLUE_DD}; }
    .ly-topbar-chev { font-size: .7rem; color: #94a3b8; }

    .ly-dropdown {
      position: absolute; top: calc(100% + 8px); right: 0; background: white;
      border: 1px solid #e2e8f0; border-radius: 10px; min-width: 180px;
      box-shadow: 0 8px 24px rgba(0,0,0,.08); overflow: hidden; z-index: 200;
    }
    .ly-dropdown-header { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
    .ly-dropdown-login { font-size: .82rem; font-weight: 700; color: ${BLUE_DD}; }
    .ly-dropdown-badge {
      display: inline-block; font-size: .6rem; font-weight: 700; padding: 2px 7px;
      border-radius: 4px; background: rgba(245,158,11,.15); color: #d97706;
      text-transform: uppercase; letter-spacing: .5px;
    }
    .ly-dropdown-item {
      display: flex; align-items: center; gap: 9px; padding: 9px 14px;
      font-size: .82rem; font-weight: 600; color: #64748b; cursor: pointer; transition: background 0.12s;
    }
    .ly-dropdown-item i { font-size: .9rem; }
    .ly-dropdown-item:hover { background: #f0f5ff; color: ${BLUE}; }
    .ly-dropdown-item.danger { color: #dc2626; }
    .ly-dropdown-item.danger:hover { background: rgba(220,38,38,.06); color: #b91c1c; }

    .ly-content { flex: 1; overflow-y: auto; padding: 24px; background: #ffffff; }
    .ly-content::-webkit-scrollbar { width: 5px; }
    .ly-content::-webkit-scrollbar-thumb { background: rgba(26,111,232,.15); border-radius: 3px; }

    .ly-overlay { display: none; position: fixed; inset: 0; background: rgba(13,59,140,.5); z-index: 99; }

    .ly-search-overlay { position: fixed; inset: 0; z-index: 1500; background: transparent; }
    .ly-search-modal { position: absolute; top: 62px; right: 205px; width: min(470px, calc(100vw - 28px)); max-height: 560px; background: white; border: 1px solid #dce5f1; border-radius: 12px; box-shadow: 0 18px 46px rgba(14,61,156,.18); overflow: hidden; }
    .ly-search-modal::before { content: ''; display: block; height: 3px; background: linear-gradient(90deg, ${BLUE}, ${ORANGE}, #fde68a); }
    .ly-search-input-wrap { display: flex; align-items: center; gap: 10px; padding: 11px 13px; border-bottom: 1px solid #e9eef6; background: #fbfcff; }
    .ly-search-input-wrap > i { color: ${BLUE}; font-size: .95rem; }
    .ly-search-input { flex: 1; border: 0; outline: 0; font: inherit; font-size: .8rem; color: #26364d; background: transparent; }
    .ly-search-input::placeholder { color: #9aa8ba; }
    .ly-search-kbd { border: 1px solid #dce3ed; border-bottom-width: 2px; border-radius: 5px; padding: 2px 6px; color: #8795a8; background: #f8fafc; font-size: .58rem; font-weight: 700; }
    .ly-search-body { max-height: 500px; overflow-y: auto; padding: 6px; }
    .ly-search-help { padding: 25px 16px; text-align: center; color: #8b99ac; font-size: .69rem; line-height: 1.6; }
    .ly-search-help i { display: block; color: #b8c6d8; font-size: 1.25rem; margin-bottom: 6px; }
    .ly-search-group-title { padding: 8px 9px 5px; color: #9aa8ba; font-size: .58rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; }
    .ly-search-result { display: flex; align-items: center; gap: 9px; padding: 7px 8px; border-radius: 8px; cursor: pointer; transition: background .12s; }
    .ly-search-result:hover, .ly-search-result.selected { background: #eff5ff; }
    .ly-search-result-icon { width: 30px; height: 30px; border-radius: 7px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: ${BLUE}; background: #e8f1ff; font-size: .78rem; }
    .ly-search-result.selected .ly-search-result-icon { color: white; background: ${BLUE}; }
    .ly-search-result-text { flex: 1; min-width: 0; }
    .ly-search-result-title { color: #26364d; font-size: .76rem; font-weight: 750; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ly-search-result-subtitle { margin-top: 2px; color: #8a99ad; font-size: .63rem; text-transform: capitalize; }
    .ly-search-result-arrow { color: #c1ccda; font-size: .7rem; }

    @media (max-width: 900px) {
      .ly-sidebar { position: fixed; top: 0; left: 0; height: 100%; transform: translateX(-100%); transition: transform 0.28s cubic-bezier(.4,0,.2,1); }
      .ly-sidebar.mobile-open { transform: translateX(0); }
      .ly-burger { display: flex; }
      .ly-overlay { display: block; }
      .ly-topbar-name { display: none; }
      .ly-notif-panel { position: fixed; top: 60px; right: 10px; left: 10px; width: auto; }
      .ly-search-modal { position: fixed; top: 62px; right: 10px; left: 10px; width: auto; max-height: calc(100vh - 75px); }
    }
  `

  return (
    <>
      <style>{css}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div className="ly-root">

        {mobileOpen && <div className="ly-overlay" onClick={() => setMobileOpen(false)} />}

        {/* ══ SIDEBAR ══ */}
        <aside className={`ly-sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>

          <div className="ly-brand">
            <div className="ly-brand-icon">
  <img src="/favicon.svg" alt="logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
</div>
            <div className="ly-brand-text">
              <div className="ly-brand-name">Gestion Commerciale</div>
              <div className="ly-brand-sub">Enterprise Platform</div>
            </div>
            <button
              className="ly-toggle"
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? 'Agrandir' : 'Réduire'}
            >
              <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} />
            </button>
          </div>

          <nav className="ly-nav">

            {/* ── PRINCIPAL — visible par tous ── */}
            <div className="ly-section-label">Principal</div>
            {PRINCIPAL_ITEMS.map(item => (
              <div
                key={item.path}
                className={`ly-nav-item${location.pathname === item.path ? ' active' : ''}`}
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                title={collapsed ? item.label : undefined}
              >
                <i className={`bi ${item.icon} icon`} />
                <span>{item.label}</span>
              </div>
            ))}

            {/* ── MODULE VENTE — admin + vendeur ── */}
            {canSeeVente && (
              <>
                <div className="ly-divider" />
                <div className="ly-section-label">Module Vente</div>
                <div
                  className={`ly-nav-item${isVenteActive ? ' active' : ''}${venteOpen ? ' menu-open' : ''}`}
                  onClick={() => setVenteOpen(o => !o)}
                  title={collapsed ? 'Vente' : undefined}
                >
                  <i className="bi bi-cart-check-fill icon" />
                  <span>Vente</span>
                  <i className="bi bi-chevron-right ly-arrow" />
                </div>
                <div className={`ly-submenu${venteOpen ? ' open' : ''}`}>
                  {VENTE_ITEMS.map(item => (
                    <div
                      key={item.path}
                      className={`ly-sub-item${location.pathname === item.path ? ' active' : ''}`}
                      onClick={() => { navigate(item.path); setMobileOpen(false) }}
                    >
                      <i className={`bi ${item.icon}`} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── MODULE ACHAT — admin + acheteur ── */}
            {canSeeAchat && (
              <>
                <div className="ly-divider" />
                <div className="ly-section-label">Module Achat</div>
                <div
                  className={`ly-nav-item${isAchatActive ? ' active' : ''}${achatOpen ? ' menu-open' : ''}`}
                  onClick={() => setAchatOpen(o => !o)}
                  title={collapsed ? 'Achat' : undefined}
                >
                  <i className="bi bi-bag-fill icon" />
                  <span>Achat</span>
                  <i className="bi bi-chevron-right ly-arrow" />
                </div>
                <div className={`ly-submenu${achatOpen ? ' open' : ''}`}>
                  {ACHAT_ITEMS.map(item => (
                    <div
                      key={item.path}
                      className={`ly-sub-item${location.pathname === item.path ? ' active' : ''}`}
                      onClick={() => { navigate(item.path); setMobileOpen(false) }}
                    >
                      <i className={`bi ${item.icon}`} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── STOCK — admin + vendeur + acheteur + magasinier ── */}
            {canSeeStock && (
              <>
                <div className="ly-divider" />
                <div
                  className={`ly-nav-item${location.pathname === '/stock' ? ' active' : ''}`}
                  onClick={() => { navigate('/stock'); setMobileOpen(false) }}
                  title={collapsed ? 'Stock' : undefined}
                >
                  <i className="bi bi-archive-fill icon" />
                  <span>Stock</span>
                </div>
              </>
            )}

            {/* ── ADMINISTRATION — admin uniquement ── */}
            {canSeeAdmin && (
              <>
                <div className="ly-divider" />
                <div className="ly-section-label">Administration</div>
                {ADMIN_ITEMS.map(item => (
                  <div
                    key={item.path}
                    className={`ly-nav-item${location.pathname === item.path ? ' active' : ''}`}
                    onClick={() => { navigate(item.path); setMobileOpen(false) }}
                    title={collapsed ? item.label : undefined}
                  >
                    <i className={`bi ${item.icon} icon`} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </>
            )}

            {/* ── MON PROFIL — visible par TOUS les rôles ── */}
            <div className="ly-divider" />
            <div
              className={`ly-nav-item${location.pathname.startsWith('/profil/') ? ' active' : ''}`}
              onClick={() => { navigate('/profil/me'); setMobileOpen(false) }}
              title={collapsed ? 'Mon Profil' : undefined}
            >
              <i className="bi bi-person-circle icon" />
              <span>Mon Profil</span>
            </div>

          </nav>

          {/* ── User footer ── */}
          <div
            className="ly-user"
            title={collapsed ? user?.login : undefined}
            onClick={() => navigate('/profil/me')}
          >
            <div className="ly-avatar">
              {avatarUrl ? <img src={avatarUrl} alt={initials} /> : initials}
            </div>
            <div className="ly-user-info">
              <div className="ly-user-name">{user?.login || 'Utilisateur'}</div>
              <div className={`ly-user-role${isAdmin ? '' : ' normal'}`}>
                {getRoleLabel()}
              </div>
            </div>
            <button
              className="ly-logout-btn"
              title="Déconnexion"
              onClick={e => { e.stopPropagation(); handleLogout() }}
            >
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>

        </aside>

        {/* ══ MAIN ══ */}
        <div className="ly-main">

          <header className="ly-topbar">
            <button className="ly-burger" onClick={() => setMobileOpen(o => !o)}>
              <i className="bi bi-list" />
            </button>
            <div className="ly-breadcrumb">
              <span className="ly-breadcrumb-home" onClick={() => navigate('/dashboard')}>
                <i className="bi bi-house-fill" style={{ marginRight: 4 }} />Accueil
              </span>
              {currentItem && (
                <>
                  <span className="ly-breadcrumb-sep">›</span>
                  <span className="ly-page-title">{currentItem.label}</span>
                </>
              )}
            </div>

            <div className="ly-topbar-right">
              <button className="ly-topbar-btn" title="Recherche globale (Ctrl+K)" onClick={() => { setSearchOpen(true); setNotificationOpen(false); setUserMenuOpen(false) }}><i className="bi bi-search" /></button>
              <div className="ly-notif-wrap">
                <button className="ly-topbar-btn" title="Notifications" onClick={handleNotificationToggle}>
                  <i className={`bi ${notificationOpen ? 'bi-bell-fill' : 'bi-bell'}`} />
                  {unreadCount > 0 && <span className="ly-notif-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>
                {notificationOpen && (
                  <div className="ly-notif-panel">
                    <div className="ly-notif-header">
                      <div className="ly-notif-title">Notifications</div>
                      {unreadCount > 0 && <button className="ly-notif-read-all" onClick={handleReadAll}>Tout marquer comme lu</button>}
                    </div>
                    <div className="ly-notif-filters">
                      {[
                        { key: 'all', label: `Toutes (${notifications.length})` },
                        { key: 'unread', label: `Non lues (${notifications.filter(item => !item.lue).length})` },
                        { key: 'urgent', label: `Urgentes (${notifications.filter(item => item.niveau === 'URGENT').length})` },
                      ].map(filter => (
                        <button key={filter.key} className={`ly-notif-filter${notificationFilter === filter.key ? ' active' : ''}`} onClick={() => setNotificationFilter(filter.key)}>
                          {filter.label}
                        </button>
                      ))}
                    </div>
                    <div className="ly-notif-list">
                      {notificationLoading ? (
                        <div className="ly-notif-empty"><i className="bi bi-arrow-repeat" /> Chargement...</div>
                      ) : filteredNotifications.length === 0 ? (
                        <div className="ly-notif-empty"><i className="bi bi-bell-slash" style={{ display: 'block', fontSize: 22, marginBottom: 7 }} />Aucune notification dans ce filtre</div>
                      ) : filteredNotifications.map(notification => (
                        <div key={notification.id} className={`ly-notif-item${notification.lue ? '' : ' unread'}`} onClick={() => handleNotificationClick(notification)}>
                          <div className={`ly-notif-icon${notification.niveau === 'URGENT' ? ' urgent' : ''}`}>
                            <i className={`bi ${notification.categorie === 'STOCK' ? 'bi-box-seam' : notification.categorie === 'DEVIS' ? 'bi-file-earmark-text' : notification.categorie.includes('COMMANDE') ? 'bi-truck' : 'bi-receipt'}`} />
                          </div>
                          <div className="ly-notif-body">
                            <div className="ly-notif-item-title">{!notification.lue && <span className="ly-notif-unread-dot" />}{notification.titre}</div>
                            <div className="ly-notif-message">{notification.message}</div>
                            <div className="ly-notif-time">{new Date(notification.dateCreation).toLocaleString('fr-FR')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="ly-topbar-user" onClick={() => setUserMenuOpen(o => !o)}>
                <div className="ly-topbar-avatar">
                  {avatarUrl ? <img src={avatarUrl} alt={initials} /> : initials}
                </div>
                <span className="ly-topbar-name">{user?.login}</span>
                <i className={`bi bi-chevron-${userMenuOpen ? 'up' : 'down'} ly-topbar-chev`} />

                {userMenuOpen && (
                  <div className="ly-dropdown" onClick={e => e.stopPropagation()}>
                    <div className="ly-dropdown-header">
                      <div className="ly-dropdown-login">{user?.login}</div>
                      <span className="ly-dropdown-badge">{getRoleLabel()}</span>
                    </div>
                    <div
                      className="ly-dropdown-item"
                      onClick={() => { navigate('/profil/me'); setUserMenuOpen(false) }}
                    >
                      <i className="bi bi-person-circle" /> Mon profil
                    </div>
                    {canSeeAdmin && (
                      <div
                        className="ly-dropdown-item"
                        onClick={() => { navigate('/parametres/entreprise'); setUserMenuOpen(false) }}
                      >
                        <i className="bi bi-gear" /> Paramètres
                      </div>
                    )}
                    <div className="ly-dropdown-item danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right" /> Déconnexion
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="ly-content">
            <Outlet />
          </main>

        </div>

        {isAdmin && <ChatWidget />}

        {searchOpen && (
          <div className="ly-search-overlay" onMouseDown={event => { if (event.target === event.currentTarget) closeSearch() }}>
            <div className="ly-search-modal">
              <div className="ly-search-input-wrap">
                <i className="bi bi-search" />
                <input autoFocus className="ly-search-input" value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)} onKeyDown={handleSearchKeyDown}
                  placeholder="Rechercher un client, une facture, un article, une commande..." />
                <span className="ly-search-kbd">Échap</span>
              </div>
              <div className="ly-search-body">
                {searchQuery.trim().length < 2 ? (
                  <div className="ly-search-help"><i className="bi bi-command" />Saisissez au moins 2 caractères<br />Recherchez par nom, code ou numéro de document</div>
                ) : searchLoading ? (
                  <div className="ly-search-help"><i className="bi bi-arrow-repeat" />Recherche en cours...</div>
                ) : searchResults.length === 0 ? (
                  <div className="ly-search-help"><i className="bi bi-search" />Aucun résultat pour « {searchQuery} »</div>
                ) : Object.entries(groupedSearchResults).map(([group, results]) => (
                  <div key={group}>
                    <div className="ly-search-group-title">{group}</div>
                    {results.map(result => (
                      <div key={`${result.type}-${result.id}`} className={`ly-search-result${searchSelection === result.resultIndex ? ' selected' : ''}`}
                        onMouseEnter={() => setSearchSelection(result.resultIndex)} onClick={() => openSearchResult(result)}>
                        <div className="ly-search-result-icon"><i className={`bi ${result.icon}`} /></div>
                        <div className="ly-search-result-text">
                          <div className="ly-search-result-title">{result.title}</div>
                          <div className="ly-search-result-subtitle">{result.subtitle}</div>
                        </div>
                        <i className="bi bi-arrow-return-left ly-search-result-arrow" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
