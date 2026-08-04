import { create } from 'zustand';
import { PriorityRule, calculatePriority, EvaluationContext } from './priorityEngine';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

const supabase = createClient();

// --- Type Definitions ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'counselor';
  avatar_url?: string;
  settings?: {
    sidebar_collapsed?: boolean;
    last_read_activities_at?: string;
    cleared_activities_at?: string;
  };
}

export interface Lead {
  id: string;
  parent_name: string;
  student_name: string;
  phone: string;
  email: string;
  source: string;
  estimated_value: number;
  assigned_to: string; // user id
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  lead_id: string;
  title: string;
  description: string;
  ticket_type: string;
  stage:
  | 'New Leads'
  | 'Contacted'
  | 'Session Scheduled'
  | 'Session Completed'
  | 'Follow Up'
  | 'Interested'
  | 'Payment Pending'
  | 'Converted'
  | 'Closed'
  | 'Dropped'
  | 'Pending'
  | 'Resolved';
  priority_level: 'Critical' | 'High' | 'Medium' | 'Low';
  priority_score: number;
  due_date: string;
  session_date?: string;
  reminder_at?: string;
  assigned_to: string;
  is_recurring?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  ticket_id: string;
  title: string;
  completed: boolean;
  due_date?: string;
  auto_generated: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  ticket_id?: string;
  lead_id?: string;
  type: string;
  message: string;
  created_by: string; // user name or id
  created_at: string;
}

export interface Note {
  id: string;
  lead_id: string;
  content: string;
  created_by: string; // user name or id
  created_at: string;
}

interface AppState {
  users: User[];
  leads: Lead[];
  tickets: Ticket[];
  tasks: Task[];
  rules: PriorityRule[];
  activities: Activity[];
  notes: Note[];
  ticketTypes: string[];
  currentUser: User | null;
  isLoading: boolean;
  hasMoreLeads: boolean;
  hasMoreTickets: boolean;
  leadsPage: number;
  ticketsPage: number;

  // UI State
  activeTab: 'dashboard' | 'tickets-dashboard' | 'leads-kanban' | 'tickets-kanban' | 'leads' | 'rules';
  selectedTicketId: string | null;
  isCreateLeadOpen: boolean;
  isCreateTicketOpen: boolean;
  isSearchOpen: boolean;
  unreadActivities: number;
  isCollapsed: boolean;
  isProfileOpen: boolean;
  preselectedLeadId: string | null;
  preselectedTicketStage: Ticket['stage'] | null;
  isDarkMode: boolean;

  // Actions
  setupSubscriptions: () => void;
  fetchData: () => Promise<void>;
  loadMoreLeads: () => Promise<void>;
  loadMoreTickets: () => Promise<void>;
  setActiveTab: (tab: 'dashboard' | 'tickets-dashboard' | 'leads-kanban' | 'tickets-kanban' | 'leads' | 'rules') => void;
  setSelectedTicketId: (id: string | null) => void;
  setCreateLeadOpen: (open: boolean) => void;
  setCreateTicketOpen: (open: boolean) => void;
  setIsSearchOpen: (open: boolean) => void;
  setUnreadActivities: (count: number) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  setPreselectedLeadId: (id: string | null) => void;
  setPreselectedTicketStage: (stage: Ticket['stage'] | null) => void;
  toggleDarkMode: () => void;
  updateUserSettings: (settings: Partial<NonNullable<User['settings']>>) => Promise<void>;
  subscribeToActivities: () => void;

  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;

  addTicket: (ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'priority_score' | 'priority_level'>) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  moveTicketStage: (ticketId: string, newStage: Ticket['stage']) => Promise<void>;

  addTask: (task: Omit<Task, 'id' | 'created_at' | 'completed'>) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  addRule: (rule: Omit<PriorityRule, 'id'>) => Promise<void>;
  updateRule: (id: string, updates: Partial<PriorityRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;

  addNote: (leadId: string, content: string) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'created_at' | 'created_by'>) => Promise<void>;

  addTicketType: (name: string) => Promise<void>;
  removeTicketType: (name: string) => Promise<void>;

