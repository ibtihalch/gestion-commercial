import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as ChartTooltip,
  XAxis, YAxis
} from 'recharts'
import {
  Avatar, Box, CircularProgress, Fade, IconButton, Paper,
  Stack, TextField, Tooltip, Typography
} from '@mui/material'
import {
  AutoAwesome, Close, DeleteOutline,
  CheckRounded, ContentCopyRounded, EditOutlined,
  BarChartRounded, KeyboardArrowDown, SendRounded, SmartToyOutlined
} from '@mui/icons-material'
import assistantService from '../services/assistantService'

const ASSISTANT_NAME = 'NOVA'
const BLUE = '#1A6FE8'
const BLUE_DARK = '#0E3D9C'
const ORANGE = '#F59E0B'

const getWelcomeMessage = () => {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour >= 5 && hour < 12
    ? 'Bonjour'
    : hour >= 12 && hour < 18
      ? 'Bon après-midi'
      : 'Bonsoir'

  return {
    role: 'assistant',
    text: `${greeting}, je suis NOVA, votre assistant commercial IA. Je peux analyser vos ventes, vos achats, vos clients, vos factures et votre stock. Comment puis-je vous aider ?`,
    time: now,
  }
}

const SUGGESTIONS = [
  { icon: 'bi-stars', text: "Résume l'activité de ce mois" },
  { icon: 'bi-exclamation-triangle', text: "Quelles sont les urgences aujourd'hui ?" },
  { icon: 'bi-graph-up-arrow', text: "Compare mon chiffre d'affaires avec le mois dernier" },
  { icon: 'bi-box-seam', text: 'Quels articles sont en stock faible ?' },
]

const formatTime = (date) => new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit', minute: '2-digit'
}).format(date)

const formatChartValue = (value, unit = 'DH') => `${Number(value || 0).toLocaleString('fr-FR', {
  maximumFractionDigits: 2
})} ${unit}`

