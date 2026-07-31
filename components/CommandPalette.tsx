'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useStore } from '@/lib/useStore';
import { Search, User, LayoutDashboard, Settings, Ticket, LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@radix-ui/react-dialog';

export function CommandPalette() {
  const { isSearchOpen, setIsSearchOpen, leads, tickets, setActiveTab, setSelectedTicketId } = useStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isSearchOpen, setIsSearchOpen]);

  const handleSelectLead = (leadId: string) => {
    setIsSearchOpen(false);
    setActiveTab('leads');
    // In a real app we might open a lead details view, but for now navigating to leads tab is fine.
  };

  const handleSelectTicket = (ticketId: string) => {
    setIsSearchOpen(false);
    setActiveTab('kanban');
    setSelectedTicketId(ticketId);
  };

  const handleSelectPage = (page: 'dashboard' | 'kanban' | 'leads' | 'rules') => {
    setIsSearchOpen(false);
    setActiveTab(page);
  };

  return (
    <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
        <DialogContent className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 p-4 outline-none">
          <Command 
            className="w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            label="Global Command Menu"
          >
            <div className="flex items-center border-b border-slate-100 px-4">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <Command.Input 
                className="flex-1 h-14 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium" 
                placeholder="Search leads, tickets, or navigate..." 
              />
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-smooth">
              <Command.Empty className="py-6 text-center text-sm text-slate-500">
                No results found.
              </Command.Empty>

              <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-semibold text-slate-400 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-2">
                <Command.Item 
                  onSelect={() => handleSelectPage('dashboard')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors data-[selected=true]:bg-slate-50 data-[selected=true]:text-indigo-600 outline-none"
                >
                  <LayoutDashboard size={16} /> Go to Dashboard
                </Command.Item>
                <Command.Item 
                  onSelect={() => handleSelectPage('kanban')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors data-[selected=true]:bg-slate-50 data-[selected=true]:text-indigo-600 outline-none"
                >
                  <Ticket size={16} /> Go to Kanban Board
                </Command.Item>
                <Command.Item 
                  onSelect={() => handleSelectPage('rules')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors data-[selected=true]:bg-slate-50 data-[selected=true]:text-indigo-600 outline-none"
                >
                  <Settings size={16} /> Priority Rules Config
                </Command.Item>
              </Command.Group>

              {tickets.length > 0 && (
                <Command.Group heading="Tickets" className="px-2 py-1.5 text-xs font-semibold text-slate-400 mt-2 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-2">
                  {tickets.map(ticket => (
                    <Command.Item 
                      key={ticket.id} 
                      onSelect={() => handleSelectTicket(ticket.id)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors data-[selected=true]:bg-slate-50 outline-none group"
                      value={ticket.title + ' ' + ticket.ticket_type}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                          <Ticket size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800 group-data-[selected=true]:text-indigo-600">{ticket.title}</span>
                          <span className="text-xs text-slate-500">{ticket.stage}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">Ticket</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {leads.length > 0 && (
                <Command.Group heading="Leads" className="px-2 py-1.5 text-xs font-semibold text-slate-400 mt-2 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-2">
                  {leads.map(lead => (
                    <Command.Item 
                      key={lead.id} 
                      onSelect={() => handleSelectLead(lead.id)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors data-[selected=true]:bg-slate-50 outline-none group"
                      value={lead.parent_name + ' ' + lead.student_name + ' ' + (lead.email || '')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800 group-data-[selected=true]:text-indigo-600">{lead.parent_name} (Parent)</span>
                          <span className="text-xs text-slate-500">Student: {lead.student_name}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">Lead</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
