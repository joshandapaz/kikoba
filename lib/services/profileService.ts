import { supabase } from '@/lib/supabase'

export const profileService = {
  async getProfile() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('users')
      .select('id, memberCode, username, email, phone, dateJoined, avatar_url, wallet_balance')
      .eq('id', authUser.id)
      .single()

    if (error) {
      // Handle missing avatar_url column if necessary (for legacy schemas)
      if (error.code === '42703') {
        const { data: fallback, error: fallbackErr } = await supabase
          .from('users')
          .select('id, memberCode, username, email, phone, dateJoined, wallet_balance')
          .eq('id', authUser.id)
          .single()
        if (fallbackErr) throw fallbackErr
        return fallback
      }
      throw error
    }

    return data
  },

  async updateProfile(updates: { username?: string, phone?: string, avatarUrl?: string }) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Unauthorized')

    const updateData: any = {}
    if (updates.username) updateData.username = updates.username
    
    if (updates.phone !== undefined) {
      let phone = updates.phone.trim()
      if (phone) {
        // Normalize: remove non-digits
        phone = phone.replace(/\D/g, '')
        // Normalize: if 0..., convert to 255...
        if (phone.startsWith('0')) {
          phone = '255' + phone.substring(1)
        }
        // Normalize: if it doesn't have 255, it's probably too short or invalid for AzamPay
        if (phone.length === 9 || phone.length === 10) {
           if (!phone.startsWith('255')) phone = '255' + (phone.startsWith('0') ? phone.substring(1) : phone)
        }
      }
      updateData.phone = phone || null
    }
    
    if (updates.avatarUrl) updateData.avatar_url = updates.avatarUrl

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', authUser.id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('phone')) throw new Error('Namba hii ya simu tayari inatumiwa na akaunti nyingine.')
        if (error.message.includes('username')) throw new Error('Jina hili la mtumiaji tayari limeshachukuliwa.')
      }
      
      if (error.code === '42703' && updateData.avatar_url) {
        delete updateData.avatar_url
        const { data: fallback, error: fallbackErr } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', authUser.id)
          .select()
          .single()
        if (fallbackErr) throw fallbackErr
        return fallback
      }
      throw error
    }

    // Log the activity
    try {
      await supabase.from('activities').insert({
        userId: authUser.id,
        action: 'Amesasisha taarifa za wasifu wake',
        date: new Date().toISOString()
      })
    } catch (e) {
      console.warn('Activity logging failed', e)
    }

    return data
  }
}