  recalculateAllPriorities: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateUserData: (userId: string, updates: Partial<User>) => Promise<void>;
  clearAllActivities: () => Promise<void>;
  signOut: () => Promise<void>;
}

// --- Helper function for dynamic score recalculation ---
function evaluatePriorityHelper(ticket: Ticket, lead: Lead | undefined, rules: PriorityRule[]): { score: number; level: Ticket['priority_level'] } {
  if (!lead) return { score: 0, level: 'Medium' };

  const lastContactDate = new Date(ticket.updated_at || Date.now());
  const daysSinceLastContact = Math.floor((Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));

  let daysToSession = -999;
  if (ticket.session_date) {
    const sessionTime = new Date(ticket.session_date);
    const diffTime = sessionTime.getTime() - Date.now();
    daysToSession = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysToSession < 0 && Math.abs(daysToSession) <= 0.5) daysToSession = 0; // Today
  }

  const context: EvaluationContext = {
    estimated_value: lead.estimated_value,
    stage: ticket.stage,
    ticket_type: ticket.ticket_type,
    days_since_last_contact: daysSinceLastContact >= 0 ? daysSinceLastContact : 0,
    days_to_session: daysToSession
  };

  return calculatePriority(rules, context);
}

// --- Dynamic Task Templates Generator ---
function generateTasksForStage(ticketId: string, stage: Ticket['stage']): Omit<Task, 'id' | 'created_at' | 'completed'>[] {
  const tasks: Omit<Task, 'id' | 'created_at' | 'completed'>[] = [];

  switch (stage) {
    case 'Session Scheduled':
      tasks.push(
        { ticket_id: ticketId, title: 'Confirm educator availability', auto_generated: true },
        { ticket_id: ticketId, title: 'Send calendar invite & Zoom link to parent', auto_generated: true },
        { ticket_id: ticketId, title: 'Send WhatsApp confirmation reminder', auto_generated: true }
      );
      break;
    case 'Session Completed':
      tasks.push(
        { ticket_id: ticketId, title: 'Collect session feedback from teacher', auto_generated: true },
        { ticket_id: ticketId, title: 'Collect session feedback from student/parent', auto_generated: true },
        { ticket_id: ticketId, title: 'Upload diagnostic performance analysis report', auto_generated: true }
      );
      break;
    case 'Payment Pending':
      tasks.push(
        { ticket_id: ticketId, title: 'Generate invoice & bank transfer account details', auto_generated: true },
        { ticket_id: ticketId, title: 'Send payment reminder via WhatsApp', auto_generated: true },
        { ticket_id: ticketId, title: 'Verify received slip with accounts team', auto_generated: true }
      );
      break;
    case 'Converted':
      tasks.push(
        { ticket_id: ticketId, title: 'Create student portal LMS account', auto_generated: true },
        { ticket_id: ticketId, title: 'Add student to active Slack/WhatsApp cohort', auto_generated: true },
        { ticket_id: ticketId, title: 'Schedule parent onboarding call', auto_generated: true }
      );
      break;
  }
  return tasks;
}

