'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore, Ticket, Lead } from '@/lib/useStore';
import { CustomSelect } from '@/components/CustomSelect';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import {
  PieChart,
  Filter,
  Ticket as TicketIcon,
  ChevronRight,
  Clock,
  Loader2,
  CheckCircle,
  Circle,
  Star,
  Plus
} from 'lucide-react';

const supabase = createClient();

interface TicketsDashboardProps {
  stageFilter?: string;
  setStageFilter?: (val: string) => void;
}

export default function TicketsDashboard({
  stageFilter: propStageFilter,
  setStageFilter: propSetStageFilter,
}: TicketsDashboardProps = {}) {
  const { tickets, users, setSelectedTicketId, ticketTypes, setCreateTicketOpen, setPreselectedTicketStage, updateTicket } = useStore();

  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [localStageFilter, setLocalStageFilter] = useState<string>('All Stages');

  const stageFilter = propStageFilter !== undefined ? propStageFilter : localStageFilter;
  const setStageFilter = propSetStageFilter !== undefined ? propSetStageFilter : setLocalStageFilter;

  // Server-side state
  const [typeVolumes, setTypeVolumes] = useState<Record<string, number>>({});
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [leadsCache, setLeadsCache] = useState<Record<string, Lead>>({});
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const stages = [
    'New Lead',
    'Contacted',
    'Session Scheduled',
    'Session Completed',
    'Follow Up',
    'Interested',
    'Payment Pending',
    'Converted',
    'Closed',
    'Dropped'
  ];

  const getUserName = (userId: string | null): string => {
    if (!userId) return 'System';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'System';
  };

  const getLeadInfo = (leadId: string): Lead | undefined => {
    return leadsCache[leadId];
  };

  // Fetch Analytics from RPC
  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data, error } = await supabase.rpc('get_ticket_volume_by_type');
      if (error) {
        toast.error('Failed to load ticket analytics');
        return;
      }

      if (data) {
        const volumes: Record<string, number> = {};
        data.forEach((row: any) => {
          volumes[row.ticket_type] = Number(row.count);
        });
        setTypeVolumes(volumes);
      }
    };
    fetchAnalytics();
  }, []);

  // Fetch Paginated Filtered Tickets
  const fetchTickets = useCallback(async (isLoadMore = false) => {
    setIsLoadingList(true);

    const start = isLoadMore ? (page + 1) * 20 : 0;
    const end = start + 19;

    try {
      let query = supabase.from('tickets').select('*').order('created_at', { ascending: false }).range(start, end);

      if (typeFilter !== 'All') {
        query = query.eq('ticket_type', typeFilter);
      }
      if (stageFilter !== 'All Stages') {
        query = query.eq('stage', stageFilter);
      }

      const { data: ticketsData, error } = await query;

      if (error) throw error;

      if (ticketsData) {
        // Fetch missing leads
        const missingLeadIds = [...new Set(ticketsData.map(t => t.lead_id))].filter(id => !leadsCache[id]);
        if (missingLeadIds.length > 0) {
          const { data: leadsData } = await supabase.from('leads').select('*').in('id', missingLeadIds);
          if (leadsData) {
            const newCache = { ...leadsCache };
            leadsData.forEach(l => { newCache[l.id] = l as Lead; });
            setLeadsCache(newCache);
          }
        }

        if (isLoadMore) {
          setFilteredTickets(prev => [...prev, ...ticketsData as Ticket[]]);
          setPage(prev => prev + 1);
        } else {
          setFilteredTickets(ticketsData as Ticket[]);
          setPage(0);
        }

        setHasMore(ticketsData.length === 20);
      }
    } catch (e: any) {
      toast.error(`Error fetching list: ${e.message}`);
    } finally {
      setIsLoadingList(false);
    }
  }, [typeFilter, stageFilter, leadsCache, page]);

  useEffect(() => {
    fetchTickets(false);
  }, [typeFilter, stageFilter]);

  // Keep local filteredTickets in sync with global store updates
  useEffect(() => {
    setFilteredTickets(prev => prev.map(t => {
      const updated = tickets.find(storeTicket => storeTicket.id === t.id);
      return updated ? updated : t;
    }));
  }, [tickets]);

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* 1. Analytics Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <PieChart size={20} className="text-[#08BD7E]" /> Ticket Volume by Problem Type
          </h2>
          <button
            onClick={() => {
              setPreselectedTicketStage('Pending');
              setCreateTicketOpen(true);
            }}
            className="px-4 py-2 bg-[#08BD7E] text-white hover:bg-[#08BD7E]/95 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Create Ticket
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {ticketTypes.map(type => (
            <div
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm ${typeFilter === type
                  ? 'border-[#08BD7E] bg-[#08BD7E]/5'
                  : 'hover:border-[#08BD7E]/50'
                }`}
              style={{
                backgroundColor: typeFilter === type ? undefined : 'var(--bg-panel)',
                borderColor: typeFilter === type ? '#08BD7E' : 'var(--border-base)'
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider truncate mb-1" style={{ color: 'var(--text-muted)' }} title={type}>
                {type}
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {typeVolumes[type] || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Advanced Filtering */}
      <div
        className="p-5 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-4 items-center justify-between"
        style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-base)' }}
      >
        <div className="flex items-center gap-2">
          <Filter size={18} style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Advanced Filters</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="w-full sm:w-48">
            <CustomSelect
              value={typeFilter}
              onChange={(val) => setTypeFilter(val)}
              options={[
                { label: 'All Ticket Types', value: 'All' },
                ...ticketTypes.map(t => ({ label: t, value: t }))
              ]}
              className="bg-transparent"
            />
          </div>

          <div className="w-full sm:w-48">
            <CustomSelect
              value={stageFilter}
              onChange={(val) => setStageFilter(val)}
              options={[
                { label: 'All Stages', value: 'All Stages' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Resolved', value: 'Resolved' }
              ]}
              className="bg-transparent"
            />
          </div>

          {(typeFilter !== 'All' || stageFilter !== 'All Stages') && (
            <button
              onClick={() => {
                setTypeFilter('All');
                setStageFilter('All Stages');
              }}
              className="text-xs font-semibold hover:text-red-500 transition-colors whitespace-nowrap px-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Summarized List View */}
      <div
        className="border rounded-2xl p-5 shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-base)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Filtered Tickets List</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing {filteredTickets.length} ticket{filteredTickets.length !== 1 && 's'} matching criteria
            </p>
          </div>
          <div className="p-2 bg-[#08BD7E]/10 text-[#08BD7E] rounded-xl">
            <TicketIcon size={20} />
          </div>
        </div>

        <div className="divide-y max-h-[600px] overflow-y-auto pr-1" style={{ borderColor: 'var(--border-base)' }}>
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => {
              const lead = getLeadInfo(ticket.lead_id);
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between rounded-xl px-3 -mx-3 cursor-pointer transition-colors group gap-4 hover:bg-[#08BD7E]/5"
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getPriorityColor(ticket.priority_level)}`}>
                        {ticket.priority_level} ({ticket.priority_score})
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                        style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-muted)', borderColor: 'var(--border-base)' }}
                      >
                        {ticket.ticket_type}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold border text-[#08BD7E] bg-[#08BD7E]/10 border-[#08BD7E]/20"
                      >
                        {ticket.stage}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold truncate group-hover:text-[#08BD7E] transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {ticket.title}
                    </h4>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      Parent: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{lead?.parent_name || 'N/A'}</span> •
                      Student: <span className="font-medium" style={{ color: 'var(--text-primary)' }}> {lead?.student_name || 'N/A'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {/* Quick Actions */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTicket(ticket.id, { is_recurring: !ticket.is_recurring });
                      }}
                      className={`p-1.5 rounded-full transition-colors ${ticket.is_recurring ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                      title={ticket.is_recurring ? "Recurring Ticket" : "Mark as Recurring"}
                    >
                      <Star size={18} fill={ticket.is_recurring ? "currentColor" : "none"} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStage = ticket.stage === 'Resolved' ? 'Pending' : 'Resolved';
                        updateTicket(ticket.id, { stage: newStage });
                      }}
                      className={`p-1.5 rounded-full transition-colors flex items-center gap-1 font-medium ${ticket.stage === 'Resolved' ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                    >
                      {ticket.stage === 'Resolved' ? <CheckCircle size={18} /> : <Circle size={18} />}
                      <span className="hidden sm:inline">{ticket.stage === 'Resolved' ? 'Resolved' : 'Resolve'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 w-24">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-base)' }}
                      >
                        {getUserName(ticket.assigned_to).charAt(0)}
                      </div>
                      <span className="truncate">{getUserName(ticket.assigned_to).split(' ')[0]}</span>
                    </div>
                    <ChevronRight size={16} className="group-hover:text-[#08BD7E] transition-colors" style={{ color: 'var(--border-base)' }} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              No tickets found matching the current filters.
            </div>
          )}

          {hasMore && (
            <div className="py-4 flex justify-center">
              <button
                onClick={() => fetchTickets(true)}
                disabled={isLoadingList}
                className="px-6 py-2 text-sm font-semibold rounded-full border transition-all hover:bg-[#08BD7E]/5 text-[#08BD7E] border-[#08BD7E]/30 flex items-center gap-2"
              >
                {isLoadingList ? <Loader2 size={16} className="animate-spin" /> : 'Load More Tickets'}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
