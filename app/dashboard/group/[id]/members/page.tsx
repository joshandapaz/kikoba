import { use } from 'react'
import GroupMembersClient from './GroupMembersClient'

export default function GroupMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <GroupMembersClient groupId={id} />
}

export function generateStaticParams() {
  return [{ id: '1' }]
}
