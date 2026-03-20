'use client'
import { Capacitor } from '@capacitor/core'
import { FirebaseApp } from '@capacitor-firebase/app'
import { AdMob } from '@capacitor-community/admob'

export async function initGoogleServices() {
  if (Capacitor.isNativePlatform()) {
    try {
      // Initialize Firebase
      // Note: This requires GoogleService-Info.plist (iOS) or google-services.json (Android)
      // but the plugin handles the native initialization if files are present.
      console.log('Initializing Firebase...')
      
      // Initialize AdMob
      console.log('Initializing AdMob...')
      await AdMob.initialize()
      
      console.log('Google Services initialized successfully')
    } catch (error) {
      console.error('Error initializing Google Services:', error)
    }
  }
}
