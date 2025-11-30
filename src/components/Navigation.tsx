import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  Activity, 
  Server, 
  FileText, 
  BarChart3,
  Settings,
  Shield,
  Zap
} from 'lucide-react'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Services', href: '/services', icon: Server },
  { name: 'Reports', href: '/reports', icon: FileText },
]

export const Navigation: React.FC = () => {
  const location = useLocation()

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 lg:block hidden">
      <div className="flex h-16 items-center px-6 border-b border-secondary-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">InfraMind</h1>
            <p className="text-xs text-secondary-500">Self-Healing Cloud Copilot</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = item.href === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.href)
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={clsx(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900'
              )}
            >
              <item.icon
                className={clsx(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-500'
                )}
              />
              {item.name}
            </NavLink>
          )
        })}
      </nav>
      
      <div className="border-t border-secondary-200 p-4">
        <div className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 bg-success-100 rounded-full">
            <Activity className="w-4 h-4 text-success-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-900">System Status</p>
            <p className="text-xs text-success-600">All systems operational</p>
          </div>
          <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}