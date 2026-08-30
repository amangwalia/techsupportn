import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  X, 
  User, 
  KeyRound, 
  Mail, 
  Eye, 
  EyeOff, 
  Check, 
  Trash2, 
  UserPlus, 
  Search, 
  Edit2, 
  Lock, 
  AlertCircle, 
  CheckCircle2,
  Users,
  Shield,
  RefreshCw,
  Copy
} from 'lucide-react';
import { 
  getRegisteredAccounts, 
  fetchRegisteredAccounts,
  updateUserCredentials, 
  deleteUserAccount, 
  registerNewUser, 
  StoredUserAccount 
} from '../utils/auth';
import { UserRole } from '../types';

interface AdminUserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdminUsername: string;
  onAdminProfileUpdated?: (newUsername: string) => void;
}

export const AdminUserManagementModal: React.FC<AdminUserManagementModalProps> = ({
  isOpen,
  onClose,
  currentAdminUsername,
  onAdminProfileUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'admin_profile' | 'all_users'>('admin_profile');
  const [accounts, setAccounts] = useState<StoredUserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Admin's own profile edit states
  const [adminUsername, setAdminUsername] = useState(currentAdminUsername);
  const [adminDisplayName, setAdminDisplayName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminSaveLoading, setAdminSaveLoading] = useState(false);

  // User management states
  const [editingUser, setEditingUser] = useState<StoredUserAccount | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Create new user states
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addSaving, setAddSaving] = useState(false);

  // Feedback states
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedPassUser, setCopiedPassUser] = useState<string | null>(null);

  // Refresh user accounts from server and local cache
  const refreshAccountsList = async () => {
    // Immediate render with local cache
    const cached = getRegisteredAccounts();
    setAccounts(cached);
    
    // Find current admin account details
    const currentAdmin = cached.find((a) => a.username.toLowerCase() === currentAdminUsername.toLowerCase());
    if (currentAdmin) {
      setAdminUsername(currentAdmin.username);
      setAdminDisplayName(currentAdmin.displayName || currentAdmin.username);
      setAdminEmail(currentAdmin.email || '');
    }

    // Fresh fetch from backend
    try {
      const fresh = await fetchRegisteredAccounts();
      setAccounts(fresh);
      const freshAdmin = fresh.find((a) => a.username.toLowerCase() === currentAdminUsername.toLowerCase());
      if (freshAdmin) {
        setAdminUsername(freshAdmin.username);
        setAdminDisplayName(freshAdmin.displayName || freshAdmin.username);
        setAdminEmail(freshAdmin.email || '');
      }
    } catch {}
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshAccountsList();
    setStatusMessage(null);
    setAdminNewPassword('');
    setIsAddingUser(false);
    setEditingUser(null);
  }, [isOpen, currentAdminUsername]);

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setAdminSaveLoading(true);

    const updates: {
      newUsername?: string;
      newDisplayName?: string;
      newEmail?: string;
      newPassword?: string;
    } = {
      newUsername: adminUsername.trim(),
      newDisplayName: adminDisplayName.trim(),
      newEmail: adminEmail.trim()
    };

    if (adminNewPassword.trim()) {
      updates.newPassword = adminNewPassword.trim();
    }

    const res = await updateUserCredentials(currentAdminUsername, updates);
    setAdminSaveLoading(false);

    if (res.success && res.updatedUser) {
      setStatusMessage({ type: 'success', text: 'Admin profile & credentials updated successfully!' });
      setAdminNewPassword('');
      await refreshAccountsList();
      if (onAdminProfileUpdated && res.updatedUser.username !== currentAdminUsername) {
        onAdminProfileUpdated(res.updatedUser.username);
      }
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update admin profile.' });
    }
  };

  const handleStartEditUser = (user: StoredUserAccount) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditDisplayName(user.displayName || user.username);
    setEditEmail(user.email || '');
    setEditRole(user.role);
    setEditNewPassword('');
    setShowEditPassword(false);
    setStatusMessage(null);
  };

  const handleSaveUserChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setStatusMessage(null);
    setEditSaving(true);

    const updates: {
      newUsername?: string;
      newDisplayName?: string;
      newEmail?: string;
      newPassword?: string;
      newRole?: UserRole;
    } = {
      newUsername: editUsername.trim(),
      newDisplayName: editDisplayName.trim(),
      newEmail: editEmail.trim(),
      newRole: editRole
    };

    if (editNewPassword.trim()) {
      updates.newPassword = editNewPassword.trim();
    }

    const res = await updateUserCredentials(editingUser.username, updates);
    setEditSaving(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: `Credentials for "${editingUser.username}" updated successfully!` });
      setEditingUser(null);
      await refreshAccountsList();
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update user.' });
    }
  };

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setAddSaving(true);

    const res = await registerNewUser({
      username: newUsername.trim(),
      email: newEmail.trim(),
      password: newPassword.trim(),
      role: newRole,
      displayName: newDisplayName.trim() || undefined
    });

    setAddSaving(false);

    if (res.success && res.user) {
      setStatusMessage({ type: 'success', text: `New account "${res.user.username}" created successfully!` });
      setIsAddingUser(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewEmail('');
      setNewPassword('');
      await refreshAccountsList();
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to create user account.' });
    }
  };

  const handleDeleteUser = async (targetUsername: string) => {
    if (targetUsername.toLowerCase() === currentAdminUsername.toLowerCase()) {
      setStatusMessage({ type: 'error', text: 'You cannot delete your own active administrator account.' });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the user account "${targetUsername}"? This action cannot be undone.`)) {
      return;
    }

    const res = await deleteUserAccount(targetUsername);
    if (res.success) {
      setStatusMessage({ type: 'success', text: `User account "${targetUsername}" deleted.` });
      await refreshAccountsList();
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to delete account.' });
    }
  };

  const handleCopyPassword = (pass: string, user: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedPassUser(user);
    setTimeout(() => setCopiedPassUser(null), 2000);
  };

  const filteredAccounts = accounts.filter((acc) => {
    const q = searchQuery.toLowerCase();
    return (
      acc.username.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      (acc.displayName && acc.displayName.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="liquid-glass rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/60 dark:border-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/50 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>Admin Control Center</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full liquid-glass-chip text-blue-600 dark:text-cyan-400 font-bold">
                  Admin Only
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your admin credentials, reset member passwords, and manage vault user accounts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Banner */}
        {statusMessage && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border-b border-emerald-400/30 text-emerald-600 dark:text-emerald-300'
              : 'bg-rose-500/15 border-b border-rose-400/30 text-rose-600 dark:text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-white/40 dark:border-white/10 bg-white/20 dark:bg-slate-950/40 text-xs sm:text-sm backdrop-blur-md shrink-0">
          <button
            onClick={() => {
              setActiveTab('admin_profile');
              setStatusMessage(null);
            }}
            className={`py-3.5 px-4 font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'admin_profile'
                ? 'border-cyan-500 text-blue-600 dark:text-cyan-400 bg-white/40 dark:bg-slate-900/50'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>My Admin Credentials</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('all_users');
              setStatusMessage(null);
            }}
            className={`py-3.5 px-4 font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'all_users'
                ? 'border-cyan-500 text-blue-600 dark:text-cyan-400 bg-white/40 dark:bg-slate-900/50'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manage Users & Passwords</span>
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full liquid-glass-chip">
              {accounts.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: ADMIN'S OWN CREDENTIALS */}
          {activeTab === 'admin_profile' && (
            <form onSubmit={handleUpdateAdminProfile} className="max-w-xl space-y-4">
              <div className="p-4 rounded-2xl liquid-glass-card space-y-1 mb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  Change Administrator Login & Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Update your admin login username, unique recovery email, display name, and password here anytime.
                </p>
              </div>

              {/* Admin Username / Login ID */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Admin Login ID / Username
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    placeholder="admin"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-blue-500 dark:focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              {/* Admin Display Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Display Name
                </label>
                <input
                  type="text"
                  value={adminDisplayName}
                  onChange={(e) => setAdminDisplayName(e.target.value)}
                  placeholder="Administrator"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-blue-500 dark:focus:border-cyan-400 transition"
                />
              </div>

              {/* Admin Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Admin Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    placeholder="admin@techsupport.org"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-blue-500 dark:focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              {/* Admin New Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    New Admin Password <span className="text-slate-400 font-normal">(Leave blank to keep unchanged)</span>
                  </label>
                </div>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Enter new password (min 4 characters)"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-blue-500 dark:focus:border-cyan-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={adminSaveLoading || !adminUsername || !adminEmail}
                  className="py-2.5 px-6 rounded-full liquid-glass-btn text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{adminSaveLoading ? 'Saving changes...' : 'Save Admin Credentials'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MANAGE USERS & RESET PASSWORDS */}
          {activeTab === 'all_users' && (
            <div className="space-y-5">
              
              {/* Actions Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name, login ID, or email..."
                    className="w-full pl-10 pr-3.5 py-2 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-blue-500 dark:focus:border-cyan-400 transition"
                  />
                </div>

                {/* Add User Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingUser(!isAddingUser);
                    setEditingUser(null);
                  }}
                  className="py-2 px-4 rounded-full liquid-glass-btn text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAddingUser ? 'Cancel' : '+ Add New Account'}</span>
                </button>
              </div>

              {/* ADD NEW USER FORM (EXPANDABLE) */}
              {isAddingUser && (
                <form onSubmit={handleCreateNewUser} className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-4 border border-blue-400/40 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-white/40 dark:border-white/10">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      Provision New User Account
                    </h4>
                    <span className="text-[10px] text-slate-400">Admin Provisioning</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Login ID / Username *
                      </label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="e.g. john_member"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="john@company.com"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Initial Password *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 4 characters"
                          required
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Role:</span>
                      <button
                        type="button"
                        onClick={() => setNewRole('user')}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                          newRole === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'liquid-glass-chip text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Member
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewRole('admin')}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                          newRole === 'admin'
                            ? 'bg-indigo-600 text-white'
                            : 'liquid-glass-chip text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Administrator
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingUser(false)}
                        className="py-1.5 px-3 rounded-full text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addSaving || !newUsername || !newEmail || !newPassword}
                        className="py-1.5 px-4 rounded-full liquid-glass-btn text-white font-bold text-xs shadow-xs"
                      >
                        {addSaving ? 'Creating...' : 'Create Account'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* EDIT / RESET USER DIALOG */}
              {editingUser && (
                <form onSubmit={handleSaveUserChanges} className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-4 border border-cyan-400/40 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-white/40 dark:border-white/10">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-cyan-500" />
                      Edit & Reset Password for: <span className="font-mono text-blue-600 dark:text-cyan-400">@{editingUser.username}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Login ID / Username
                      </label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Reset Password <span className="text-slate-400 font-normal">(Leave blank to keep unchanged)</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showEditPassword ? 'text' : 'password'}
                          value={editNewPassword}
                          onChange={(e) => setEditNewPassword(e.target.value)}
                          placeholder="Type new password"
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Role:</span>
                      <button
                        type="button"
                        onClick={() => setEditRole('user')}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                          editRole === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'liquid-glass-chip text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Member
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditRole('admin')}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                          editRole === 'admin'
                            ? 'bg-indigo-600 text-white'
                            : 'liquid-glass-chip text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Administrator
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="py-1.5 px-3 rounded-full text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editSaving}
                        className="py-1.5 px-4 rounded-full liquid-glass-btn text-white font-bold text-xs shadow-xs"
                      >
                        {editSaving ? 'Saving...' : 'Save User Updates'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Users Accounts List */}
              <div className="space-y-2.5">
                {filteredAccounts.map((account) => {
                  const isCurrentAdmin = account.username.toLowerCase() === currentAdminUsername.toLowerCase();

                  return (
                    <div
                      key={account.username}
                      className="liquid-glass-card rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-400/40 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                          account.role === 'admin' 
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                            : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                        }`}>
                          {account.username.charAt(0).toUpperCase()}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                              {account.displayName || account.username}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              (@{account.username})
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              account.role === 'admin'
                                ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30'
                                : 'bg-blue-500/20 text-blue-700 dark:text-cyan-300 border border-blue-400/30'
                            }`}>
                              {account.role === 'admin' ? 'Admin' : 'Member'}
                            </span>
                            {isCurrentAdmin && (
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                (You)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {account.email}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              <Lock className="w-3 h-3 text-slate-400" />
                              Password: <span className="text-slate-700 dark:text-slate-300 font-semibold">{account.passwordHash}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyPassword(account.passwordHash, account.username)}
                                className="p-1 hover:text-blue-600 dark:hover:text-cyan-400 cursor-pointer"
                                title="Copy Password"
                              >
                                {copiedPassUser === account.username ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditUser(account)}
                          className="py-1.5 px-3 rounded-full text-xs font-semibold liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 text-blue-600 dark:text-cyan-400 flex items-center gap-1 transition"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit / Reset</span>
                        </button>

                        {!isCurrentAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(account.username)}
                            className="p-1.5 rounded-full liquid-glass-chip hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition"
                            title={`Delete account ${account.username}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredAccounts.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs liquid-glass-card rounded-2xl">
                    No registered user accounts match your search.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
