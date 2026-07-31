'use client';

import React, { useState } from 'react';
import { useStore, Lead } from '@/lib/useStore';
import { Search, Phone, Mail, Plus, MessageCircle } from 'lucide-react';

export default function LeadsView() {
  const { leads, tickets, users, addLead, setCreateLeadOpen, setCreateTicketOpen, setPreselectedLeadId } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateTicketForLead = (leadId: string) => {
    setPreselectedLeadId(leadId);
    setCreateTicketOpen(true);
  };

  // Filter leads based on query
  const filteredLeads = leads.filter(l => 
    l.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCounselorName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unassigned';
  };

  const getTicketsCount = (leadId: string) => {
    return tickets.filter(t => t.lead_id === leadId).length;
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by parent, student, or email..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white shadow-sm"
          />
        </div>

        <button 
          onClick={() => setCreateLeadOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white hover:bg-primary/95 rounded-xl text-sm font-semibold shadow-md shadow-primary/10 transition-all"
        >
          <Plus size={16} />
          <span>Add New Lead</span>
        </button>
      </div>

      {/* Directory List */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Parent & Student</th>
                <th className="py-4 px-6">Contact Info</th>
                <th className="py-4 px-6 text-right">Est. Deal Value</th>
                <th className="py-4 px-6">Assigned Counselor</th>
                <th className="py-4 px-6 text-center">Active Tickets</th>
                <th className="py-4 px-6">Registered Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-700">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/30 transition-colors">
                    {/* Parent & Student */}
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-900">{lead.parent_name}</p>
                        <p className="text-xs text-gray-400 font-medium">Student: {lead.student_name}</p>
                      </div>
                    </td>
                    
                    {/* Contact Info */}
                    <td className="py-4 px-6">
                      <div className="space-y-1 text-xs">
                        {/* WhatsApp link */}
                        {lead.phone ? (
                          <a
                            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                            target="_self"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium group"
                            title={`WhatsApp ${lead.phone}`}
                          >
                            <MessageCircle size={13} className="shrink-0" />
                            <span className="underline underline-offset-2">{lead.phone}</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Phone size={12} />
                            <span>No phone</span>
                          </div>
                        )}
                        {/* Email mailto link */}
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium group"
                            title={`Email ${lead.email}`}
                          >
                            <Mail size={12} className="shrink-0" />
                            <span className="underline underline-offset-2 truncate max-w-[180px]">{lead.email}</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Mail size={12} />
                            <span>No email</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Deal Value */}
                    <td className="py-4 px-6 text-right font-bold text-gray-900">
                      ₹{lead.estimated_value.toLocaleString('en-IN')}
                    </td>

                    {/* Counselor */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                          {getCounselorName(lead.assigned_to).charAt(0)}
                        </div>
                        <span className="font-medium text-gray-700">{getCounselorName(lead.assigned_to)}</span>
                      </div>
                    </td>

                    {/* Tickets Count */}
                    <td className="py-4 px-6 text-center">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                        {getTicketsCount(lead.id)}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td className="py-4 px-6 text-xs text-gray-400 font-medium">
                      {new Date(lead.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    {/* Actions column */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleCreateTicketForLead(lead.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition-colors"
                        title="Create pipeline ticket for this lead"
                      >
                        <Plus size={12} />
                        Create Ticket
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    No leads found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
