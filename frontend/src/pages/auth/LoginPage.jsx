import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [form,     setForm]     = useState({ login: '', motDePasse: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [focused,  setFocused]  = useState('')

  useEffect(() => {
    const links = [
      { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css' },
      { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800&display=swap' },
    ]
    const els = links.map(attrs => {
      const el = document.createElement('link')
      Object.assign(el, attrs)
      document.head.appendChild(el)
      return el
    })
    // prevent page scroll
    document.body.style.overflow = 'hidden'
    return () => {
      els.forEach(el => document.head.removeChild(el))
      document.body.style.overflow = ''
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.login, form.motDePasse)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .lp-root {
      height: 100vh;
      max-height: 100vh;
      overflow: hidden;
      display: flex;
      font-family: 'Barlow', sans-serif;
      background: #0a0e1a;
    }

    /* ══ LEFT ══ */
    .lp-left {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: #0a0e1a;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 36px 48px;
    }

    .lp-left::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(26,115,232,0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(26,115,232,0.07) 1px, transparent 1px);
      background-size: 44px 44px;
      pointer-events: none;
    }

    .lp-left::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, #F59E0B, #1A73E8, transparent);
    }

    .lp-diagonal {
      position: absolute;
      bottom: -80px; right: -80px;
      width: 380px; height: 380px;
      background: linear-gradient(135deg, rgba(26,115,232,0.1), rgba(245,158,11,0.05));
      transform: rotate(20deg);
      border-radius: 40px;
      pointer-events: none;
    }

    .lp-diagonal-2 {
      position: absolute;
      top: 70px; right: 50px;
      width: 160px; height: 160px;
      border: 1px solid rgba(26,115,232,0.12);
      transform: rotate(15deg);
      border-radius: 18px;
      pointer-events: none;
    }

    /* Brand */
    .lp-brand {
      display: flex;
      align-items: center;
      gap: 13px;
      position: relative;
      z-index: 2;
    }

    .lp-brand-icon {
      width: 42px; height: 42px;
      background: linear-gradient(135deg, #1A73E8, #F59E0B);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .lp-brand-name {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      color: white;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      line-height: 1.2;
    }

    .lp-brand-sub {
      font-size: 0.6rem;
      color: rgba(255,255,255,0.4);
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 600;
    }

    /* Center content */
    .lp-center {
      position: relative;
      z-index: 2;
    }

    .lp-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(245,158,11,0.1);
      border: 1px solid rgba(245,158,11,0.28);
      border-radius: 4px;
      padding: 4px 13px;
      margin-bottom: 18px;
    }

    .lp-tag span {
      font-size: 0.68rem;
      font-weight: 700;
      color: #F59E0B;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .lp-tag .tag-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #F59E0B;
    }

    .lp-headline {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: clamp(2rem, 2.8vw, 3rem);
      font-weight: 800;
      color: white;
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }

    .lp-headline .hl-blue   { color: #1A73E8; }
    .lp-headline .hl-orange { color: #F59E0B; }

    .lp-desc {
      color: rgba(255,255,255,0.48);
      font-size: 0.88rem;
      line-height: 1.75;
      max-width: 360px;
      margin-bottom: 32px;
    }

    .lp-stats {
      display: flex;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
      overflow: hidden;
      max-width: 380px;
    }

    .lp-stat {
      flex: 1;
      padding: 13px 16px;
      border-right: 1px solid rgba(255,255,255,0.07);
      background: rgba(255,255,255,0.03);
      transition: background 0.2s;
    }

    .lp-stat:last-child { border-right: none; }
    .lp-stat:hover { background: rgba(26,115,232,0.1); }

    .lp-stat-val {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.35rem;
      font-weight: 800;
      color: #1A73E8;
      line-height: 1;
      margin-bottom: 3px;
    }

    .lp-stat-label {
      font-size: 0.6rem;
      color: rgba(255,255,255,0.38);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    /* Modules */
    .lp-modules {
      display: flex;
      gap: 7px;
      flex-wrap: wrap;
      position: relative;
      z-index: 2;
    }

    .lp-module {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      padding: 6px 11px;
      color: rgba(255,255,255,0.5);
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.3px;
      transition: all 0.2s;
    }

    .lp-module:hover {
      background: rgba(26,115,232,0.12);
      border-color: rgba(26,115,232,0.3);
      color: #93c5fd;
    }

    /* ══ RIGHT ══ */
    .lp-right {
      width: 440px;
      flex-shrink: 0;
      background: #f4f7ff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 40px 44px;
      position: relative;
      overflow: hidden;
    }

    .lp-right::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, #1A73E8, #F59E0B);
    }

    .lp-form-wrap {
      width: 100%;
      max-width: 330px;
    }

    .lp-form-eyebrow {
      font-size: 0.65rem;
      font-weight: 700;
      color: #1A73E8;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .lp-form-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.9rem;
      font-weight: 800;
      color: #0a0e1a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.1;
      margin-bottom: 6px;
    }

    .lp-form-title span { color: #1A73E8; }

    .lp-form-sub {
      color: #64748b;
      font-size: 0.82rem;
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .lp-field { margin-bottom: 15px; }

    .lp-field-label {
      display: block;
      font-size: 0.65rem;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 7px;
    }

    .lp-input-wrap { position: relative; }

    .lp-input {
      width: 100%;
      padding: 11px 44px 11px 14px;
      border: 1.5px solid #dde3f0;
      border-radius: 6px;
      font-size: 0.9rem;
      font-family: 'Barlow', sans-serif;
      font-weight: 500;
      color: #0f172a;
      background: white;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }

    .lp-input::placeholder { color: #c0cade; font-weight: 400; }
    .lp-input:hover { border-color: #a8bcdc; }
    .lp-input.is-focused {
      border-color: #1A73E8;
      box-shadow: 0 0 0 3px rgba(26,115,232,0.11);
    }

    .lp-input-ico {
      position: absolute;
      right: 13px; top: 50%;
      transform: translateY(-50%);
      color: #c0cade;
      font-size: 0.9rem;
      cursor: pointer;
      transition: color 0.2s;
      user-select: none;
    }

    .lp-input-ico:hover { color: #1A73E8; }

    /* ── BLUE BUTTON ── */
    .lp-btn {
      width: 100%;
      padding: 13px 20px;
      background: linear-gradient(135deg, #1A73E8 0%, #1558B0 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 0 5px 18px rgba(26,115,232,0.35);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      margin-top: 8px;
    }

    .lp-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #1558B0 0%, #0d3d8a 100%);
      box-shadow: 0 8px 24px rgba(26,115,232,0.45);
      transform: translateY(-1px);
    }

    .lp-btn:active:not(:disabled) { transform: translateY(0); }
    .lp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .lp-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 22px 0;
    }

    .lp-divider-line { flex: 1; height: 1px; background: #dde3f0; }

    .lp-divider-text {
      font-size: 0.62rem;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .lp-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 14px;
    }

    .lp-ftag {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.7rem;
      color: #94a3b8;
      font-weight: 600;
    }

    .lp-ftag i { color: #1A73E8; font-size: 0.78rem; }

    .spin {
      width: 17px; height: 17px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: lp-spin 0.65s linear infinite;
      flex-shrink: 0;
    }

    @keyframes lp-spin { to { transform: rotate(360deg); } }

    @media (max-width: 900px) {
      .lp-left  { display: none !important; }
      .lp-right { width: 100%; height: 100vh; }
    }
  `

  return (
    <>
      <style>{css}</style>
      <div className="lp-root">

        {/* ── LEFT ── */}
        <div className="lp-left">
          <div className="lp-diagonal" />
          <div className="lp-diagonal-2" />

          <div className="lp-brand">
            <div className="lp-brand-icon">
              <i className="bi bi-bar-chart-line-fill" style={{ color: 'white', fontSize: '1.2rem' }} />
            </div>
            <div>
              <div className="lp-brand-name">Gestion Commerciale</div>
              <div className="lp-brand-sub">Enterprise Platform</div>
            </div>
          </div>

          <div className="lp-center">
            <div className="lp-tag">
              <div className="tag-dot" />
              <span>Plateforme Active</span>
            </div>

            <h1 className="lp-headline">
              Pilotez votre<br />
              activite <span className="hl-blue">com</span><span className="hl-orange">merciale</span><br />
              avec precision
            </h1>

            <p className="lp-desc">
              Solution integree pour la gestion de vos devis, bons de commande,
              livraisons et factures — tout centralise en un seul espace de travail.
            </p>

            <div className="lp-stats">
              {[
                { val: 'BCC', label: 'Commandes'   },
                { val: 'BL',  label: 'Livraisons'  },
                { val: 'FC',  label: 'Factures'    },
                { val: '360', label: 'Vue complete' },
              ].map(({ val, label }) => (
                <div className="lp-stat" key={label}>
                  <div className="lp-stat-val">{val}</div>
                  <div className="lp-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-modules">
            {[
              { icon: 'bi-file-earmark-text', label: 'Devis'      },
              { icon: 'bi-cart3',             label: 'Commandes'  },
              { icon: 'bi-truck',             label: 'Livraisons' },
              { icon: 'bi-receipt',           label: 'Factures'   },
              { icon: 'bi-box-seam',          label: 'Stock'      },
              { icon: 'bi-people',            label: 'Clients'    },
            ].map(({ icon, label }) => (
              <div className="lp-module" key={label}>
                <i className={`bi ${icon}`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="lp-right">
          <div className="lp-form-wrap">

            <div className="lp-form-eyebrow">Acces Securise</div>
            <h2 className="lp-form-title">
              Espace<br /><span>Connexion</span>
            </h2>
            <p className="lp-form-sub">
              Entrez vos identifiants pour acceder a votre tableau de bord.
            </p>

            <form onSubmit={handleSubmit}>

              <div className="lp-field">
                <label className="lp-field-label">Identifiant</label>
                <div className="lp-input-wrap">
                  <input
                    className={`lp-input${focused === 'login' ? ' is-focused' : ''}`}
                    type="text"
                    placeholder="Votre login"
                    required
                    value={form.login}
                    onChange={e => setForm({ ...form, login: e.target.value })}
                    onFocus={() => setFocused('login')}
                    onBlur={() => setFocused('')}
                  />
                  <i className="bi bi-person lp-input-ico" style={{ pointerEvents: 'none' }} />
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-field-label">Mot de passe</label>
                <div className="lp-input-wrap">
                  <input
                    className={`lp-input${focused === 'pass' ? ' is-focused' : ''}`}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••••"
                    required
                    value={form.motDePasse}
                    onChange={e => setForm({ ...form, motDePasse: e.target.value })}
                    onFocus={() => setFocused('pass')}
                    onBlur={() => setFocused('')}
                  />
                  <i
                    className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'} lp-input-ico`}
                    onClick={() => setShowPass(p => !p)}
                  />
                </div>
              </div>

              <button type="submit" className="lp-btn" disabled={loading}>
                {loading
                  ? <><div className="spin" /> Connexion en cours…</>
                  : <><i className="bi bi-box-arrow-in-right" /> Se connecter</>
                }
              </button>
            </form>

            <div className="lp-divider">
              <div className="lp-divider-line" />
              <span className="lp-divider-text">Informations</span>
              <div className="lp-divider-line" />
            </div>

            <div className="lp-footer">
              <div className="lp-ftag">
                <i className="bi bi-shield-lock-fill" />
                Connexion chiffree SSL
              </div>
              <div className="lp-ftag">
                <i className="bi bi-building-check" />
                Acces entreprise prive
              </div>
              <div className="lp-ftag">
                <i className="bi bi-clock-history" />
                Session securisee
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  )
}