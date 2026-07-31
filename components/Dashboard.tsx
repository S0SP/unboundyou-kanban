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

export default function Dashboard() {
  const { tickets, leads, tasks, activities, users, toggleTask, addTask, deleteTask, setSelectedTicketId } = useStore();
  const [taskFilter, setTaskFilter] = useState<'pending' | 'completed'>('pending');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTicketId, setNewTaskTicketId] = useState('');

  const getUserName = (userId: string | null): string => {
    if (!userId) return 'System';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'System';
  };

  // --- Calculations ---
  // 1. Potential Revenue (Sum of active leads estimated values)
  const potentialRevenue = leads
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + Number(l.estimated_value), 0);

  // 2. Today's sessions count
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessionsCount = tickets.filter(t => {
    if (!t.session_date) return false;
    return t.session_date.startsWith(todayStr);
  }).length;

  // 3. Active tickets count
  const activeTicketsCount = tickets.filter(t => t.stage !== 'Closed' && t.stage !== 'Dropped' && t.stage !== 'Converted').length;

  // 4. Overdue / Open tasks count
  const openTasksCount = tasks.filter(t => !t.completed).length;

  // 5. High & Critical Priority Queue
  const priorityQueue = [...tickets]
    .filter(t => t.priority_level === 'Critical' || t.priority_level === 'High')
    .sort((a, b) => b.priority_score - a.priority_score);

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
    { label: 'Potential Revenue', value: `₹${potentialRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-primary bg-primary/10' },
    { label: "Today's Sessions", value: String(todaySessionsCount), icon: Calendar, color: 'text-[#08BD7E] bg-[#08BD7E]/10' },
    { label: 'Active Tickets', value: String(activeTicketsCount), icon: TicketIcon, color: 'text-orange-500 bg-orange-50' },
    { label: 'Pending Tasks', value: String(openTasksCount), icon: AlertCircle, color: 'text-red-500 bg-red-50' },
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
              className="border p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-base)' }}
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
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Priority Queue & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority Queue Widget */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Priority Queue</h3>
                <p className="text-xs text-gray-400">Critical & High priority actions calculated from rules</p>
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
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-400">Est. Value</p>
                          <p className="text-sm font-bold text-gray-800">₹{lead?.estimated_value.toLocaleString('en-IN') || 0}</p>
                        </div>
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

          {/* Recent Activity Feed */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Activity Timeline</h3>
              <p className="text-xs text-gray-400">Latest actions performed by counselors</p>
            </div>

            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex gap-3 text-sm">
                    <div className="mt-0.5 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                      <Clock size={12} />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-gray-700 text-sm leading-tight">
                        <span className="font-semibold text-gray-900">{getUserName(act.created_by)}</span> {act.message}
                      </p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-400 text-sm">
                  No activity logged yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Today's Tasks Checklist */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">My Action Items</h3>
                <p className="text-xs text-gray-400">Manage tasks linked to pipeline tickets</p>
              </div>
              <button 
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                title="Add custom task"
              >
                {isAddingTask ? <X size={16} /> : <Plus size={16} />}
              </button>
            </div>

            {/* Inline Task Form */}
            {isAddingTask && (
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newTaskTitle.trim() || !newTaskTicketId) return;
                  await addTask({
                    title: newTaskTitle.trim(),
                    ticket_id: newTaskTicketId,
                    auto_generated: false
                  });
                  setNewTaskTitle('');
                  setIsAddingTask(false);
                }}
                className="p-3 border border-indigo-100 rounded-xl bg-indigo-50/20 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="text-xs font-semibold text-indigo-950/80">Add Custom Action</div>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-white"
                  required
                />
                <CustomSelect 
                  value={newTaskTicketId}
                  onChange={(val) => setNewTaskTicketId(val)}
                  options={activeTicketOptions.map(t => {
                    const l = getLeadInfo(t.lead_id);
                    return {
                      value: t.id,
                      label: l ? `${l.student_name} (${t.ticket_type})` : t.title
                    };
                  })}
                  placeholder="Select Ticket/Student..."
                  className="text-xs h-9"
                />
                <div className="flex gap-2 justify-end">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddingTask(false);
                      setNewTaskTitle('');
                    }}
                    className="text-[10px] px-2.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="text-[10px] px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-100 pb-1 gap-4">
              <button 
                onClick={() => setTaskFilter('pending')}
                className={`text-xs font-semibold pb-1.5 border-b-2 transition-all ${taskFilter === 'pending' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Pending ({tasks.filter(t => !t.completed).length})
              </button>
              <button 
                onClick={() => setTaskFilter('completed')}
                className={`text-xs font-semibold pb-1.5 border-b-2 transition-all ${taskFilter === 'completed' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Completed ({tasks.filter(t => t.completed).length})
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const linkedTicket = tickets.find(t => t.id === task.ticket_id);
                  return (
                    <div 
                      key={task.id}
                      className="p-3 border border-gray-100 rounded-xl hover:border-primary/20 transition-all bg-gray-50/20 flex gap-3 items-start group relative"
                    >
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className={`mt-0.5 transition-colors shrink-0 ${task.completed ? 'text-[#08BD7E]' : 'text-gray-300 hover:text-primary'}`}
                      >
                        {task.completed ? (
                          <CheckCircle2 size={18} className="fill-[#08BD7E]/10" />
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 hover:border-primary transition-all group-hover:scale-105" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold leading-snug group-hover:text-primary transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-gray-800'}`}>
                          {task.title}
                        </h4>
                        {linkedTicket && (
                          <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                            Ticket: {linkedTicket.title}
                          </p>
                        )}
                      </div>

                      <button 
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this task?')) {
                            await deleteTask(task.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                        title="Delete task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-2 h-full">
                  <CheckSquare size={32} className="text-slate-300 mb-1" />
                  <p>{taskFilter === 'pending' ? 'All tasks complete! You are clear for today.' : 'No completed tasks yet.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
