import { FilterBar } from '@/components/FilterBar'
import { NewsFeed } from '@/components/NewsFeed'
import { Header } from '@/components/Header'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <FilterBar />
      <main className="max-w-7xl mx-auto">
        <NewsFeed />
      </main>
    </div>
  )
}