// --- Zustand Store Implementation ---
export const useStore = create<AppState>((set, get) => ({
  users: [],
  leads: [],
  tickets: [],
  tasks: [],
  rules: [],
  activities: [],
  notes: [],
  ticketTypes: [],
  currentUser: null,
  isLoading: true,
  hasMoreLeads: true,
  hasMoreTickets: true,
  leadsPage: 0,
  ticketsPage: 0,

  // UI State Defaults
  activeTab: 'dashboard',
  selectedTicketId: null,
  isCreateLeadOpen: false,
  isCreateTicketOpen: false,
  isSearchOpen: false,
  unreadActivities: 0,
  isCollapsed: false,
  isProfileOpen: false,
  preselectedLeadId: null,
  preselectedTicketStage: null,
  isDarkMode: false,

  // Actions
  setIsSearchOpen: (open) => set({ isSearchOpen: open }),

  setIsCollapsed: (collapsed) => {
    set({ isCollapsed: collapsed });
    const { updateUserSettings } = get();
    updateUserSettings({ sidebar_collapsed: collapsed });
  },

  updateUserSettings: async (newSettings) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const updatedSettings = {
      ...(currentUser.settings || {}),
      ...newSettings
    };

    // Update local store state
    set({
      currentUser: {
        ...currentUser,
        settings: updatedSettings
      }
    });

    // Save to Supabase (User Settings Column)
    const { error } = await supabase
      .from('users')
      .update({ settings: updatedSettings })
      .eq('id', currentUser.id);

    if (error) {
      console.warn('Failed to save settings to Supabase (column might not exist yet), falling back to localStorage:', error.message);
      try {
        localStorage.setItem(`user_settings_${currentUser.id}`, JSON.stringify(updatedSettings));
      } catch (e) {
        console.error('LocalStorage write error:', e);
      }
    }
  },

  setUnreadActivities: (count) => {
    set({ unreadActivities: count });
    if (count === 0) {
      const { updateUserSettings } = get();
      updateUserSettings({ last_read_activities_at: new Date().toISOString() });
    }
  },

  subscribeToActivities: () => {
    supabase.channel('activities_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        (payload) => {
          const newActivity = payload.new as Activity;
          const { activities, unreadActivities } = get();

          // Only process if it's a new activity (avoid duplicates)
          if (!activities.find(a => a.id === newActivity.id)) {
            set({
              activities: [newActivity, ...activities],
              unreadActivities: unreadActivities + 1
            });

            // Dispatch a custom event to trigger sonner toast globally
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('new_activity', { detail: newActivity }));
            }
          }
        }
      )
      .subscribe();
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedTicketId: (id) => set({ selectedTicketId: id }),
  setCreateLeadOpen: (open) => set({ isCreateLeadOpen: open }),
  setCreateTicketOpen: (open) => set({ isCreateTicketOpen: open }),
  setProfileOpen: (open) => set({ isProfileOpen: open }),
  setPreselectedLeadId: (id) => set({ preselectedLeadId: id }),
  setPreselectedTicketStage: (stage) => set({ preselectedTicketStage: stage }),
  toggleDarkMode: () => {
    const current = get().isDarkMode;
    const next = !current;
    set({ isDarkMode: next });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('crm-dark-mode', String(next));
    }
  },

  setupSubscriptions: () => {
    supabase.channel('public:leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          set((state) => ({ leads: [payload.new as Lead, ...state.leads] }));
        } else if (payload.eventType === 'UPDATE') {
          set((state) => ({ leads: state.leads.map(l => l.id === payload.new.id ? payload.new as Lead : l) }));
        } else if (payload.eventType === 'DELETE') {
          set((state) => ({ leads: state.leads.filter(l => l.id !== payload.old.id) }));
        }
      })
      .subscribe();

    supabase.channel('public:tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          set((state) => ({ tickets: [payload.new as Ticket, ...state.tickets] }));
        } else if (payload.eventType === 'UPDATE') {
          set((state) => ({ tickets: state.tickets.map(t => t.id === payload.new.id ? payload.new as Ticket : t) }));
        } else if (payload.eventType === 'DELETE') {
          set((state) => ({ tickets: state.tickets.filter(t => t.id !== payload.old.id) }));
        }
      })
      .subscribe();

    supabase.channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          set((state) => ({ tasks: [payload.new as Task, ...state.tasks] }));
        } else if (payload.eventType === 'UPDATE') {
          set((state) => ({ tasks: state.tasks.map(t => t.id === payload.new.id ? payload.new as Task : t) }));
        } else if (payload.eventType === 'DELETE') {
          set((state) => ({ tasks: state.tasks.filter(t => t.id !== payload.old.id) }));
        }
      })
      .subscribe();
  },

  fetchData: async () => {
    set({ isLoading: true, leadsPage: 0, ticketsPage: 0 });
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        set({ isLoading: false });
        return;
      }

      // Fetch all tables with limits for large ones
      const results = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('leads').select('*').eq('status', 'active').order('created_at', { ascending: false }).range(0, 49),
        supabase.from('tickets').select('*').not('stage', 'in', '("Closed","Dropped","Converted")').order('created_at', { ascending: false }).range(0, 49),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('priority_rules').select('*').order('created_at', { ascending: false }),
        supabase.from('activities').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').order('created_at', { ascending: true }),
        supabase.from('ticket_types').select('name').order('created_at', { ascending: true })
      ]);

      const users = results[0].data;
      const leads = results[1].data;
      const tickets = results[2].data;
      const tasks = results[3].data;
      const rules = results[4].data;
      const activities = results[5].data;
      const notes = results[6].data || [];
      const ticketTypesRes = results[7];
      const fetchedTicketTypes = ticketTypesRes && !ticketTypesRes.error
        ? ticketTypesRes.data.map((row: any) => row.name)
        : ['Scheduling', 'Rescheduling', 'Admission Inquiry', 'Payment Issue', 'e-book related problem', 'demo booking problem'];

      let currentUser = users?.find(u => u.id === authData.user.id) || null;

      // Auto-provision user if triggers haven't executed yet
      if (!currentUser && authData.user) {
        const { data: newUser, error: insertError } = await supabase.from('users').insert({
          id: authData.user.id,
          name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || 'Unknown User',
          email: authData.user.email,
          avatar_url: authData.user.user_metadata?.avatar_url,
          role: 'counselor'
        }).select().single();

        if (!insertError && newUser) {
          currentUser = newUser;
        }
      }

      // Handle user settings hydration (gracefully checking fallback)
      if (currentUser) {
        if (!currentUser.settings) {
          try {
            const localSaved = localStorage.getItem(`user_settings_${currentUser.id}`);
            if (localSaved) {
              currentUser.settings = JSON.parse(localSaved);
            } else {
              currentUser.settings = {};
            }
          } catch {
            currentUser.settings = {};
          }
        }
      }

      // Calculate unread activities count based on last read timestamp and filter cleared ones
      let filteredActivities = activities || [];
      if (currentUser?.settings?.cleared_activities_at) {
        const clearedTime = new Date(currentUser.settings.cleared_activities_at).getTime();
        filteredActivities = filteredActivities.filter(a => new Date(a.created_at).getTime() > clearedTime);
      }

      let unreadCount = 0;
      if (filteredActivities.length > 0 && currentUser) {
        const lastRead = currentUser.settings?.last_read_activities_at;
        if (lastRead) {
          const lastReadDate = new Date(lastRead);
          unreadCount = filteredActivities.filter(a => new Date(a.created_at) > lastReadDate).length;
        } else {
          // default to last 5 if no timestamp
          unreadCount = Math.min(filteredActivities.length, 5);
        }
      }

      set({
        users: users || [],
        leads: leads || [],
        tickets: tickets || [],
        tasks: tasks || [],
        rules: rules || [],
        activities: filteredActivities,
        notes: notes,
        ticketTypes: fetchedTicketTypes,
        currentUser,
        unreadActivities: unreadCount,
        hasMoreLeads: (leads || []).length === 50,
        hasMoreTickets: (tickets || []).length === 50,
        isCollapsed: currentUser?.settings?.sidebar_collapsed ?? false,
        isLoading: false
      });
      get().setupSubscriptions();
    } catch (error) {
      toast.error('Error fetching initial data');
      console.error('Error fetching data:', error);
      set({ isLoading: false });
    }
  },

  loadMoreLeads: async () => {
    const { leadsPage, leads } = get();
    const nextPage = leadsPage + 1;
    const start = nextPage * 50;
    const end = start + 49;

    try {
      const { data, error } = await supabase.from('leads')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      if (data) {
        set({
          leads: [...leads, ...data],
          leadsPage: nextPage,
          hasMoreLeads: data.length === 50
        });
      }
    } catch (e: any) {
      toast.error(`Failed to load more leads: ${e.message}`);
    }
  },

  loadMoreTickets: async () => {
    const { ticketsPage, tickets } = get();
    const nextPage = ticketsPage + 1;
    const start = nextPage * 50;
    const end = start + 49;

    try {
      const { data, error } = await supabase.from('tickets')
        .select('*')
        .not('stage', 'in', '("Closed","Dropped","Converted")')
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      if (data) {
        set({
          tickets: [...tickets, ...data],
          ticketsPage: nextPage,
          hasMoreTickets: data.length === 50
        });
      }
    } catch (e: any) {
      toast.error(`Failed to load more tickets: ${e.message}`);
    }
  },

  addLead: async (leadData) => {
    try {
      const { data, error } = await supabase.from('leads').insert([leadData]).select().single();
      if (error) {
        toast.error(`Failed to add lead: ${error.message}`);
        console.error('Add lead error:', error);
        return;
      }
      set({ leads: [data, ...get().leads] });

      // Log Activity
      await get().addActivity({
        lead_id: data.id,
        type: 'ticket_created',
        message: `Lead manually added for parent ${data.parent_name} (Student: ${data.student_name})`
      });

      // Automatically create a Lead Ticket for the Kanban board
      await get().addTicket({
        lead_id: data.id,
        title: 'Initial Lead Inquiry',
        description: 'System generated ticket for new lead',
        ticket_type: 'Lead',
        stage: 'New Leads',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: leadData.assigned_to,
      });

      toast.success('Lead added successfully!');
    } catch (e) {
      toast.error('An unexpected error occurred while adding lead.');
    }
  },

  updateLead: async (id, updates) => {
    try {
      const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
      if (error) {
        toast.error(`Failed to update lead: ${error.message}`);
        return;
      }

      set({ leads: get().leads.map(l => l.id === id ? data : l) });
      get().recalculateAllPriorities();
      toast.success('Lead updated successfully!');
    } catch (e) {
      toast.error('An unexpected error occurred while updating lead.');
    }
  },

  addTicket: async (ticketData) => {
    try {
      const tempTicket = { ...ticketData, priority_level: 'Medium' as const, priority_score: 0 };
      const lead = get().leads.find(l => l.id === ticketData.lead_id);
      const { score, level } = evaluatePriorityHelper(tempTicket as unknown as Ticket, lead, get().rules);

      const newTicket = { ...ticketData, priority_level: level, priority_score: score };

      const { data, error } = await supabase.from('tickets').insert([newTicket]).select().single();
      if (error) {
        toast.error(`Failed to create ticket: ${error.message}`);
        console.error('Add ticket error:', error);
        return;
      }

      set({ tickets: [data, ...get().tickets] });

      // Generate initial tasks
      const stageTasks = generateTasksForStage(data.id, data.stage);
      for (const task of stageTasks) {
        await get().addTask(task);
      }

      // Log Activity
      await get().addActivity({
        ticket_id: data.id,
        lead_id: data.lead_id,
        type: 'ticket_created',
        message: `Ticket "${data.title}" created in stage ${data.stage}`
      });

      toast.success('Ticket created successfully!');
    } catch (e) {
      toast.error('An unexpected error occurred while creating the ticket.');
    }
  },

  updateTicket: async (id, updates) => {
    try {
      const ticket = get().tickets.find(t => t.id === id);
      if (!ticket) return;

      const merged = { ...ticket, ...updates };
      const lead = get().leads.find(l => l.id === merged.lead_id);
      const { score, level } = evaluatePriorityHelper(merged as unknown as Ticket, lead, get().rules);

      const { data, error } = await supabase.from('tickets').update({
        ...updates,
        priority_score: score,
        priority_level: level
      }).eq('id', id).select().single();

      if (error) {
        toast.error(`Failed to update ticket: ${error.message}`);
        return;
      }

      set({ tickets: get().tickets.map(t => t.id === id ? data : t) });
      toast.success('Ticket updated successfully!');
    } catch (e) {
      toast.error('An unexpected error occurred while updating the ticket.');
    }
  },

  moveTicketStage: async (ticketId, newStage) => {
    try {
      const ticket = get().tickets.find(t => t.id === ticketId);
      if (!ticket || ticket.stage === newStage) return;
      const oldStage = ticket.stage;

      // Optimistic update
      const merged = { ...ticket, stage: newStage };
      const lead = get().leads.find(l => l.id === ticket.lead_id);
      const { score, level } = evaluatePriorityHelper(merged as unknown as Ticket, lead, get().rules);

      set({
        tickets: get().tickets.map(t => t.id === ticketId ? { ...t, stage: newStage, priority_score: score, priority_level: level } : t)
      });

      const { error } = await supabase.from('tickets').update({ stage: newStage, priority_score: score, priority_level: level }).eq('id', ticketId).select().single();
      if (error) {
        // Rollback
        set({ tickets: get().tickets.map(t => t.id === ticketId ? ticket : t) });
        toast.error(`Failed to move ticket: ${error.message}`);
        return;
      }

      const stageTasks = generateTasksForStage(ticketId, newStage);
      for (const task of stageTasks) {
        await get().addTask(task);
      }

      await get().addActivity({
        ticket_id: ticketId,
        lead_id: ticket.lead_id,
        type: 'stage_changed',
        message: `Stage moved from "${oldStage}" to "${newStage}"`
      });

      toast.success(`Ticket moved to ${newStage}`);
    } catch (e) {
      toast.error('An unexpected error occurred while moving the ticket.');
    }
  },

  addTask: async (taskData) => {
    try {
      const { data, error } = await supabase.from('tasks').insert([{ ...taskData, completed: false }]).select().single();
      if (error) {
        toast.error(`Failed to add task: ${error.message}`);
        return;
      }
      set({ tasks: [...get().tasks, data] });
    } catch (e) {
      toast.error('An unexpected error occurred while adding task.');
    }
  },

  toggleTask: async (taskId) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;

      const newStatus = !task.completed;

      // Optimistic update
      set({ tasks: get().tasks.map(t => t.id === taskId ? { ...t, completed: newStatus } : t) });

      const { error } = await supabase.from('tasks').update({ completed: newStatus }).eq('id', taskId);
      if (error) {
        // rollback
        set({ tasks: get().tasks.map(t => t.id === taskId ? { ...t, completed: !newStatus } : t) });
        toast.error(`Failed to update task: ${error.message}`);
        return;
      }

      await get().addActivity({
        ticket_id: task.ticket_id,
        type: 'task_completed',
        message: `Task checklist item "${task.title}" marked as ${newStatus ? 'completed' : 'incomplete'}`
      });
    } catch (e) {
      toast.error('An unexpected error occurred while toggling task.');
    }
  },

  deleteTask: async (taskId) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) {
        toast.error(`Failed to delete task: ${error.message}`);
        return;
      }
      set({ tasks: get().tasks.filter(t => t.id !== taskId) });
    } catch (e) {
      toast.error('An unexpected error occurred while deleting task.');
    }
  },

  addRule: async (ruleData) => {
    try {
      const { data, error } = await supabase.from('priority_rules').insert([ruleData]).select().single();
      if (error) {
        toast.error(`Failed to add rule: ${error.message}`);
        return;
      }
      set({ rules: [...get().rules, data] });
      get().recalculateAllPriorities();
      toast.success('Priority rule added.');
    } catch (e) {
      toast.error('An unexpected error occurred while adding rule.');
    }
  },

  updateRule: async (id, updates) => {
    try {
      const { data, error } = await supabase.from('priority_rules').update(updates).eq('id', id).select().single();
      if (error) {
        toast.error(`Failed to update rule: ${error.message}`);
        return;
      }
      set({ rules: get().rules.map(r => r.id === id ? data : r) });
      get().recalculateAllPriorities();
      toast.success('Priority rule updated.');
    } catch (e) {
      toast.error('An unexpected error occurred while updating rule.');
    }
  },

  deleteRule: async (id) => {
    try {
      const { error } = await supabase.from('priority_rules').delete().eq('id', id);
      if (error) {
        toast.error(`Failed to delete rule: ${error.message}`);
        return;
      }
      set({ rules: get().rules.filter(r => r.id !== id) });
      get().recalculateAllPriorities();
      toast.success('Priority rule deleted.');
    } catch (e) {
      toast.error('An unexpected error occurred while deleting rule.');
    }
  },

  addNote: async (leadId, content) => {
    try {
      const currentUser = get().currentUser;
      const { data, error } = await supabase.from('notes').insert([{
        lead_id: leadId,
        content,
        created_by: currentUser?.id
      }]).select().single();
      if (error) {
        toast.error(`Failed to add note: ${error.message}`);
        return;
      }

      set({ notes: [data, ...get().notes] });

      await get().addActivity({
        lead_id: leadId,
        type: 'note_added',
        message: `Added new note: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`
      });
      toast.success('Note added.');
    } catch (e) {
      toast.error('An unexpected error occurred while adding note.');
    }
  },

  addActivity: async (activityData) => {
    const currentUser = get().currentUser;
    const { data, error } = await supabase.from('activities').insert([{
      ...activityData,
      created_by: currentUser?.id
    }]).select().single();
    if (error) return;

    set({ activities: [data, ...get().activities] });
  },

  recalculateAllPriorities: () => {
    const rules = get().rules;
    const leads = get().leads;
    const tickets = get().tickets;

    const updatedTickets = tickets.map(t => {
      const lead = leads.find(l => l.id === t.lead_id);
      const { score, level } = evaluatePriorityHelper(t, lead, rules);
      if (t.priority_score !== score || t.priority_level !== level) {
        // Queue an async update in background
        supabase.from('tickets').update({ priority_score: score, priority_level: level }).eq('id', t.id).then();
        return { ...t, priority_score: score, priority_level: level };
      }
      return t;
    });

    set({ tickets: updatedTickets });
  },

  addTicketType: async (name: string) => {
    try {
      const { error } = await supabase
        .from('ticket_types')
        .insert([{ name }]);

      if (error) throw error;

      set((state) => ({
        ticketTypes: [...state.ticketTypes, name]
      }));
      toast.success(`Ticket type "${name}" added successfully.`);
    } catch (error: any) {
      toast.error(`Error adding ticket type: ${error.message}`);
    }
  },

  removeTicketType: async (name: string) => {
    try {
      const { error } = await supabase
        .from('ticket_types')
        .delete()
        .eq('name', name);

      if (error) throw error;

      set((state) => ({
        ticketTypes: state.ticketTypes.filter(t => t !== name)
      }));
      toast.success(`Ticket type "${name}" removed successfully.`);
    } catch (error: any) {
      toast.error(`Error removing ticket type: ${error.message}`);
    }
  },

  updateProfile: async (updates) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', currentUser.id);

    if (!error) {
      set({
        currentUser: {
          ...currentUser,
          ...updates
        }
      });
      // Also update in users list
      const { users } = get();
      set({
        users: users.map(u => u.id === currentUser.id ? { ...u, ...updates } : u)
      });
      toast.success('Profile updated.');
    } else {
      toast.error(`Error updating profile: ${error.message}`);
    }
  },

  updateUserData: async (userId, updates) => {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (!error) {
      const { users, currentUser } = get();
      set({
        users: users.map(u => u.id === userId ? { ...u, ...updates } : u)
      });

      // If we updated ourselves, reflect it
      if (currentUser?.id === userId) {
        set({
          currentUser: {
            ...currentUser,
            ...updates
          }
        });
      }
      toast.success('User data updated.');
    } else {
      toast.error(`Error updating user data: ${error.message}`);
    }
  },

  clearAllActivities: async () => {
    const { updateUserSettings } = get();
    const now = new Date().toISOString();
    await updateUserSettings({ cleared_activities_at: now, last_read_activities_at: now });
    set({ activities: [], unreadActivities: 0 });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      currentUser: null,
      users: [],
      leads: [],
      tickets: [],
      tasks: [],
      rules: [],
      activities: [],
      notes: [],
      selectedTicketId: null,
      activeTab: 'dashboard',
    });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
}));
