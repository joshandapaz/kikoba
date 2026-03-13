import { use } from 'react'
import GroupDashboardClient from './GroupDashboardClient'

export default function GroupDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <GroupDashboardClient groupId={id} />
}

export function generateStaticParams() {
  return [{ id: '1' }]
}
