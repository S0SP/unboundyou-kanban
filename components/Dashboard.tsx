'use client';

import React, { useState } from 'react';
import { useStore, Ticket, Lead } from '@/lib/useStore';
import { CustomSelect } from '@/components/CustomSelect';
import {
  TrendingUp,
  Calendar,
  Ticket as TicketIcon,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  X,
  Trash2,
  CheckSquare,
  Bell,
  Zap
} from 'lucide-react';

import TicketsDashboard from '@/components/TicketsDashboard';

export default function Dashboard() {
  const { tickets, leads, tasks, activities, users, toggleTask, addTask, deleteTask, setSelectedTicketId, updateTicket } = useStore();
  const [taskFilter, setTaskFilter] = useState<'pending' | 'completed'>('pending');
  const [stageFilter, setStageFilter] = useState<string>('All Stages');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTicketId, setNewTaskTicketId] = useState('');

  const getUserName = (userId: string | null): string => {
    if (!userId) return 'System';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'System';
  };



  // 2. Today's sessions count
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessionsCount = tickets.filter(t => {
    if (!t.session_date) return false;
    return t.session_date.startsWith(todayStr);
  }).length;

  // 3. Pending tickets count
  const pendingTicketsCount = tickets.filter(t => t.stage === 'Pending').length;

  // 4. Resolved tickets count
  const resolvedTicketsCount = tickets.filter(t => t.stage === 'Resolved').length;

  // 5. High & Critical Priority Queue & Recurring (Starred)
  const priorityQueue = [...tickets]
    .filter(t => (t.priority_level === 'Critical' || t.priority_level === 'High' || t.is_recurring) && t.stage !== 'Resolved' && t.stage !== 'Closed' && t.stage !== 'Dropped')
    .sort((a, b) => {
      if (a.is_recurring && !b.is_recurring) return -1;
      if (!a.is_recurring && b.is_recurring) return 1;
      return b.priority_score - a.priority_score;
    });

  // 6. Filtered Tasks list
  const filteredTasks = tasks.filter(t => taskFilter === 'pending' ? !t.completed : t.completed);

  // Active tickets for drop-down selection
  const activeTicketOptions = tickets.filter(t => t.stage !== 'Closed' && t.stage !== 'Dropped');

  // Helper: Find Lead parent/student names for a ticket
  const getLeadInfo = (leadId: string): Lead | undefined => {
    return leads.find(l => l.id === leadId);
  };

  // 6. Active Reminders — reminder_at is set and <= now
  const now = new Date();
  const activeReminders = tickets.filter(t => {
    if (!t.reminder_at) return false;
    return new Date(t.reminder_at) <= now && t.stage !== 'Closed' && t.stage !== 'Converted' && t.stage !== 'Dropped';
  });

  // 7. Session-expiry alerts — session in under 20 min and NOT yet completed
  const sessionAlerts = tickets.filter(t => {
    if (!t.session_date) return false;
    const sessionTime = new Date(t.session_date);
    const minsUntil = (sessionTime.getTime() - now.getTime()) / 60000;
    return minsUntil >= 0 && minsUntil <= 20 && t.stage !== 'Session Completed' && t.stage !== 'Closed' && t.stage !== 'Converted';
  });

  const getPriorityColor = (level: Ticket['priority_level']) => {
    switch (level) {
      case 'Critical':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'High':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Medium':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Low':
        return 'bg-gray-50 text-gray-500 border-gray-100';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const stats = [
    { 
      label: "Today's Sessions", 
      value: String(todaySessionsCount), 
      icon: Calendar, 
      color: 'text-[#08BD7E] bg-[#08BD7E]/10',
      onClick: undefined,
      active: false
    },
    { 
      label: 'Pending Tickets', 
      value: String(pendingTicketsCount), 
      icon: TicketIcon, 
      color: 'text-orange-500 bg-orange-50',
      onClick: () => setStageFilter(stageFilter === 'Pending' ? 'All Stages' : 'Pending'),
      active: stageFilter === 'Pending'
    },
    { 
      label: 'Resolved Tickets', 
      value: String(resolvedTicketsCount), 
      icon: CheckCircle2, 
      color: 'text-green-500 bg-green-50',
      onClick: () => setStageFilter(stageFilter === 'Resolved' ? 'All Stages' : 'Resolved'),
      active: stageFilter === 'Resolved'
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              onClick={stat.onClick}
              className={`border p-5 rounded-2xl flex items-center justify-between shadow-sm transition-all ${
                stat.onClick 
                  ? 'cursor-pointer hover:shadow-md select-none' 
                  : ''
              } ${
                stat.active 
                  ? 'scale-[1.01]' 
                  : ''
              }`}
              style={{ 
                backgroundColor: 'var(--bg-panel)', 
                borderColor: stat.active 
                  ? (stat.label === 'Pending Tickets' ? '#f97316' : '#22c55e')
                  : 'var(--border-base)',
                boxShadow: stat.active
                  ? (stat.label === 'Pending Tickets' ? '0 0 0 3px rgba(249, 115, 22, 0.15)' : '0 0 0 3px rgba(34, 197, 94, 0.15)')
                  : undefined
              }}
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}

        {/* Clear Filter Card */}
        {stageFilter !== 'All Stages' && (
          <div
            onClick={() => setStageFilter('All Stages')}
            className="border p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer select-none border-red-200 hover:border-red-300 bg-red-50/20 hover:bg-red-50/40 dark:border-red-900/30 dark:hover:border-red-900/50 dark:bg-red-950/10 dark:hover:bg-red-950/20 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">Filter Active</p>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-300">Clear Filter</h3>
            </div>
            <div className="p-3 rounded-xl bg-red-100/50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <X size={20} strokeWidth={2.5} />
            </div>
          </div>
        )}
      </div>

      {/* --- Alert Banners --- */}
      {sessionAlerts.length > 0 && (
        <div className="space-y-2">
          {sessionAlerts.map(ticket => {
            const lead = getLeadInfo(ticket.lead_id);
            const minsLeft = Math.round((new Date(ticket.session_date!).getTime() - now.getTime()) / 60000);
            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl cursor-pointer hover:bg-red-100 transition-colors animate-pulse"
              >
                <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                  <Zap size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-700">
                    ⚡ Session starts in {minsLeft} min — NOT marked completed!
                  </p>
                  <p className="text-xs text-red-500 truncate">
                    {lead?.student_name} • {ticket.title}
                  </p>
                </div>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold shrink-0">
                  ACTION NEEDED
                </span>
              </div>
            );
          })}
        </div>
      )}

      {activeReminders.length > 0 && (
        <div className="space-y-2">
          {activeReminders.map(ticket => {
            const lead = getLeadInfo(ticket.lead_id);
            const overdueMins = Math.round((now.getTime() - new Date(ticket.reminder_at!).getTime()) / 60000);
            const overdueLabel = overdueMins < 60
              ? `${overdueMins}m ago`
              : `${Math.round(overdueMins / 60)}h ago`;
            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0">
                  <Bell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-800">
                    🔔 Reminder: {ticket.title}
                  </p>
                  <p className="text-xs text-amber-600 truncate">
                    {lead?.student_name} • Due {overdueLabel}
                  </p>
                </div>
                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold shrink-0">
                  REMINDER
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTicket(ticket.id, { reminder_at: null });
                  }}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors shrink-0 ml-1"
                  title="Remove reminder"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Main Content - Priority Queue & Tickets */}
      <div className="space-y-8">

        {/* Priority Queue Widget */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Priority Queue</h3>
              <p className="text-xs text-gray-400">Critical & High priority actions calculated from rules, and Starred tickets</p>
            </div>
            <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-100">
              {priorityQueue.length} Urgent Action{priorityQueue.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto pr-1">
            {priorityQueue.length > 0 ? (
              priorityQueue.map((ticket) => {
                const lead = getLeadInfo(ticket.lead_id);
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="py-3 flex items-center justify-between hover:bg-gray-50/70 rounded-xl px-2 -mx-2 cursor-pointer transition-colors group"
                  >
                    <div className="space-y-1 flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        {ticket.is_recurring && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-200 bg-amber-50 text-amber-600 flex items-center gap-1">
                            ⭐ Starred
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getPriorityColor(ticket.priority_level)}`}>
                          {ticket.priority_level} ({ticket.priority_score})
                        </span>
                        <span className="text-xs text-gray-400 font-medium truncate">{ticket.ticket_type}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                        {ticket.title}
                      </h4>
                      <p className="text-xs text-gray-400 truncate">
                        Parent: <span className="font-medium text-gray-600">{lead?.parent_name || 'N/A'}</span> •
                        Student: <span className="font-medium text-gray-600"> {lead?.student_name || 'N/A'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">
                No critical or high priority tickets at the moment. Good job!
              </div>
            )}
          </div>
        </div>

        {/* Tickets Dashboard directly rendered */}
        <div>
          <TicketsDashboard stageFilter={stageFilter} setStageFilter={setStageFilter} />
        </div>
      </div>
    </div>
  );
}
