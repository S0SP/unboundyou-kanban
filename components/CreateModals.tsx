/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useStore, Ticket } from '@/lib/useStore';
import { X, Star } from 'lucide-react';
import { CustomSelect } from '@/components/CustomSelect';

export default function CreateModals() {
  const { 
    users, 
    leads, 
    addLead, 
    addTicket,
    isCreateLeadOpen, 
    setCreateLeadOpen, 
    isCreateTicketOpen, 
    setCreateTicketOpen, 
    ticketTypes,
    addTicketType,
    preselectedLeadId,
    setPreselectedLeadId,
    preselectedTicketStage,
    setPreselectedTicketStage
  } = useStore();

  // --- Lead Form State ---
  const [parentName, setParentName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('Website');
  const [estValue, setEstValue] = useState('45000');
  const [leadAssignee, setLeadAssignee] = useState(users[0]?.id || '');

  // --- Ticket Form State ---
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketType, setTicketType] = useState(ticketTypes[0] || 'Scheduling');
  const [ticketStage, setTicketStage] = useState<Ticket['stage']>('Pending');
  const [ticketAssignee, setTicketAssignee] = useState(users[0]?.id || '');
  const [dueDate, setDueDate] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [isRecurring, setIsRecurring] = useState(false);

  // Sync default values once users & preselected fields are loaded
  useEffect(() => {
    if (users.length > 0) {
      if (!leadAssignee) setLeadAssignee(users[0].id);
      if (!ticketAssignee) setTicketAssignee(users[0].id);
    }
  }, [users, leadAssignee, ticketAssignee]);

  useEffect(() => {
    if (isCreateTicketOpen) {
      if (preselectedLeadId) {
        setSelectedLeadId(preselectedLeadId);
      } else if (leads.length > 0) {
        setSelectedLeadId(leads[0].id);
      }
      
      if (preselectedTicketStage) {
        setTicketStage(preselectedTicketStage);
      } else {
        setTicketStage('Pending');
      }
    }
  }, [isCreateTicketOpen, preselectedLeadId, preselectedTicketStage, leads]);

  const handleCloseTicketModal = () => {
    setPreselectedLeadId(null);
    setPreselectedTicketStage(null);
    setCreateTicketOpen(false);
  };

  // Handle Lead Submit
  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim() || !studentName.trim()) return;

    addLead({
      parent_name: parentName.trim(),
      student_name: studentName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      source,
      estimated_value: Number(estValue) || 0,
      assigned_to: leadAssignee,
    });

    // Reset & Close
    setParentName('');
    setStudentName('');
    setPhone('');
    setEmail('');
    setEstValue('45000');
    setCreateLeadOpen(false);
  };

  // Handle Ticket Submit
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDescription = ticketDescription.trim();
    const trimmedTitle = ticketTitle.trim();
    const trimmedType = ticketType.trim();

    if (!trimmedTitle || !trimmedDescription || !selectedLeadId) return;

    // Save custom type to db if it's new
    if (trimmedType && !ticketTypes.includes(trimmedType)) {
      await addTicketType(trimmedType);
    }

    await addTicket({
      lead_id: selectedLeadId,
      title: trimmedTitle,
      description: trimmedDescription,
      ticket_type: trimmedType || 'Scheduling',
      stage: ticketStage,
      due_date: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      session_date: sessionDate ? new Date(sessionDate).toISOString() : undefined,
      reminder_at: reminderDate ? new Date(`${reminderDate}T${reminderTime || '09:00'}`).toISOString() : undefined,
      assigned_to: ticketAssignee,
      is_recurring: isRecurring,
    });

    // Reset & Close
    setTicketTitle('');
    setTicketDescription('');
    setTicketType(ticketTypes[0] || 'Scheduling');
    setDueDate('');
    setSessionDate('');
    setReminderDate('');
    setReminderTime('09:00');
    setIsRecurring(false);
    handleCloseTicketModal();
  };

  return (
    <>
      {/* 1. CREATE LEAD MODAL */}
      {isCreateLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCreateLeadOpen(false)} />
          
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add New Lead</h3>
              <button onClick={() => setCreateLeadOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLeadSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-semibold">Parent Name *</label>
                  <input 
                    type="text" 
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar" 
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-semibold">Student Name *</label>
                  <input 
                    type="text" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Aarav Kumar" 
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-semibold">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210" 
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-semibold">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rajesh@gmail.com" 
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-semibold">Lead Source</label>
                  <CustomSelect 
                    value={source}
                    onChange={(val) => setSource(val)}
                    className="rounded-xl px-3 bg-white"
                    options={[
                      { label: "Website", value: "Website" },
                      { label: "Reference", value: "Reference" },
                      { label: "Instagram Ad", value: "Instagram Ad" },
                      { label: "Cold Call", value: "Cold Call" }
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-semibold">Assign Counselor</label>
                <CustomSelect 
                  value={leadAssignee}
                  onChange={(val) => setLeadAssignee(val)}
                  className="rounded-xl px-3 bg-white"
                  options={users.map(u => ({ label: u.name, value: u.id }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setCreateLeadOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#08BD7E] text-white hover:bg-[#08BD7E]/95 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CREATE TICKET MODAL */}
      {isCreateTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCreateTicketOpen(false)} />
          
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create Query Ticket</h3>
              <button onClick={handleCloseTicketModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTicketSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-semibold">Select Parent Lead *</label>
                <CustomSelect 
                  value={selectedLeadId}
                  onChange={(val) => setSelectedLeadId(val)}
                  className="rounded-xl px-3 bg-white"
                  options={leads.map(l => ({ label: `${l.parent_name} (Student: ${l.student_name})`, value: l.id }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-semibold">Ticket Subject / Title *</label>
                <input 
                  type="text" 
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="e.g. Reschedule Science class to Friday" 
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-semibold">Ticket Description *</label>
                <textarea 
                  rows={4}
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="e.g. The student missed the last 2 classes due to illness. They are available for a makeup class on Friday evening..." 
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white resize-none"
                  required
                />
                <p className="text-[10px] text-gray-400 leading-tight">
                  Provide specific details to help resolve the ticket faster (e.g., reasons for the request, relevant dates, or student availability).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-semibold">Ticket Type (Type or Select) *</label>
                  <input
                    type="text"
                    value={ticketType}
                    onChange={(e) => setTicketType(e.target.value)}
                    list="ticket-types-datalist"
                    placeholder="e.g. Scheduling"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                    required
                  />
                  <datalist id="ticket-types-datalist">
                    {ticketTypes.map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-semibold">Status</label>
                  <CustomSelect 
                    value={ticketStage}
                    onChange={(val) => setTicketStage(val as Ticket['stage'])}
                    className="rounded-xl px-3 bg-white"
                    options={[
                      { label: "Pending", value: "Pending" },
                      { label: "Resolved", value: "Resolved" }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-semibold">Session Date (optional)</label>
                  <input 
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-semibold">Task Due Date</label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  />
                </div>
              </div>

              {/* Reminder Date + Time */}
              <div className="space-y-1 border border-amber-100 bg-amber-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1.5">
                    <span>🔔</span> Reminder Date &amp; Time (optional)
                  </label>
                  {(reminderDate || reminderTime !== '09:00') && (
                    <button
                      type="button"
                      onClick={() => {
                        setReminderDate('');
                        setReminderTime('09:00');
                      }}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-colors"
                      title="Clear reminder"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full text-sm border border-amber-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                  />
                  <input 
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full text-sm border border-amber-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                  />
                </div>
                <p className="text-[10px] text-amber-600 dark:text-amber-500/80">You&apos;ll see an alert on the dashboard when this reminder is due.</p>
              </div>

              {/* Recurring / Star Toggle */}
              <div className="flex items-center gap-3 border border-gray-100 p-3 rounded-xl bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setIsRecurring(!isRecurring)}>
                <div className={`p-1.5 rounded-full transition-colors ${isRecurring ? 'text-amber-500 bg-amber-100' : 'text-gray-400 bg-white border border-gray-200'}`}>
                  <Star size={16} fill={isRecurring ? "currentColor" : "none"} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Mark as Priority (Star)</h4>
                  <p className="text-[10px] text-gray-500">This ticket will automatically jump to the Priority Queue.</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-semibold">Assign Counselor</label>
                <CustomSelect 
                  value={ticketAssignee}
                  onChange={(val) => setTicketAssignee(val)}
                  className="rounded-xl px-3 bg-white"
                  options={users.map(u => ({ label: u.name, value: u.id }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={handleCloseTicketModal}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
