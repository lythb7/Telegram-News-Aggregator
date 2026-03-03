import { Header } from '@/components/Header'
import { ChannelManager } from '@/components/admin/ChannelManager'

export const metadata = { title: 'Channel Management — News Aggregator' }

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100">Channel Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add Telegram channels to monitor. Reliability (1–10) weights the news score — higher means more trusted.
          </p>
        </div>
        <ChannelManager />
      </main>
    </div>
  )
}
