import React from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Search, Menu, User } from 'lucide-react'

const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return 'Dashboard'
  if (pathname.startsWith('/services')) return 'Services'
  if (pathname.startsWith('/reports')) return 'Reports'
  return 'InfraMind'
}

export const Header: React.FC = () => {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <header className="bg-white border-b border-secondary-200 lg:border-b-0">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <button className="lg:hidden p-2 text-secondary-500 hover:text-secondary-700">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{pageTitle}</h1>
            <p className="text-sm text-secondary-500">
              {pageTitle === 'Dashboard' && 'Monitor your services and infrastructure health'}
              {pageTitle === 'Services' && 'Manage and monitor your registered services'}
              {pageTitle === 'Reports' && 'View AI-generated reliability reports and insights'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder="Search services..."
                className="input pl-10 w-64"
              />
            </div>
          </div>
          
          <button className="relative p-2 text-secondary-500 hover:text-secondary-700">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-danger-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-secondary-900">Admin User</p>
              <p className="text-xs text-secondary-500">admin@infra-mind.dev</p>
            </div>
            <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
              <User className="w-4 h-4 text-primary-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}