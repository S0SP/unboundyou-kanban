'use client';

import React, { useState, useEffect } from 'react';
import { useStore, Ticket, Lead } from '@/lib/useStore';
import { 
  Plus, 
  CheckSquare, 
  Calendar, 
  MoreVertical
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { CustomSelect } from '@/components/CustomSelect';
import { Loader2 } from 'lucide-react';

const STAGES: Ticket['stage'][] = [
  'New Leads', 
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

interface TicketCardProps {
  ticket: Ticket;
  index: number;
  lead?: Lead;
  progress: string | null;
  getPriorityBadgeClass: (level: Ticket['priority_level']) => string;
  moveTicketStage: (id: string, stage: Ticket['stage']) => void;
  setSelectedTicketId: (id: string) => void;
}

const TicketCard = React.memo(({ 
  ticket, 
  index, 
  lead, 
  progress, 
  getPriorityBadgeClass, 
  moveTicketStage, 
  setSelectedTicketId 
}: TicketCardProps) => {
  return (
    <Draggable draggableId={ticket.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => setSelectedTicketId(ticket.id)}
          className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition-all select-none group relative ${
            snapshot.isDragging ? 'shadow-lg border-primary border' : 'hover:border-primary/20'
          }`}
          style={{ backgroundColor: 'var(--bg-panel)', borderColor: snapshot.isDragging ? undefined : 'var(--border-base)', ...provided.draggableProps.style }}
        >
          {/* Priority level */}
          <div className="flex justify-between items-start gap-2 mb-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getPriorityBadgeClass(ticket.priority_level)}`}>
              {ticket.priority_level} ({ticket.priority_score})
            </span>
            
            <div className="relative w-32">
              <CustomSelect 
                value={ticket.stage}
                onChange={(val) => moveTicketStage(ticket.id, val as Ticket['stage'])}
                className="h-6 text-[10px] px-2 py-0 border-transparent shadow-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                options={STAGES.map(s => ({label: s, value: s}))}
              />
            </div>
          </div>

          <h4 className="text-sm font-bold text-gray-800 leading-snug group-hover:text-primary transition-colors mb-1">
            {ticket.title}
          </h4>
          
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">
            {ticket.description || 'No description provided.'}
          </p>

          <div className="border-t border-gray-50 my-2.5" />

          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <div className="truncate pr-2">
              <span className="font-semibold text-gray-600 truncate">{lead?.student_name}</span>
              <span className="text-[10px] text-gray-300 block">Parent: {lead?.parent_name}</span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 font-medium">
              {progress && (
                <div className="flex items-center gap-1">
                  <CheckSquare size={11} className="text-gray-400" />
                  <span>{progress}</span>
                </div>
              )}
              {ticket.session_date && (
                <div className="flex items-center gap-1 text-[#08BD7E] bg-[#08BD7E]/5 px-1.5 py-0.5 rounded">
                  <Calendar size={11} />
                  <span>{new Date(ticket.session_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});
TicketCard.displayName = 'TicketCard';

export default function KanbanBoard({ boardType }: { boardType: 'leads' | 'tickets' }) {
  const { 
    tickets, leads, tasks, moveTicketStage, setSelectedTicketId, setCreateTicketOpen, setPreselectedTicketStage,
    hasMoreLeads, loadMoreLeads, hasMoreTickets, loadMoreTickets
  } = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const ticketsByStage = React.useMemo(() => {
    const grouped: Record<string, Ticket[]> = {};
    STAGES.forEach(s => grouped[s] = []);
    tickets.forEach(t => {
      const isLeadBoard = t.ticket_type === 'Lead' || t.ticket_type === 'Admission Inquiry';
      if ((boardType === 'leads' && isLeadBoard) || (boardType === 'tickets' && !isLeadBoard)) {
        if (grouped[t.stage]) {
          grouped[t.stage].push(t);
        }
      }
    });
    return grouped;
  }, [tickets, boardType]);

  const leadsCache = React.useMemo(() => {
    const cache: Record<string, Lead> = {};
    leads.forEach(l => { cache[l.id] = l; });
    return cache;
  }, [leads]);

  const tasksProgressCache = React.useMemo(() => {
    const cache: Record<string, string | null> = {};
    tickets.forEach(t => {
      const ticketTasks = tasks.filter(task => task.ticket_id === t.id);
      if (ticketTasks.length === 0) {
        cache[t.id] = null;
      } else {
        const completed = ticketTasks.filter(task => task.completed).length;
        cache[t.id] = `${completed}/${ticketTasks.length}`;
      }
    });
    return cache;
  }, [tasks, tickets]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    if (boardType === 'leads') {
      await loadMoreLeads();
    } else {
      await loadMoreTickets();
    }
    setIsLoadingMore(false);
  };

  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveTicketStage(draggableId, destination.droppableId as Ticket['stage']);
  };

  const getPriorityBadgeClass = React.useCallback((level: Ticket['priority_level']) => {
    switch (level) {
      case 'Critical': return 'bg-red-50 text-red-600 border-red-100';
      case 'High': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Medium': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Low': return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  }, []);

  if (!isMounted) {
    return null; // Prevents hydration mismatch from dnd-kit/react-beautiful-dnd
  }

  return (
    <div className="h-full flex flex-col">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4 scrollbar-hide flex gap-4 pr-6 min-h-[calc(100vh-220px)] items-start">
          {STAGES.map((stage) => {
            const stageTickets = ticketsByStage[stage];
            
            return (
              <div 
                key={stage}
                className="w-72 sm:w-80 shrink-0 flex flex-col rounded-2xl border transition-all duration-200"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-base)' }}
              >
                <div 
                  className="p-4 flex items-center justify-between border-b rounded-t-2xl"
                  style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-base)' }}
                >
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-800">{stage}</h4>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-semibold">
                      {stageTickets.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setPreselectedTicketStage(stage);
                      setCreateTicketOpen(true);
                    }}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title={`Create ticket in ${stage}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-230px)] transition-colors min-h-[150px] relative ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                    >
                      {stageTickets.map((ticket, index) => {
                        const lead = leadsCache[ticket.lead_id];
                        const progress = tasksProgressCache[ticket.id];
                        
                        return (
                          <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            index={index}
                            lead={lead}
                            progress={progress}
                            getPriorityBadgeClass={getPriorityBadgeClass}
                            moveTicketStage={moveTicketStage}
                            setSelectedTicketId={setSelectedTicketId}
                          />
                        );
                      })}
                      {provided.placeholder}
                      {stageTickets.length === 0 && !snapshot.isDraggingOver && (
                        <div 
                          className="h-28 border border-dashed rounded-xl flex items-center justify-center text-xs absolute inset-x-3 mt-3"
                          style={{ borderColor: 'var(--border-strong)', color: 'var(--text-faint)' }}
                        >
                          Drag tickets here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {((boardType === 'leads' && hasMoreLeads) || (boardType === 'tickets' && hasMoreTickets)) && (
        <div className="py-2 flex justify-center sticky bottom-0 z-10" style={{ backgroundColor: 'var(--bg-app)' }}>
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2.5 text-sm font-semibold rounded-full border shadow-sm transition-all flex items-center gap-2"
            style={{ 
              backgroundColor: 'var(--bg-panel)', 
              borderColor: 'var(--border-strong)', 
              color: 'var(--text-primary)' 
            }}
          >
            {isLoadingMore ? <Loader2 size={16} className="animate-spin" /> : `Load More ${boardType === 'leads' ? 'Leads' : 'Tickets'}`}
          </button>
        </div>
      )}
    </div>
  );
}
