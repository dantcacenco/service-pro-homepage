import Navigation from '@/components/Navigation'

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Demo mode - no authentication required
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      <div className="bg-blue-600 text-white text-center py-2 px-4 text-sm font-medium">
        🎭 Demo Mode - Explore with sample data • All data is for demonstration purposes only
      </div>

      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
