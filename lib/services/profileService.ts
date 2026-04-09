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
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.avatarUrl) updateData.avatar_url = updates.avatarUrl

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', authUser.id)
      .select()
      .single()

    if (error) {
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

    return data
  }
}
