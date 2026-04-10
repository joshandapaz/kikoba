'use client'
import React from 'react'

export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* Centered Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        transform: 'translateY(-20px)'
      }}>
        <div className="animate-logo-pulse" style={{ width: 140, height: 140 }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        
        {/* Modern Spinner */}
        <div style={{ 
          width: 40, height: 40, 
          border: '3px solid rgba(34, 211, 238, 0.1)', 
          borderTop: '3px solid var(--accent)', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>

      {/* Branded Watermark at Bottom */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        textAlign: 'center'
      }}>
        <div className="animate-text-shimmer" style={{
          fontSize: 18,
          fontWeight: 900,
          color: '#FFF',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontFamily: "'Inter', sans-serif"
        }}>
          JOSHAN
        </div>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--accent)',
          marginTop: 4,
          opacity: 0.6,
          letterSpacing: '1px'
        }}>
          POWERED BY KIKOBA SMART
        </div>
      </div>
    </div>
  )
}
