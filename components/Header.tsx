'use client';

import React from 'react';
import { useStore } from '@/lib/useStore';
import { Menu, Plus, Search, Sun, Moon } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  setIsOpenMobile: (open: boolean) => void;
}

export default function Header({ setIsOpenMobile }: HeaderProps) {
  const { activeTab, currentUser, setCreateLeadOpen, setCreateTicketOpen, setIsSearchOpen, toggleDarkMode, isDarkMode } = useStore();

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return `Hello, ${currentUser?.name?.split(' ')[0] || 'User'} 👋`;
      case 'tickets-dashboard':
        return 'Tickets Analytics';
      case 'leads':
        return 'Leads Directory';
      case 'rules':
        return 'Rules Settings';
      default:
        return 'UnboundYou CRM';
    }
  };

  const getSubtitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return "Here is your agenda and high-priority lead queue.";
      case 'tickets-dashboard':
        return 'Analyze and filter ticket volumes by type and stage.';
      case 'leads':
        return 'Register parent queries and create conversion tickets.';
      case 'rules':
        return 'Adjust weights and conditions for priority calculations.';
      default:
        return 'Counselor Portal';
    }
  };

  return (
    <header
      className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-sm border-b"
      style={{
        backgroundColor: 'var(--bg-panel)',
        borderColor: 'var(--border-base)',
      }}
    >
      {/* Title & Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpenMobile(true)}
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-hover)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold md:text-2xl" style={{ color: 'var(--text-primary)' }}>{getTitle()}</h1>
          <p className="text-xs hidden sm:block mt-0.5" style={{ color: 'var(--text-muted)' }}>{getSubtitle()}</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search trigger */}
        <div
          onClick={() => setIsSearchOpen(true)}
          className="relative hidden md:block w-48 lg:w-64 cursor-pointer group"
        >
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            size={16}
          />
          <div
            className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm flex items-center justify-between transition-all"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-base)',
              color: 'var(--text-muted)',
            }}
          >
            <span>Search...</span>
            <kbd
              className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium shadow-sm"
              style={{
                borderColor: 'var(--border-strong)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
              }}
            >
              <span className="text-xs">⌘</span> K
            </kbd>
          </div>
        </div>

        {/* Notifications */}
        <NotificationDropdown />

        {/* ============================================================
            PREMIUM DARK MODE TOGGLE
            ============================================================ */}
        <button
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative flex items-center w-14 h-7 rounded-full border transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary shrink-0"
          style={{
            backgroundColor: isDarkMode ? '#1E2A4A' : '#EEF2FF',
            borderColor: isDarkMode ? '#3B4F7A' : '#C7D2FE',
          }}
        >
          {/* Track icons */}
          <Sun
            size={11}
            className="absolute left-1.5 transition-all duration-300"
            style={{
              color: isDarkMode ? '#4A5568' : '#F59E0B',
              opacity: isDarkMode ? 0.4 : 1,
            }}
          />
          <Moon
            size={11}
            className="absolute right-1.5 transition-all duration-300"
            style={{
              color: isDarkMode ? '#818CF8' : '#C7D2FE',
              opacity: isDarkMode ? 1 : 0.4,
            }}
          />
          {/* Thumb */}
          <span
            className="absolute w-5 h-5 rounded-full shadow-md flex items-center justify-center transition-all duration-500"
            style={{
              transform: isDarkMode ? 'translateX(30px)' : 'translateX(3px)',
              background: isDarkMode
                ? 'linear-gradient(135deg, #818CF8, #6366F1)'
                : 'linear-gradient(135deg, #FBBF24, #F59E0B)',
              boxShadow: isDarkMode
                ? '0 2px 8px rgba(99,102,241,0.5)'
                : '0 2px 8px rgba(251,191,36,0.4)',
            }}
          >
            {isDarkMode
              ? <Moon size={10} className="text-white" />
              : <Sun size={10} className="text-white" />
            }
          </span>
        </button>

        {/* Primary Call to Action */}
        <div className="flex gap-2">
          <button
            onClick={() => setCreateLeadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: isDarkMode ? 'rgba(14,207,164,0.12)' : 'rgba(8,189,126,0.10)',
              color: 'var(--brand-green)',
            }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Lead</span>
          </button>

          <button
            onClick={() => setCreateTicketOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-sm font-semibold shadow-md shadow-primary/10 transition-all duration-200"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Ticket</span>
          </button>
        </div>
      </div>
    </header>
  );
}
