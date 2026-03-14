'use client'
import { useState, useEffect } from 'react'
import { AlertTriangle, X, Terminal, Info, Bug } from 'lucide-react'

export default function ErrorDetector() {
  const [errorLogs, setErrorLogs] = useState<{ msg: string, time: string, type: string }[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // Expose toggle globally for the login page to use
    (window as any).toggleErrorDetector = () => setIsOpen(true)
    
    // Intercept console.log for debug-net
    const originalLog = console.log
    console.log = (...args) => {
      const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
      
      if (msg.includes('[DEBUG-NET]')) {
        setErrorLogs(prev => [{
          msg,
          time: new Date().toLocaleTimeString(),
          type: 'info'
        }, ...prev].slice(0, 100))
        setShowNotification(true)
      }
      originalLog.apply(console, args)
    }

    // Intercept console.error
    const originalError = console.error
    console.error = (...args) => {
      const msg = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')
      
      setErrorLogs(prev => [{
        msg,
        time: new Date().toLocaleTimeString(),
        type: 'error'
      }, ...prev].slice(0, 100))
      
      setShowNotification(true)
      originalError.apply(console, args)
    }

    // Intercept unhandled rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const msg = `Unhandled Rejection: ${event.reason?.message || event.reason}`
      setErrorLogs(prev => [{
        msg,
        time: new Date().toLocaleTimeString(),
        type: 'rejection'
      }, ...prev].slice(0, 50))
      setShowNotification(true)
    }

    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      console.log = originalLog
      console.error = originalError
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  const copyDebugInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: errorLogs,
      timestamp: new Date().toISOString()
    }
    navigator.clipboard.writeText(JSON.stringify(info, null, 2))
    alert('Debug info copied to clipboard!')
  }

  if (errorLogs.length === 0) return null

  return (
    <>
      {/* Toast Notification */}
      {showNotification && !isOpen && (
        <div 
          onClick={() => { setIsOpen(true); setShowNotification(false); }}
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
            background: '#EF4444', color: '#FFF', padding: '12px 20px',
            borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)',
            fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5
          }}
          className="animate-fade-in"
        >
          <AlertTriangle size={18} />
          <span>Error Detected! Tap to view</span>
          <X size={14} onClick={(e) => { e.stopPropagation(); setShowNotification(false); }} />
        </div>
      )}

      {/* Main Debug Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <div className="card animate-fade-in" style={{ 
            width: '100%', maxWidth: 700, maxHeight: '80vh', 
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            padding: 0, border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ padding: 24, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Bug color="#EF4444" />
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Error Detector & Debugger</h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#000' }}>
              {errorLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: 16, borderLeft: `4px solid ${log.type === 'error' ? '#EF4444' : (log.type === 'rejection' ? '#F59E0B' : '#3B82F6')}`, paddingLeft: 12 }}>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>
                    <span>[{log.time}]</span>
                    <span style={{ color: log.type === 'error' ? '#EF4444' : (log.type === 'rejection' ? '#F59E0B' : '#3B82F6') }}>
                      {log.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#FFF', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {log.msg}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
              <button 
                onClick={copyDebugInfo}
                className="btn-secondary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Terminal size={16} /> Copy Debug Info
              </button>
              <button 
                onClick={() => setErrorLogs([])}
                className="btn-secondary"
                style={{ flex: 1, color: '#EF4444' }}
              >
                Clear Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
