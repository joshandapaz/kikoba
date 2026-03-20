'use client'
import { useEffect } from 'react'
import { initGoogleServices } from '@/lib/google-services'

export function InitClient() {
  useEffect(() => {
    initGoogleServices()
  }, [])
  
  return null
}
