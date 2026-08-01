'use client';

import React, { useState } from 'react';
import { useStore, Ticket, Task } from '@/lib/useStore';
import { 
  X, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  FileText 
} from 'lucide-react';
import { CustomSelect } from '@/components/CustomSelect';

export default function TicketDetailModal() {
  const { 
    selectedTicketId, 
    setSelectedTicketId, 
    tickets, 
    leads, 
    tasks, 
    notes, 
    activities, 
    users,
    updateTicket, 
    addTask, 
    toggleTask, 
    deleteTask, 
    addNote 
  } = useStore();

  const [newNoteContent, setNewNoteContent] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Find the ticket
  const ticket = tickets.find(t => t.id === selectedTicketId);
  if (!ticket) return null;

  // Find linked lead
  const lead = leads.find(l => l.id === ticket.lead_id);
  // Find assignee user
  const assignee = users.find(u => u.id === ticket.assigned_to);

  // Filter tasks for this ticket
  const ticketTasks = tasks.filter(t => t.ticket_id === ticket.id);
  // Filter activities for this ticket
  const ticketActivities = activities.filter(a => a.ticket_id === ticket.id);
  // Filter notes for this lead
  const leadNotes = lead ? notes.filter(n => n.lead_id === lead.id) : [];

  const getUserName = (userId: string | null): string => {
    if (!userId) return 'System';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'System';
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !lead) return;
    addNote(lead.id, newNoteContent.trim());
    setNewNoteContent('');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask({
      ticket_id: ticket.id,
      title: newTaskTitle.trim(),
      auto_generated: false
    });
    setNewTaskTitle('');
  };

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
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setSelectedTicketId(null)}
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col z-10 transition-transform transform translate-x-0 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Ticket Detail #{ticket.id.slice(-4)}
            </span>
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{ticket.title}</h2>
          </div>
          <button 
            onClick={() => setSelectedTicketId(null)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          
          {/* Main details (Left 2 Columns) */}
          <div className="md:col-span-2 p-6 space-y-6">
            
            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/40 p-4 rounded-xl border border-gray-50">
                {ticket.description || 'No description provided.'}
              </p>
            </div>

            {/* Auto Task Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Checklist / Tasks</h4>
              
              {/* Add Task Form */}
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add custom task item..." 
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50"
                />
                <button 
                  type="submit"
                  className="p-2 bg-primary text-white hover:bg-primary/95 rounded-xl transition-all shadow-sm"
                >
                  <Plus size={16} />
                </button>
              </form>

              {/* Tasks List */}
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {ticketTasks.length > 0 ? (
                  ticketTasks.map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-3 border border-gray-50 bg-gray-50/20 rounded-xl hover:border-gray-200/60 transition-all group"
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-4 select-none">
                        <input 
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                        />
                        <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'} truncate`}>
                          {task.title}
                        </span>
                      </label>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4 bg-gray-50/20 border border-dashed border-gray-100 rounded-xl">
                    No checklists. Tasks generate automatically when stage updates.
                  </p>
                )}
              </div>
            </div>

            {/* Note Entry & Lead Notes */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Internal Lead Notes</h4>
              
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea 
                  rows={2}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Enter a new conversation note for this lead..." 
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50 resize-none"
                />
                <div className="flex justify-end">
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-xs font-semibold transition-all shadow-sm"
                  >
                    Post Note
                  </button>
                </div>
              </form>

              {/* Lead Notes List */}
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {leadNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50/30 border border-gray-100 rounded-xl text-xs">
                    <div className="flex justify-between items-center text-gray-400 mb-1 font-medium">
                      <span>{getUserName(note.created_by)}</span>
                      <span>{new Date(note.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700 leading-normal">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity History Log */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket History</h4>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                {ticketActivities.map((act) => (
                  <div key={act.id} className="flex gap-2 text-xs text-gray-500">
                    <Clock size={12} className="mt-0.5 shrink-0 text-gray-400" />
                    <p>
                      <span className="font-semibold text-gray-700">{getUserName(act.created_by)}</span> {act.message} • 
                      <span className="text-[10px] text-gray-400 ml-1">
                        {new Date(act.created_at).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sticky Metadata Sidebar (Right 1 Column) */}
          <div className="p-6 bg-gray-50/40 space-y-6">
            
            {/* Computed priority */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Priority Level</h4>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getPriorityColor(ticket.priority_level)}`}>
                  {ticket.priority_level}
                </span>
                <span className="text-xs text-gray-500 font-semibold">
                  Score: {ticket.priority_score} pts
                </span>
              </div>
            </div>

            {/* Lead Meta Information */}
            {lead && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lead Information</h4>
                
                <div className="space-y-2 bg-white p-3 border border-gray-100 rounded-xl shadow-sm text-xs">
                  <div className="space-y-1">
                    <p className="text-gray-400">Student Name</p>
                    <p className="font-bold text-gray-800 text-sm">{lead.student_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400">Parent Name</p>
                    <p className="font-semibold text-gray-700">{lead.parent_name}</p>
                  </div>
                  <div className="space-y-1 pt-1 border-t border-gray-50 flex items-center gap-2">
                    <Phone size={12} className="text-gray-400" />
                    <span className="text-gray-600 font-medium">{lead.phone || 'No phone'}</span>
                  </div>
                  <div className="space-y-1 flex items-center gap-2">
                    <Mail size={12} className="text-gray-400" />
                    <span className="text-gray-600 font-medium truncate">{lead.email || 'No email'}</span>
                  </div>
                  <div className="space-y-1 pt-1 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-gray-400">Estimated Value</span>
                    <span className="font-bold text-primary">₹{lead.estimated_value.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Controls / Assignments */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Settings & Assignment</h4>

              {/* Stage Select */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-semibold">Pipeline Stage</label>
                <CustomSelect 
                  value={ticket.stage}
                  onChange={(val) => updateTicket(ticket.id, { stage: val as Ticket['stage'] })}
                  className="rounded-xl px-3 bg-white"
                  options={[
                    { label: "New Leads", value: "New Leads" },
                    { label: "Contacted", value: "Contacted" },
                    { label: "Session Scheduled", value: "Session Scheduled" },
                    { label: "Session Completed", value: "Session Completed" },
                    { label: "Follow Up", value: "Follow Up" },
                    { label: "Interested", value: "Interested" },
                    { label: "Payment Pending", value: "Payment Pending" },
                    { label: "Converted", value: "Converted" },
                    { label: "Closed", value: "Closed" },
                    { label: "Dropped", value: "Dropped" }
                  ]}
                />
              </div>

              {/* Assignee Select */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-semibold">Assigned Counselor</label>
                <CustomSelect 
                  value={ticket.assigned_to}
                  onChange={(val) => updateTicket(ticket.id, { assigned_to: val })}
                  className="rounded-xl px-3 bg-white"
                  options={users.map(u => ({ label: u.name, value: u.id }))}
                />
              </div>

              {/* Ticket Type Select */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-semibold">Ticket Type</label>
                <CustomSelect 
                  value={ticket.ticket_type}
                  onChange={(val) => updateTicket(ticket.id, { ticket_type: val })}
                  className="rounded-xl px-3 bg-white"
                  options={[
                    { label: "Scheduling", value: "Scheduling" },
                    { label: "Rescheduling", value: "Rescheduling" },
                    { label: "Admission Inquiry", value: "Admission Inquiry" },
                    { label: "Payment Issue", value: "Payment Issue" },
                    { label: "e-book related problem", value: "e-book related problem" },
                    { label: "demo booking problem", value: "demo booking problem" }
                  ]}
                />
              </div>

              {/* Session Date Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-semibold">Session Date</label>
                <input 
                  type="date"
                  value={ticket.session_date ? ticket.session_date.split('T')[0] : ''}
                  onChange={(e) => {
                    const dateVal = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                    updateTicket(ticket.id, { session_date: dateVal });
                  }}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                />
              </div>

              {/* Due Date Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-semibold">Task Due Date</label>
                <input 
                  type="date"
                  value={ticket.due_date ? ticket.due_date.split('T')[0] : ''}
                  onChange={(e) => {
                    const dateVal = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                    updateTicket(ticket.id, { due_date: dateVal });
                  }}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                />
              </div>

              {/* Reminder Section */}
              <div className="space-y-1.5 border border-amber-100 bg-amber-50 rounded-xl p-3">
                <label className="text-xs text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1.5">
                  <span>🔔</span> Reminder Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={ticket.reminder_at ? ticket.reminder_at.slice(0, 16) : ''}
                  onChange={(e) => {
                    const val = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                    updateTicket(ticket.id, { reminder_at: val });
                  }}
                  className="w-full text-sm border border-amber-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                />
                <p className="text-[10px] text-amber-600 dark:text-amber-500/80 mt-1">You&apos;ll see an alert on the dashboard when this reminder is due.</p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
