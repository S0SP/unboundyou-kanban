'use client';

import React from 'react';
import { useStore } from '@/lib/useStore';
import {
  LayoutDashboard,
  Kanban,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export default function Sidebar({ isOpenMobile, setIsOpenMobile }: SidebarProps) {
  const { activeTab, setActiveTab, currentUser, isCollapsed, setIsCollapsed, setProfileOpen, signOut } = useStore();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kanban', label: 'Kanban Board', icon: Kanban },
    { id: 'leads', label: 'Leads & Queries', icon: Users },
    { id: 'rules', label: 'Priority Rules', icon: Settings },
  ] as const;

  const renderSidebarContent = (isMobile: boolean) => {
    const collapsed = isMobile ? false : isCollapsed;
    return (
      <div className="flex flex-col h-full bg-[#0B1120] text-slate-300 relative border-r border-slate-800/50">
        {/* Brand Header */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start px-5'} pt-8 pb-6 h-24`}>
          {!collapsed ? (
            <img
              src="https://demobooking.unboundyou.com/_next/image?url=%2Flogo.png&w=640&q=75"
              alt="UnboundYou Logo"
              className="object-contain w-auto h-15 object-left opacity-90"
            />
          ) : (
            <img
              src="https://testing-unboundyou.vercel.app/logo.svg"
              alt="UnboundYou Icon"
              className="object-contain w-9 h-13 opacity-90"
            />
          )}
        </div>

        {/* Collapse Button (Desktop Only) */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex absolute -right-3.5 top-11 items-center justify-center w-7 h-7 rounded-full border border-slate-700 bg-[#0B1120] hover:bg-slate-800 text-slate-400 hover:text-white transition-all shadow-sm z-50"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        {/* Nav List */}
        <nav className="flex-1 space-y-2 px-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${collapsed ? 'justify-center' : 'justify-start'
                  } ${isActive
                    ? 'bg-indigo-500/15 text-indigo-300 font-medium'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-indigo-300' : 'text-slate-400'} />
                {!collapsed && <span className="text-sm tracking-wide">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer User Block */}
        <div className="border-t border-slate-800/50 pb-8 pt-4 px-3 mt-auto">
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to sign out?')) {
                await signOut();
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-slate-400 hover:bg-slate-800/50 hover:text-red-400 mb-4 ${collapsed ? 'justify-center' : 'justify-start'}`}
            title="Sign Out"
          >
            <LogOut size={18} strokeWidth={2} />
            {!collapsed && <span className="text-sm tracking-wide">Sign Out</span>}
          </button>

          {/* Clicking this block opens Account Settings */}
          <button
            onClick={() => setProfileOpen(true)}
            className={`w-full flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-2'} py-2.5 hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer text-left focus:outline-none`}
            title="Account Settings"
          >
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700/50 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center ring-2 ring-slate-700/50 shrink-0">
                <UserIcon size={16} />
              </div>
            )}

            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-200 truncate">{currentUser?.name || 'User'}</h4>
                  <p className="text-xs text-slate-500 truncate capitalize">{currentUser?.role || 'Counselor'}</p>
                </div>
                <Settings size={14} className="text-slate-500 hover:text-slate-350 transition-colors shrink-0 ml-auto" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar container */}
      <aside
        className={`hidden lg:block h-screen sticky top-0 transition-all duration-300 z-30 ${isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Mobile Sidebar drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-64 z-50 transform transition-transform duration-300 ease-in-out ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {renderSidebarContent(true)}
      </aside>
    </>
  );
}
