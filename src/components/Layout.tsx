import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navigation } from './Navigation'
import { Header } from './Header'

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary-50">
      <Navigation />
      <div className="lg:pl-64">
        <Header />
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}