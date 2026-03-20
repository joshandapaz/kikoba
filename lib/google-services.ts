'use client'
import { Capacitor } from '@capacitor/core'
import { AdMob } from '@capacitor-community/admob'

export async function initGoogleServices() {
  if (Capacitor.isNativePlatform()) {
    try {
      // Initialize AdMob
      console.log('Initializing AdMob...')
      await AdMob.initialize()
      
      console.log('Google Services initialized successfully')
    } catch (error) {
      console.error('Error initializing Google Services:', error)
    }
  }
}
