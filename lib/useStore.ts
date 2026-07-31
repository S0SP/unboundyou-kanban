import { create } from 'zustand';
import { PriorityRule, calculatePriority, EvaluationContext } from './priorityEngine';
import { createClient } from '@/utils/supabase/client';

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
    | 'Dropped';
  priority_level: 'Critical' | 'High' | 'Medium' | 'Low';
  priority_score: number;
  due_date: string;
  session_date?: string;
  reminder_at?: string;
  assigned_to: string;
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
  currentUser: User | null;
  isLoading: boolean;
  
  // UI State
  activeTab: 'dashboard' | 'kanban' | 'leads' | 'rules';
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
  fetchData: () => Promise<void>;
  setActiveTab: (tab: 'dashboard' | 'kanban' | 'leads' | 'rules') => void;
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
  currentUser: null,
  isLoading: true,

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

  fetchData: async () => {
    set({ isLoading: true });
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        set({ isLoading: false });
        return;
      }

      // Fetch all tables
      const [
        { data: users },
        { data: leads },
        { data: tickets },
        { data: tasks },
        { data: rules },
        { data: activities },
        { data: notes }
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('priority_rules').select('*').order('created_at', { ascending: false }),
        supabase.from('activities').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').order('created_at', { ascending: false })
      ]);

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
        notes: notes || [],
        currentUser,
        unreadActivities: unreadCount,
        isCollapsed: currentUser?.settings?.sidebar_collapsed ?? false,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      set({ isLoading: false });
    }
  },

  addLead: async (leadData) => {
    const { data, error } = await supabase.from('leads').insert([leadData]).select().single();
    if (error) {
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
  },

  updateLead: async (id, updates) => {
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) return;
    
    set({ leads: get().leads.map(l => l.id === id ? data : l) });
    get().recalculateAllPriorities();
  },

  addTicket: async (ticketData) => {
    const tempTicket = { ...ticketData, priority_level: 'Medium' as const, priority_score: 0 };
    const lead = get().leads.find(l => l.id === ticketData.lead_id);
    const { score, level } = evaluatePriorityHelper(tempTicket as unknown as Ticket, lead, get().rules);
    
    const newTicket = { ...ticketData, priority_level: level, priority_score: score };
    
    const { data, error } = await supabase.from('tickets').insert([newTicket]).select().single();
    if (error) {
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
  },

  updateTicket: async (id, updates) => {
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
    
    if (error) return;

    set({ tickets: get().tickets.map(t => t.id === id ? data : t) });
  },

  moveTicketStage: async (ticketId, newStage) => {
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
  },

  addTask: async (taskData) => {
    const { data, error } = await supabase.from('tasks').insert([{...taskData, completed: false}]).select().single();
    if (error) return;
    set({ tasks: [...get().tasks, data] });
  },

  toggleTask: async (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = !task.completed;
    
    // Optimistic update
    set({ tasks: get().tasks.map(t => t.id === taskId ? { ...t, completed: newStatus } : t) });

    const { error } = await supabase.from('tasks').update({ completed: newStatus }).eq('id', taskId);
    if (error) {
      // rollback
      set({ tasks: get().tasks.map(t => t.id === taskId ? { ...t, completed: !newStatus } : t) });
      return;
    }

    await get().addActivity({
      ticket_id: task.ticket_id,
      type: 'task_completed',
      message: `Task checklist item "${task.title}" marked as ${newStatus ? 'completed' : 'incomplete'}`
    });
  },

  deleteTask: async (taskId) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) return;
    set({ tasks: get().tasks.filter(t => t.id !== taskId) });
  },

  addRule: async (ruleData) => {
    const { data, error } = await supabase.from('priority_rules').insert([ruleData]).select().single();
    if (error) return;
    set({ rules: [...get().rules, data] });
    get().recalculateAllPriorities();
  },

  updateRule: async (id, updates) => {
    const { data, error } = await supabase.from('priority_rules').update(updates).eq('id', id).select().single();
    if (error) return;
    set({ rules: get().rules.map(r => r.id === id ? data : r) });
    get().recalculateAllPriorities();
  },

  deleteRule: async (id) => {
    const { error } = await supabase.from('priority_rules').delete().eq('id', id);
    if (error) return;
    set({ rules: get().rules.filter(r => r.id !== id) });
    get().recalculateAllPriorities();
  },

  addNote: async (leadId, content) => {
    const currentUser = get().currentUser;
    const { data, error } = await supabase.from('notes').insert([{
      lead_id: leadId,
      content,
      created_by: currentUser?.id
    }]).select().single();
    if (error) return;
    
    set({ notes: [data, ...get().notes] });

    await get().addActivity({
      lead_id: leadId,
      type: 'note_added',
      message: `Added new note: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`
    });
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
    } else {
      console.error("Error updating profile:", error);
      throw error;
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
    } else {
      console.error("Error updating user data:", error);
      throw error;
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
