'use client'

import Sidebar from '@/components/Sidebar'
import NotificationService from '@/components/NotificationService'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        {/* Notification bell in top-right corner of content area */}
        <div className="fixed top-4 right-4 z-40">
          <NotificationService />
        </div>
        {children}
      </main>
    </div>
  )
}
