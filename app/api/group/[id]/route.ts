export const dynamic = 'force-dynamic'
export function generateStaticParams() { return []; }
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: groupId } = await params

    // Verify user is a member of the group
    const { data: membership } = await supabaseAdmin
      .from('group_members')
      .select('role')
      .eq('userId', session.user.id)
      .eq('groupId', groupId)
      .maybeSingle()

    if (!membership) return NextResponse.json({ error: 'Hujajisajili kwenye kikundi hiki' }, { status: 403 })

    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (groupError) throw groupError

    // Fetch financial stats
    const { data: savings } = await supabaseAdmin
      .from('savings')
      .select('amount, userId, user:users(username, avatar_url)')
      .eq('groupId', groupId)

    const { count: loansCount } = await supabaseAdmin
      .from('loans')
      .select('*', { count: 'exact', head: true })
      .eq('groupId', groupId)

    const { count: membersCount } = await supabaseAdmin
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('groupId', groupId)

    const totalCollected = savings?.reduce((sum: number, s: any) => sum + s.amount, 0) || 0

    // Fetch pending withdrawal requests
    const { data: pendingWithdrawals } = await supabaseAdmin
      .from('group_withdrawals')
      .select('*, requester:users(username)')
      .eq('groupId', groupId)
      .eq('status', 'PENDING_ADMIN')

    // Fetch pending loans
    const { data: pendingLoans } = await supabaseAdmin
      .from('loans')
      .select('*, user:users(username)')
      .eq('groupId', groupId)
      .eq('status', 'PENDING_ADMIN')

    // Fetch recent activities
    const { data: recentActivities } = await supabaseAdmin
      .from('activities')
      .select('*, user:users(username)')
      .eq('groupId', groupId)
      .order('date', { ascending: false })
      .limit(10)

    // Fetch transactions as well to ensure parity (or we can switch to use this primarily)
    const { data: recentTransactions } = await supabaseAdmin
      .from('transactions')
      .select('*, user:users(username)')
      .eq('groupId', groupId)
      .order('createdAt', { ascending: false })
      .limit(10)

    // Calculate contributors list
    const contributorMap: Record<string, { username: string, avatar_url: string, total: number }> = {}
    savings?.forEach((s: any) => {
      if (!contributorMap[s.userId]) {
        contributorMap[s.userId] = { 
          username: s.user.username, 
          avatar_url: s.user.avatar_url,
          total: 0 
        }
      }
      contributorMap[s.userId].total += s.amount
    })

    const contributors = Object.entries(contributorMap).map(([userId, data]) => ({
      userId,
      ...data
    })).sort((a, b) => b.total - a.total)

    return NextResponse.json({
      ...group,
      userRole: membership.role,
      stats: {
        membersCount,
        loansCount,
        totalCollected,
        walletBalance: group.wallet_balance || 0
      },
      pendingWithdrawals: pendingWithdrawals || [],
      pendingLoans: pendingLoans || [],
      recentActivities: recentActivities || [],
      recentTransactions: recentTransactions || [],
      contributors
    })
  } catch (err: any) {
    console.error('Group Detail GET error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}
