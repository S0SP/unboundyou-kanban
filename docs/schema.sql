-- Supabase PostgreSQL Database Schema for UnboundYou CRM

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'counselor' CHECK (role IN ('admin', 'counselor')),
    avatar_url TEXT,
    settings JSONB NOT NULL DEFAULT '{"sidebar_collapsed": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Leads (Parents / Core Records)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_name TEXT NOT NULL,
    student_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    source TEXT, -- e.g., 'Website', 'Reference', 'Cold Call'
    estimated_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    ticket_type TEXT NOT NULL, -- e.g., 'Scheduling', 'Rescheduling', 'Admission Inquiry', 'Payment Issue'
    stage TEXT NOT NULL DEFAULT 'New Leads' CHECK (stage IN (
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
    )),
    priority_level TEXT NOT NULL DEFAULT 'Medium' CHECK (priority_level IN ('Critical', 'High', 'Medium', 'Low')),
    priority_score INTEGER NOT NULL DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    session_date TIMESTAMP WITH TIME ZONE,
    reminder_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tasks (Checklist items under a ticket)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date TIMESTAMP WITH TIME ZONE,
    auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Priority Rules (Dynamic Engine Configured by User)
CREATE TABLE priority_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    target_field TEXT NOT NULL, -- e.g., 'estimated_value', 'stage', 'days_since_last_contact', 'ticket_type', 'days_to_session'
    operator TEXT NOT NULL CHECK (operator IN ('equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'is_in')),
    value JSONB NOT NULL, -- The value to compare against, e.g., 50000, "Payment Pending", or ["Scheduling", "Payment Issue"]
    points INTEGER NOT NULL, -- e.g., 40, -15
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Activities (History and Audit Trails)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'stage_changed', 'note_added', 'task_completed', 'rule_calculated'
    message TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Internal Notes
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) & Triggers (Auto Updated At)
-- Create trigger function to automatically update `updated_at` timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_tickets_modtime BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_priority_rules_modtime BEFORE UPDATE ON priority_rules FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ==============================================================================
-- 8. Supabase Auth Trigger (Auto-create public.users profile on Google Login)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar_url, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Unknown User'),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'counselor'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 9. Row Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (can be restricted later based on role)
CREATE POLICY "Allow authenticated users full access on users" ON users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access on leads" ON leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access on tickets" ON tickets FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access on tasks" ON tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access on priority_rules" ON priority_rules FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access on activities" ON activities FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access on notes" ON notes FOR ALL TO authenticated USING (true);
