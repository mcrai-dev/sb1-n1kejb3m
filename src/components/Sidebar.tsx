import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, GraduationCap, Building2, Home, Menu, X,
  ChevronLeft, ChevronRight, Settings
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const links = [
    {
      to: '/dashboard',
      icon: Home,
      label: 'Accueil',
      exact: true
    },
    {
      to: '/dashboard/students',
      icon: Users,
      label: 'Étudiants'
    },
    {
      to: '/dashboard/teachers',
      icon: GraduationCap,
      label: 'Enseignants'
    },
    {
      to: '/dashboard/settings',
      icon: Building2,
      label: 'Établissement'
    }
  ];

  return (
    <>
      {/* Overlay mobile */}
      <div 
        className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary-600" />
              {!isCollapsed && (
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Edubot
                </span>
              )}
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(link.to) 
                    ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
                title={isCollapsed ? link.label : undefined}
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{link.label}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <ThemeToggle />
              {!isCollapsed && (
                <Link
                  to="/dashboard/settings"
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              )}
            </div>
            {!isCollapsed && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Version 1.0.0
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}