/* eslint-disable react-hooks/set-state-in-effect, @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@radix-ui/react-dialog';
import { useStore, User } from '@/lib/useStore';
import { CustomSelect } from './CustomSelect';
import { X, User as UserIcon, Shield, Mail, Image as ImageIcon, Save, Users } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileModal() {
  const { 
    isProfileOpen, 
    setProfileOpen, 
    currentUser, 
    users, 
    updateProfile, 
    updateUserData 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'directory'>('profile');
  
  // Profile edit states
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState<'admin' | 'counselor'>('counselor');
  const [isSaving, setIsSaving] = useState(false);

  // Load user data on open
  useEffect(() => {
    if (currentUser && isProfileOpen) {
      setName(currentUser.name);
      setAvatarUrl(currentUser.avatar_url || '');
      setRole(currentUser.role);
    }
  }, [currentUser, isProfileOpen]);

  if (!currentUser) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        avatar_url: avatarUrl.trim() || undefined,
        role
      });
      toast.success('Profile updated successfully');
      setProfileOpen(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateName = async (userId: string, newName: string) => {
    try {
      await updateUserData(userId, { name: newName });
      toast.success('User name updated successfully');
    } catch {
      toast.error('Failed to update user name');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: User['role']) => {
    try {
      await updateUserData(userId, { role: newRole });
      toast.success('User role updated successfully');
    } catch {
      toast.error('Failed to update user role');
    }
  };

  return (
    <Dialog open={isProfileOpen} onOpenChange={setProfileOpen}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
        <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden outline-none flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Account Settings</h2>
              <p className="text-xs text-slate-500">Manage your profile details and counselor permissions</p>
            </div>
            <button 
              onClick={() => setProfileOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Admin Navigation Tabs */}
          {currentUser.role === 'admin' && (
            <div className="flex border-b border-slate-100 px-6 bg-slate-50">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 py-3 px-2 text-sm font-semibold border-b-2 transition-all -mb-px ${
                  activeTab === 'profile' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserIcon size={16} />
                My Profile
              </button>
              <button
                onClick={() => setActiveTab('directory')}
                className={`flex items-center gap-2 py-3 px-2 text-sm font-semibold border-b-2 transition-all -mb-px ${
                  activeTab === 'directory' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users size={16} />
                User Directory & Designations
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'profile' || currentUser.role !== 'admin' ? (
              // --- MY PROFILE FORM ---
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-slate-50">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={name} 
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-50"
                      onError={() => setAvatarUrl('')} // fallback if invalid URL
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 ring-4 ring-slate-50">
                      <UserIcon size={32} />
                    </div>
                  )}
                  <div className="text-center sm:text-left space-y-1">
                    <h3 className="font-semibold text-slate-800 text-base">{currentUser.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Role: {currentUser.role === 'admin' ? 'Administrator' : 'Counselor'}</p>
                    <p className="text-[10px] text-slate-400">{currentUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-white"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  {/* Role field (counselor/admin) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Designation (Role)</label>
                    <CustomSelect
                      value={role}
                      onChange={(val) => setRole(val as 'admin' | 'counselor')}
                      options={[
                        { label: 'Administrator', value: 'admin' },
                        { label: 'Counselor', value: 'counselor' }
                      ]}
                      className="text-xs"
                    />
                  </div>

                  {/* Email field (Read-only) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      Email Address
                      <span className="text-[10px] text-slate-400 font-normal">(Linked via Google Auth)</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        value={currentUser.email}
                        className="w-full text-sm pl-9 pr-3 py-2 border border-slate-100 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </div>

                  {/* Avatar field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Avatar Image URL</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-white"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Save buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setProfileOpen(false)}
                    className="text-xs px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="text-xs px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={14} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              // --- ADMIN USER DIRECTORY ---
              <div className="space-y-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Users ({users.length})</div>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-55/10">
                  {users.map((u) => (
                    <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                      
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img 
                            src={u.avatar_url} 
                            alt={u.name} 
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <UserIcon size={18} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="text"
                              defaultValue={u.name}
                              onBlur={(e) => {
                                const newName = e.target.value.trim();
                                if (newName && newName !== u.name) {
                                  handleUpdateName(u.id, newName);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              className="text-sm font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition-all w-full max-w-[200px]"
                              title="Click to edit name"
                            />
                            {u.id === currentUser.id && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal shrink-0">You</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5 pl-1">
                            <Mail size={12} className="text-slate-400" />
                            {u.email}
                          </p>
                        </div>
                      </div>

                      {/* Role drop-down configuration for Central Data */}
                      <div className="flex items-center gap-2 min-w-[160px]">
                        <Shield size={14} className="text-slate-400" />
                        <div className="flex-1">
                          <CustomSelect
                            value={u.role}
                            onChange={(val) => handleUpdateRole(u.id, val as User['role'])}
                            options={[
                              { label: 'Administrator', value: 'admin' },
                              { label: 'Counselor', value: 'counselor' }
                            ]}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
