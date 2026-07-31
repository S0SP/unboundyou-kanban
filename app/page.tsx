'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/useStore';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import KanbanBoard from '@/components/KanbanBoard';
import LeadsView from '@/components/LeadsView';
import RulesBuilder from '@/components/RulesBuilder';
import TicketDetailModal from '@/components/TicketDetailModal';
import CreateModals from '@/components/CreateModals';
import { CommandPalette } from '@/components/CommandPalette';
import { ProfileModal } from '@/components/ProfileModal';
import { Toaster, toast } from 'sonner';

export default function Home() {
  const { activeTab, fetchData, isLoading, subscribeToActivities, isDarkMode } = useStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Restore dark mode preference from localStorage on first load
  useEffect(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('crm-dark-mode') : null;
    if (saved === 'true') {
      document.documentElement.classList.add('dark');
      // Sync store without re-triggering toggle
      useStore.setState({ isDarkMode: true });
    }
  }, []);

  useEffect(() => {
    fetchData();
    subscribeToActivities();
  }, [fetchData, subscribeToActivities]);

  useEffect(() => {
    const handleNewActivity = (e: Event) => {
      const customEvent = e as CustomEvent;
      const activity = customEvent.detail;
      toast.success('New Activity', {
        description: activity.message,
        position: 'bottom-right',
      });
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('new_activity', handleNewActivity);
      return () => window.removeEventListener('new_activity', handleNewActivity);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'kanban':
        return <KanbanBoard />;
      case 'leads':
        return <LeadsView />;
      case 'rules':
        return <RulesBuilder />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      
      {/* 1. Sidebar Navigation (Handles Collapsing & Mobile Slide-in) */}
      <Sidebar 
        isOpenMobile={isMobileSidebarOpen} 
        setIsOpenMobile={setIsMobileSidebarOpen} 
      />

      {/* 2. Main Page Layout Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Panel */}
        <Header setIsOpenMobile={setIsMobileSidebarOpen} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-base)' }}>
          <div className="max-w-7xl mx-auto h-full">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* 3. Global Overlay Panels (Ticket Detail slide-out, Create Lead & Ticket popup forms) */}
      <TicketDetailModal />
      <CreateModals />
      <CommandPalette />
      <ProfileModal />
      <Toaster richColors closeButton theme={isDarkMode ? 'dark' : 'light'} />
    </div>
  );
}