function MessageChart({ chart }) {
  if (!chart?.labels?.length || !chart?.datasets?.length) return null

  const hasData = chart.datasets.some(dataset =>
    dataset.values?.some(value => Number(value) !== 0)
  )

  if (!hasData) {
    return (
      <Box sx={{ mt: .8, p: 1.5, width: '100%', bgcolor: '#fff', border: '1px dashed #cbd8ea', borderRadius: '10px', textAlign: 'center' }}>
        <Box sx={{ width: 34, height: 34, mx: 'auto', mb: .7, borderRadius: '9px', bgcolor: '#eff5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChartRounded sx={{ fontSize: 19, color: '#94a3b8' }} />
        </Box>
        <Typography sx={{ color: BLUE_DARK, fontSize: '.7rem', fontWeight: 700 }}>
          Aucune donnée à représenter
        </Typography>
        <Typography sx={{ mt: .25, color: '#94a3b8', fontSize: '.62rem', lineHeight: 1.4 }}>
          Les valeurs des deux périodes sont égales à 0 {chart.unit || ''}.
        </Typography>
      </Box>
    )
  }

  const rows = chart.labels.map((label, index) => {
    const row = { label }
    chart.datasets.forEach((dataset, datasetIndex) => {
      row[`series${datasetIndex}`] = Number(dataset.values?.[index] || 0)
    })
    return row
  })

  return (
    <Box sx={{ mt: .8, p: 1.15, width: '100%', height: 230, bgcolor: '#fff', border: '1px solid #dfe7f3', borderRadius: '10px', boxShadow: '0 4px 13px rgba(27,56,94,.05)' }}>
      <Typography sx={{ mb: .7, px: .3, color: BLUE_DARK, fontSize: '.7rem', fontWeight: 800 }}>
        <i className="bi bi-bar-chart-fill" style={{ color: ORANGE, marginRight: 6 }} />
        {chart.title}
      </Typography>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={rows} margin={{ top: 8, right: 5, left: -18, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6edf7" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} angle={rows.length <= 2 ? -8 : 0} textAnchor="middle" height={38} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={value => Number(value).toLocaleString('fr-FR', { notation: 'compact' })} />
          <ChartTooltip
            formatter={(value, name) => [formatChartValue(value, chart.unit), chart.datasets[Number(name.replace('series', ''))]?.label]}
            labelStyle={{ color: BLUE_DARK, fontWeight: 700, fontSize: 11 }}
            contentStyle={{ borderRadius: 8, border: '1px solid #dfe7f3', fontSize: 11, boxShadow: '0 8px 22px rgba(14,61,156,.12)' }}
          />
          {chart.datasets.length > 1 && <Legend formatter={(_, entry) => chart.datasets[Number(entry.dataKey.replace('series', ''))]?.label} wrapperStyle={{ fontSize: 10 }} />}
          {chart.datasets.map((dataset, index) => (
            <Bar key={dataset.label} dataKey={`series${index}`} fill={dataset.color || (index === 0 ? BLUE : ORANGE)} radius={[5, 5, 0, 0]} maxBarSize={46} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default function ChatWidget() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(() => [getWelcomeMessage()])
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200)
  }, [open])

  const handleSend = async (suggestedText) => {
    const text = (typeof suggestedText === 'string' ? suggestedText : input).trim()
    if (!text || loading) return

    setMessages(previous => [...previous, { role: 'user', text, time: new Date() }])
    setInput('')
    setLoading(true)

    try {
      const response = await assistantService.chat(text)
      setMessages(previous => [...previous, {
        role: 'assistant', text: response.reply, intent: response.intent,
        actions: response.actions || [], chart: response.chart, chartOpen: false, time: new Date()
      }])
    } catch {
      setMessages(previous => [...previous, {
        role: 'assistant',
        text: "Je n'arrive pas à joindre le service pour le moment. Vérifiez votre connexion puis réessayez.",
        error: true,
        time: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (clearing || loading) return
    setClearing(true)
    try {
      await assistantService.clearHistory()
      setMessages([getWelcomeMessage()])
      setInput('')
    } finally {
      setClearing(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(current => current === index ? null : current), 1600)
    } catch {
      // Le presse-papiers peut être bloqué par le navigateur hors contexte sécurisé.
    }
  }

  const handleEdit = (text) => {
    setInput(text)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const toggleChart = (messageIndex) => {
    setMessages(previous => previous.map((message, index) =>
      index === messageIndex ? { ...message, chartOpen: !message.chartOpen } : message
    ))
  }

  const showSuggestions = messages.length === 1 && !loading

  return (
    <>
      <Box
        component="button"
        onClick={() => setOpen(value => !value)}
        aria-label={open ? "Fermer NOVA" : "Ouvrir NOVA"}
        sx={{
          position: 'fixed', right: { xs: 16, sm: 24 }, bottom: { xs: 16, sm: 24 }, zIndex: 1301,
          height: 46, minWidth: 46, px: { xs: 0, sm: open ? 0 : 1.55 }, border: 0,
          borderRadius: '10px', cursor: 'pointer', color: '#fff',
          background: BLUE,
          borderBottom: `3px solid ${ORANGE}`,
          boxShadow: '0 8px 24px rgba(26,111,232,.24)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 1,
          transition: 'all .22s ease',
          '&:hover': { background: BLUE_DARK, transform: 'translateY(-2px)', boxShadow: '0 12px 28px rgba(26,111,232,.3)' },
        }}
      >
        {open ? <Close sx={{ fontSize: 19 }} /> : <AutoAwesome sx={{ fontSize: 18 }} />}
        {!open && (
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '.72rem', fontWeight: 800 }}>
            {ASSISTANT_NAME} IA
          </Typography>
        )}
      </Box>

      <Fade in={open} timeout={220}>
        <Paper
          elevation={0}
          sx={{
            position: 'fixed', zIndex: 1300,
            right: { xs: 0, sm: 24 }, bottom: { xs: 0, sm: 92 },
            width: { xs: '100%', sm: 390 }, height: { xs: '100dvh', sm: 580 },
            maxHeight: { sm: 'calc(100vh - 116px)' }, display: open ? 'flex' : 'none',
            flexDirection: 'column', overflow: 'hidden',
            borderRadius: { xs: 0, sm: '14px' }, border: '1px solid #dfe7f3',
            boxShadow: '0 18px 46px rgba(14,61,156,.16)', bgcolor: '#fff',
          }}
        >
          <Box sx={{
            px: 2, py: 1.45, color: BLUE_DARK, position: 'relative', overflow: 'hidden',
            bgcolor: '#fff', borderBottom: '1px solid #e9eef8',
            '&::before': {
              content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${BLUE} 0%, ${ORANGE} 60%, #fde68a 100%)`
            }
          }}>
            <Stack direction="row" alignItems="center" spacing={1.4} sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{
                  width: 42, height: 42, position: 'relative', overflow: 'hidden', borderRadius: '12px',
                  background: `linear-gradient(145deg, #267cf0 0%, ${BLUE} 55%, ${BLUE_DARK} 100%)`,
                  boxShadow: '0 6px 16px rgba(26,111,232,.24)',
                  '&::before': { content: '""', position: 'absolute', width: 32, height: 32, borderRadius: '50%', left: -14, top: -15, bgcolor: 'rgba(255,255,255,.12)' }
                }}>
                  <Box sx={{ position: 'absolute', left: 9, top: 9, width: 9, height: 9, bgcolor: '#fff', transform: 'rotate(45deg)', borderRadius: '2px' }} />
                  <Box sx={{ position: 'absolute', left: 23, top: 16, width: 6, height: 6, bgcolor: '#fff', transform: 'rotate(45deg)', borderRadius: '1px', opacity: .95 }} />
                  <Box sx={{ position: 'absolute', left: 15, top: 27, width: 4, height: 4, bgcolor: '#fff', transform: 'rotate(45deg)', borderRadius: '1px', opacity: .8 }} />
                  <Box sx={{ position: 'absolute', left: 12.5, top: 12.5, width: 2, height: 2, bgcolor: BLUE, borderRadius: '50%' }} />
                </Box>
                <Box sx={{ position: 'absolute', right: -2, bottom: -1, width: 11, height: 11, borderRadius: '50%', bgcolor: ORANGE, border: '2px solid #fff' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={.8}>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '.5px' }}>{ASSISTANT_NAME}</Typography>
                  <Box sx={{ px: .7, py: .15, borderRadius: 1, bgcolor: 'rgba(245,158,11,.14)', color: '#d97706', fontSize: '.56rem', fontWeight: 800, letterSpacing: '.8px' }}>IA</Box>
                </Stack>
                <Typography sx={{ fontSize: '.68rem', color: '#94a3b8', fontWeight: 500 }}>
                  Assistant commercial · En ligne
                </Typography>
              </Box>
              <Tooltip title="Nouvelle conversation">
                <span>
                  <IconButton onClick={handleClear} disabled={clearing || loading} sx={{ color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: '8px', '&:hover': { color: BLUE, bgcolor: '#f0f5ff', borderColor: '#c7d8fa' } }}>
                    {clearing ? <CircularProgress size={18} color="inherit" /> : <DeleteOutline fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
              <IconButton onClick={() => setOpen(false)} sx={{ display: { xs: 'flex', sm: 'none' }, color: BLUE_DARK }}>
                <KeyboardArrowDown />
              </IconButton>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 1.8, sm: 2 }, py: 1.7, bgcolor: '#EEF2FB',
            '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd8ea', borderRadius: 4 }
          }}>
            <Stack spacing={1.8}>
              {messages.map((message, index) => (
                <Stack key={`${index}-${message.time?.getTime()}`} direction="row" spacing={1} alignItems="flex-end" justifyContent={message.role === 'user' ? 'flex-end' : 'flex-start'}>
                  {message.role === 'assistant' && (
                    <Avatar sx={{ width: 28, height: 28, bgcolor: '#e8f1ff', color: BLUE }}>
                      <SmartToyOutlined sx={{ fontSize: 16 }} />
                    </Avatar>
                  )}
                  <Box sx={{ maxWidth: '82%' }}>
                    <Box sx={{
                      px: 1.5, py: 1.15,
                      bgcolor: message.role === 'user' ? BLUE : message.error ? '#fff7f7' : '#fff',
                      color: message.role === 'user' ? '#fff' : '#26364d',
                      border: message.role === 'user' ? 0 : `1px solid ${message.error ? '#fecaca' : '#e2e9f3'}`,
                      borderRadius: message.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      boxShadow: message.role === 'user' ? '0 6px 16px rgba(26,111,232,.18)' : '0 4px 13px rgba(27,56,94,.06)',
                    }}>
                      <Typography sx={{ fontSize: '.8rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                        {message.text}
                      </Typography>
                    </Box>
                    {message.role === 'assistant' && message.chart && (
                      <Box
                        component="button"
                        onClick={() => toggleChart(index)}
                        sx={{
                          mt: .7, display: 'inline-flex', alignItems: 'center', gap: .55,
                          px: 1, py: .6, borderRadius: '8px', cursor: 'pointer',
                          border: '1px solid #cbdcf5', bgcolor: message.chartOpen ? '#eff5ff' : '#fff',
                          color: message.chartOpen ? BLUE : BLUE_DARK, fontFamily: 'inherit',
                          fontSize: '.65rem', fontWeight: 700,
                          '&:hover': { borderColor: BLUE, bgcolor: '#eff5ff', color: BLUE }
                        }}
                      >
                        <BarChartRounded sx={{ fontSize: 15, color: ORANGE }} />
                        {message.chartOpen ? 'Masquer le graphique' : 'Afficher le graphique'}
                      </Box>
                    )}
                    {message.role === 'assistant' && message.chart && message.chartOpen && (
                      <MessageChart chart={message.chart} />
                    )}
                    {message.role === 'assistant' && message.actions?.length > 0 && (
                      <Stack direction="row" gap={.65} flexWrap="wrap" sx={{ mt: .65 }}>
                        {message.actions.map(action => (
                          <Box
                            key={`${action.path}-${action.label}`}
                            component="button"
                            onClick={() => navigate(action.path)}
                            sx={{
                              display: 'inline-flex', alignItems: 'center', gap: .55,
                              px: 1, py: .6, borderRadius: '8px', cursor: 'pointer',
                              border: '1px solid #cbdcf5', bgcolor: '#fff', color: BLUE_DARK,
                              fontFamily: 'inherit', fontSize: '.65rem', fontWeight: 700,
                              transition: 'all .15s ease',
                              '&:hover': { bgcolor: '#eff5ff', borderColor: BLUE, color: BLUE, transform: 'translateY(-1px)' }
                            }}
                          >
                            <i className={`bi ${action.icon || 'bi-arrow-right-circle'}`} style={{ color: ORANGE, fontSize: '.72rem' }} />
                            {action.label}
                          </Box>
                        ))}
                      </Stack>
                    )}
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent={message.role === 'user' ? 'flex-end' : 'flex-start'}
                      spacing={.25}
                      sx={{ mt: .25, minHeight: 24 }}
                    >
                      <Typography sx={{ px: .5, mr: .15, fontSize: '.58rem', color: '#9aa9bd' }}>
                        {message.time ? formatTime(message.time) : ''}
                      </Typography>
                      <Tooltip title={copiedIndex === index ? 'Copié !' : 'Copier'} placement="bottom">
                        <IconButton
                          size="small"
                          onClick={() => handleCopy(message.text, index)}
                          aria-label="Copier le message"
                          sx={{ width: 24, height: 24, color: copiedIndex === index ? '#16a34a' : '#7b8798', '&:hover': { color: BLUE, bgcolor: 'rgba(26,111,232,.08)' } }}
                        >
                          {copiedIndex === index ? <CheckRounded sx={{ fontSize: 15 }} /> : <ContentCopyRounded sx={{ fontSize: 14 }} />}
                        </IconButton>
                      </Tooltip>
                      {message.role === 'user' && (
                        <Tooltip title="Modifier et renvoyer" placement="bottom">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(message.text)}
                            aria-label="Modifier le message"
                            sx={{ width: 24, height: 24, color: '#7b8798', '&:hover': { color: ORANGE, bgcolor: 'rgba(245,158,11,.09)' } }}
                          >
                            <EditOutlined sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              ))}

              {showSuggestions && (
                <Box sx={{ pt: .5, pl: { sm: 4.5 } }}>
                  <Typography sx={{ mb: 1, fontSize: '.67rem', color: '#7c8da5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px' }}>
                    Essayez par exemple
                  </Typography>
                  <Stack direction="row" gap={.8} flexWrap="wrap">
                    {SUGGESTIONS.map(suggestion => (
                      <Box key={suggestion.text} component="button" onClick={() => handleSend(suggestion.text)} sx={{
                        display: 'flex', alignItems: 'center', gap: .7, p: '8px 10px', borderRadius: '12px',
                        border: '1px solid #dce6f3', borderLeft: `2px solid ${ORANGE}`, bgcolor: '#fff', cursor: 'pointer',
                        color: '#52647c', fontFamily: 'inherit', fontSize: '.69rem', fontWeight: 600,
                        transition: 'all .15s', '&:hover': { color: BLUE, borderColor: '#a9c8f5', transform: 'translateY(-1px)' }
                      }}>
                        <i className={`bi ${suggestion.icon}`} style={{ color: ORANGE }} />
                        {suggestion.text}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {loading && (
                <Stack direction="row" spacing={1} alignItems="flex-end">
                  <Avatar sx={{ width: 28, height: 28, bgcolor: '#e8f1ff', color: BLUE }}><SmartToyOutlined sx={{ fontSize: 16 }} /></Avatar>
                  <Box sx={{ display: 'flex', gap: .55, px: 1.5, py: 1.35, bgcolor: '#fff', border: '1px solid #e2e9f3', borderRadius: '12px 12px 12px 4px' }}>
                    {[0, 1, 2].map(i => <Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: BLUE, animation: 'novaPulse 1.2s infinite', animationDelay: `${i * .18}s` }} />)}
                  </Box>
                </Stack>
              )}
              <div ref={bottomRef} />
            </Stack>
          </Box>

          <Box sx={{ px: 1.7, pt: 1.35, pb: { xs: 2, sm: 1.35 }, borderTop: '1px solid #e5ebf4', bgcolor: '#fff' }}>
            <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ p: .55, pl: 1.1, border: '1px solid #dce5f1', borderRadius: '10px', bgcolor: '#fafcff', '&:focus-within': { borderColor: BLUE, boxShadow: '0 0 0 3px rgba(26,111,232,.08)' } }}>
              <TextField
                inputRef={inputRef} fullWidth multiline maxRows={4} variant="standard"
                placeholder={`Écrivez à ${ASSISTANT_NAME}...`} value={input}
                onChange={event => setInput(event.target.value)} onKeyDown={handleKeyDown} disabled={loading}
                InputProps={{ disableUnderline: true }}
                sx={{ '& textarea': { fontSize: '.8rem', lineHeight: 1.5, py: .65, color: '#26364d' } }}
              />
              <IconButton onClick={() => handleSend()} disabled={loading || !input.trim()} sx={{
                width: 38, height: 38, mb: .1, color: '#fff', bgcolor: BLUE,
                '&:hover': { bgcolor: BLUE_DARK }, '&.Mui-disabled': { bgcolor: '#d7e1ee', color: '#fff' }
              }}>
                <SendRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
            <Typography sx={{ mt: .7, textAlign: 'center', fontSize: '.57rem', color: '#a1afc1' }}>
              {ASSISTANT_NAME} peut faire des erreurs · Vérifiez les informations importantes
            </Typography>
          </Box>
        </Paper>
      </Fade>

      <style>{`@keyframes novaPulse { 0%, 70%, 100% { opacity:.25; transform:translateY(0) } 35% { opacity:1; transform:translateY(-3px) } }`}</style>
    </>
  )
}
