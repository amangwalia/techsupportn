import { UserAccount, UserRole } from '../types';

export interface StoredUserAccount extends UserAccount {
  passwordHash: string;
  email: string;
  recoveryPin?: string;
  createdAt?: string;
}

// Default fallback system accounts (used only if server initialization has never run)
const INITIAL_ACCOUNTS: StoredUserAccount[] = [
  {
    username: 'admin',
    role: 'admin',
    displayName: 'Administrator',
    email: 'admin@techsupport.org',
    passwordHash: 'admin123',
    recoveryPin: '9160'
  },
  {
    username: 'user',
    role: 'user',
    displayName: 'Community Member',
    email: 'user@techsupport.org',
    passwordHash: 'user123',
    recoveryPin: '1234'
  }
];

const STORAGE_KEY_USERS = 'techsupport_vault_users_v4';
const STORAGE_KEY_AUTH = 'techsupport_authenticated';
const STORAGE_KEY_CURRENT_USER = 'techsupport_auth_current_user';
const STORAGE_KEY_CURRENT_ROLE = 'techsupport_auth_current_role';
const STORAGE_KEY_ACTIVE_OTP = 'techsupport_active_otp_sessions';

/**
 * Returns all registered accounts from local storage
 */
export function getRegisteredAccounts(): StoredUserAccount[] {
  let accounts: StoredUserAccount[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read user accounts from localStorage:', e);
  }

  return accounts;
}

/**
 * Saves registered accounts to localStorage
 */
export function saveRegisteredAccounts(accounts: StoredUserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Could not save user accounts to localStorage:', e);
  }
}

/**
 * Fetches user accounts from the persistent server backend (authoritative source of truth)
 */
export async function fetchRegisteredAccounts(): Promise<StoredUserAccount[]> {
  try {
    const res = await fetch('/api/auth/users');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const serverUsers = await res.json();
      if (Array.isArray(serverUsers) && serverUsers.length > 0) {
        saveRegisteredAccounts(serverUsers);
        return serverUsers;
      }
    }
  } catch (err) {
    // Offline or network error
  }
  const cached = getRegisteredAccounts();
  if (cached.length === 0) {
    return INITIAL_ACCOUNTS;
  }
  return cached;
}

// Initial background sync
if (typeof window !== 'undefined') {
  fetchRegisteredAccounts().catch(() => {});
}

/**
 * Sets session across both sessionStorage and localStorage with error guards
 */
function setSessionState(username: string, role: UserRole) {
  try {
    sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
    sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, username);
    sessionStorage.setItem(STORAGE_KEY_CURRENT_ROLE, role);
    sessionStorage.setItem('level1_authenticated', 'true');
    sessionStorage.setItem('level1_auth_current_user', username);
  } catch (e) {
    console.warn('sessionStorage write error:', e);
  }

  try {
    localStorage.setItem('techsupport_session_auth', 'true');
    localStorage.setItem('techsupport_session_user', username);
    localStorage.setItem('techsupport_session_role', role);
  } catch (e) {
    console.warn('localStorage write error:', e);
  }
}

const STORAGE_KEY_LOCKOUT = 'techsupport_auth_lockout_state_v2';

export interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null;
  lockoutTier: number;
  remainingSeconds: number;
  isLocked: boolean;
}

/**
 * Reads the current client lockout state from localStorage
 */
export function getLockoutState(): LockoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCKOUT);
    if (raw) {
      const parsed = JSON.parse(raw);
      const now = Date.now();
      if (parsed.lockedUntil && parsed.lockedUntil > now) {
        const remaining = Math.max(1, Math.ceil((parsed.lockedUntil - now) / 1000));
        return {
          failedAttempts: parsed.failedAttempts || 0,
          lockedUntil: parsed.lockedUntil,
          lockoutTier: parsed.lockoutTier || 1,
          remainingSeconds: remaining,
          isLocked: true,
        };
      }
      // If timer has expired, keep the history of failures/tiers so next wrong attempt increments tier
      return {
        failedAttempts: parsed.failedAttempts || 0,
        lockedUntil: null,
        lockoutTier: parsed.lockoutTier || 0,
        remainingSeconds: 0,
        isLocked: false,
      };
    }
  } catch (e) {
    console.warn('Could not read lockout state:', e);
  }
  return {
    failedAttempts: 0,
    lockedUntil: null,
    lockoutTier: 0,
    remainingSeconds: 0,
    isLocked: false,
  };
}

/**
 * Saves lockout state to localStorage
 */
export function saveLockoutState(state: Partial<LockoutState>): void {
  try {
    const current = getLockoutState();
    const merged = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY_LOCKOUT, JSON.stringify(merged));
  } catch (e) {
    console.warn('Could not save lockout state:', e);
  }
}

/**
 * Resets lockout state completely upon successful authentication
 */
export function resetLockoutState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_LOCKOUT);
  } catch (e) {
    console.warn('Could not reset lockout state:', e);
  }
}

/**
 * Records a failed attempt and calculates progressive lockout
 */
export function recordFailedAttempt(serverData?: {
  isLocked?: boolean;
  lockedUntil?: number | null;
  remainingSeconds?: number;
  failedAttempts?: number;
  lockoutTier?: number;
}): LockoutState {
  const current = getLockoutState();
  const now = Date.now();

  if (serverData && (serverData.lockedUntil !== undefined || serverData.failedAttempts !== undefined)) {
    const isLocked = !!(serverData.isLocked || (serverData.lockedUntil && serverData.lockedUntil > now));
    const lockedUntil = serverData.lockedUntil || (isLocked && serverData.remainingSeconds ? now + serverData.remainingSeconds * 1000 : null);
    const state: LockoutState = {
      failedAttempts: serverData.failedAttempts ?? (current.failedAttempts + 1),
      lockedUntil,
      lockoutTier: serverData.lockoutTier ?? (current.lockoutTier || 1),
      remainingSeconds: serverData.remainingSeconds ?? (lockedUntil ? Math.max(1, Math.ceil((lockedUntil - now) / 1000)) : 0),
      isLocked,
    };
    saveLockoutState(state);
    return state;
  }

  // Client-side fallback calculation
  const newAttempts = current.failedAttempts + 1;
  let lockedUntil: number | null = null;
  let newTier = current.lockoutTier;
  let isLocked = false;
  let remainingSeconds = 0;

  if (newAttempts >= 5) {
    newTier = newAttempts - 4; // 1 for 5th, 2 for 6th, etc.
    const durationMinutes = Math.min(newTier, 30);
    const durationSec = durationMinutes * 60;
    lockedUntil = now + durationSec * 1000;
    isLocked = true;
    remainingSeconds = durationSec;
  }

  const newState: LockoutState = {
    failedAttempts: newAttempts,
    lockedUntil,
    lockoutTier: newTier,
    remainingSeconds,
    isLocked,
  };
  saveLockoutState(newState);
  return newState;
}

/**
 * Authenticates user credentials against both persistent backend and client storage.
 * Works seamlessly on smartphones, laptops, desktop browsers, and offline.
 * Supports login via either Username OR Email Address with progressive timeout on failed attempts.
 */
export async function authenticateUser(
  loginIdInput: string, 
  passwordInput: string,
  requireAdmin: boolean = false
): Promise<{ 
  success: boolean; 
  user?: StoredUserAccount; 
  error?: string;
  isLocked?: boolean;
  lockedUntil?: number | null;
  remainingSeconds?: number;
  failedAttempts?: number;
  lockoutTier?: number;
}> {
  // 0. Check active client lockout
  const activeLock = getLockoutState();
  if (activeLock.isLocked && activeLock.remainingSeconds > 0) {
    const mins = Math.floor(activeLock.remainingSeconds / 60);
    const secs = activeLock.remainingSeconds % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    return {
      success: false,
      isLocked: true,
      lockedUntil: activeLock.lockedUntil,
      remainingSeconds: activeLock.remainingSeconds,
      failedAttempts: activeLock.failedAttempts,
      lockoutTier: activeLock.lockoutTier,
      error: `Security lockout active. Please wait ${timeStr} before trying again.`
    };
  }

  // Strip whitespace, unicode spaces, and invisible mobile keystrokes
  const sanitize = (val: string) =>
    (val || '')
      .replace(/[\u00A0\u1680\u180e\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, ' ')
      .trim();

  const trimmedId = sanitize(loginIdInput);
  const trimmedPass = sanitize(passwordInput);

  if (!trimmedId || !trimmedPass) {
    return { 
      success: false, 
      error: 'Please enter both your login ID / email and password.' 
    };
  }

  // 1. Primary: Server-Side Authentication
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loginId: trimmedId,
        password: trimmedPass,
        requireAdmin,
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success && data.user) {
        setSessionState(data.user.username, data.user.role);
        resetLockoutState(); // Clean reset on success

        // Refresh local cache with latest server state
        fetchRegisteredAccounts().catch(() => {});

        return { 
          success: true, 
          isLocked: false,
          user: {
            username: data.user.username,
            role: data.user.role,
            displayName: data.user.displayName,
            email: data.user.email,
            passwordHash: trimmedPass
          }
        };
      }

      // Server is online and responded with an auth failure or lockout
      if (!response.ok) {
        const lockout = recordFailedAttempt(data);
        return {
          success: false,
          isLocked: lockout.isLocked,
          lockedUntil: lockout.lockedUntil,
          remainingSeconds: lockout.remainingSeconds,
          failedAttempts: lockout.failedAttempts,
          lockoutTier: lockout.lockoutTier,
          error: data.error || (requireAdmin ? 'Invalid admin credentials.' : 'Invalid username or password.')
        };
      }
    }
  } catch (networkErr) {
    // Server is completely unreachable / device is offline
  }

  // 2. Offline fallback ONLY when server could not be reached over network
  const accounts = getRegisteredAccounts();
  const lowerId = trimmedId.toLowerCase();
  const user = accounts.find(
    (a) => a.username.toLowerCase() === lowerId || (a.email && a.email.toLowerCase() === lowerId)
  );

  if (user && user.passwordHash === trimmedPass) {
    if (requireAdmin && user.role !== 'admin') {
      const lockout = recordFailedAttempt();
      return { 
        success: false, 
        isLocked: lockout.isLocked,
        lockedUntil: lockout.lockedUntil,
        remainingSeconds: lockout.remainingSeconds,
        failedAttempts: lockout.failedAttempts,
        lockoutTier: lockout.lockoutTier,
        error: 'Access denied. Administrator privileges required.' 
      };
    }
    setSessionState(user.username, user.role);
    resetLockoutState();
    return { success: true, isLocked: false, user };
  }

  const lockout = recordFailedAttempt();
  return { 
    success: false, 
    isLocked: lockout.isLocked,
    lockedUntil: lockout.lockedUntil,
    remainingSeconds: lockout.remainingSeconds,
    failedAttempts: lockout.failedAttempts,
    lockoutTier: lockout.lockoutTier,
    error: lockout.isLocked
      ? `Too many failed attempts (${lockout.failedAttempts}). Access locked for ${lockout.lockoutTier} minute${lockout.lockoutTier > 1 ? 's' : ''}.`
      : `Invalid credentials. (${5 - lockout.failedAttempts} attempt${5 - lockout.failedAttempts === 1 ? '' : 's'} remaining before 1-minute lockout)` 
  };
}

/**
 * Registers a new unique user account (persisted to server & local storage)
 */
export async function registerNewUser(params: {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  displayName?: string;
}): Promise<{ success: boolean; error?: string; user?: StoredUserAccount }> {
  const username = params.username.trim().toLowerCase();
  const email = params.email.trim().toLowerCase();
  const password = params.password.trim();

  if (!username || username.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    return { success: false, error: 'Please enter a valid unique email address.' };
  }

  if (!password || password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  // 1. Send to server backend
  try {
    const res = await fetch('/api/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        password,
        role: params.role || 'user',
        displayName: params.displayName?.trim() || username.charAt(0).toUpperCase() + username.slice(1)
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to create user on server.' };
    }

    if (data.user) {
      const accounts = getRegisteredAccounts();
      accounts.push(data.user);
      saveRegisteredAccounts(accounts);
      return { success: true, user: data.user };
    }
  } catch (err) {
    console.warn('Server error on register, applying local change:', err);
  }

  // 2. Local fallback
  const accounts = getRegisteredAccounts();
  if (accounts.some((a) => a.username.toLowerCase() === username)) {
    return { success: false, error: 'This username is already taken. Please choose another.' };
  }
  if (accounts.some((a) => a.email.toLowerCase() === email)) {
    return { success: false, error: 'This email is already associated with an existing account.' };
  }

  const newAccount: StoredUserAccount = {
    username,
    email,
    passwordHash: password,
    role: params.role || 'user',
    displayName: params.displayName?.trim() || username.charAt(0).toUpperCase() + username.slice(1),
    createdAt: new Date().toISOString()
  };

  accounts.push(newAccount);
  saveRegisteredAccounts(accounts);

  return { success: true, user: newAccount };
}

/**
 * Admin: Updates user credentials (persisted to server & local storage)
 */
export async function updateUserCredentials(
  targetUsername: string,
  updates: {
    newUsername?: string;
    newEmail?: string;
    newPassword?: string;
    newDisplayName?: string;
    newRole?: UserRole;
  }
): Promise<{ success: boolean; error?: string; updatedUser?: StoredUserAccount }> {
  const cleanTarget = targetUsername.trim().toLowerCase();

  // 1. Send update to server backend
  try {
    const res = await fetch(`/api/auth/users/${encodeURIComponent(cleanTarget)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update credentials on server.' };
    }

    if (data.user) {
      const accounts = getRegisteredAccounts();
      const idx = accounts.findIndex((a) => a.username.toLowerCase() === cleanTarget);
      if (idx !== -1) {
        accounts[idx] = data.user;
      } else {
        accounts.push(data.user);
      }
      saveRegisteredAccounts(accounts);

      // If active user modified, update session
      try {
        const activeUser = sessionStorage.getItem(STORAGE_KEY_CURRENT_USER);
        if (activeUser && activeUser.toLowerCase() === cleanTarget) {
          sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, data.user.username);
          sessionStorage.setItem(STORAGE_KEY_CURRENT_ROLE, data.user.role);
          sessionStorage.setItem('level1_auth_current_user', data.user.username);
        }
      } catch {}

      return { success: true, updatedUser: data.user };
    }
  } catch (err) {
    console.warn('Server error on update user, applying local fallback:', err);
  }

  // 2. Local fallback
  const accounts = getRegisteredAccounts();
  const index = accounts.findIndex(
    (a) => a.username.toLowerCase() === cleanTarget
  );

  if (index === -1) {
    return { success: false, error: 'User account not found.' };
  }

  const current = accounts[index];

  if (updates.newUsername && updates.newUsername.trim().toLowerCase() !== current.username.toLowerCase()) {
    const nextUsername = updates.newUsername.trim().toLowerCase();
    if (nextUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }
    const exists = accounts.some((a) => a.username.toLowerCase() === nextUsername);
    if (exists) {
      return { success: false, error: 'This username is already taken by another account.' };
    }
    current.username = nextUsername;
  }

  if (updates.newEmail && updates.newEmail.trim().toLowerCase() !== current.email.toLowerCase()) {
    const nextEmail = updates.newEmail.trim().toLowerCase();
    if (!nextEmail.includes('@') || !nextEmail.includes('.')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }
    const exists = accounts.some((a) => a.email.toLowerCase() === nextEmail);
    if (exists) {
      return { success: false, error: 'This email is already registered to another account.' };
    }
    current.email = nextEmail;
  }

  if (updates.newPassword !== undefined && updates.newPassword.trim() !== '') {
    const nextPass = updates.newPassword.trim();
    if (nextPass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    current.passwordHash = nextPass;
  }

  if (updates.newDisplayName !== undefined) {
    current.displayName = updates.newDisplayName.trim() || current.username;
  }

  if (updates.newRole !== undefined) {
    current.role = updates.newRole;
  }

  accounts[index] = current;
  saveRegisteredAccounts(accounts);

  try {
    const activeUser = sessionStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (activeUser && activeUser.toLowerCase() === cleanTarget) {
      sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, current.username);
      sessionStorage.setItem(STORAGE_KEY_CURRENT_ROLE, current.role);
      sessionStorage.setItem('level1_auth_current_user', current.username);
    }
  } catch {}

  return { success: true, updatedUser: current };
}

/**
 * Admin: Deletes a user account (persisted to server & local storage)
 */
export async function deleteUserAccount(targetUsername: string): Promise<{ success: boolean; error?: string }> {
  const trimmed = targetUsername.trim().toLowerCase();

  // 1. Send delete to server backend
  try {
    const res = await fetch(`/api/auth/users/${encodeURIComponent(trimmed)}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to delete user on server.' };
    }
  } catch (err) {
    console.warn('Server error deleting user, applying local fallback:', err);
  }

  // 2. Local fallback
  const accounts = getRegisteredAccounts();
  const target = accounts.find((a) => a.username.toLowerCase() === trimmed);

  if (!target) {
    return { success: false, error: 'Account not found.' };
  }

  if (target.role === 'admin') {
    const adminCount = accounts.filter((a) => a.role === 'admin').length;
    if (adminCount <= 1) {
      return { success: false, error: 'Cannot delete the only remaining Administrator account.' };
    }
  }

  const remaining = accounts.filter((a) => a.username.toLowerCase() !== trimmed);
  saveRegisteredAccounts(remaining);

  return { success: true };
}

/**
 * Retrieves current active session
 */
export function getCurrentSession(): {
  isAuthenticated: boolean;
  username: string;
  role: UserRole;
  email?: string;
} {
  try {
    const isAuth = sessionStorage.getItem(STORAGE_KEY_AUTH) === 'true' || 
                   sessionStorage.getItem('level1_authenticated') === 'true' ||
                   localStorage.getItem('techsupport_session_auth') === 'true';
    const username = sessionStorage.getItem(STORAGE_KEY_CURRENT_USER) || 
                     sessionStorage.getItem('level1_auth_current_user') || 
                     localStorage.getItem('techsupport_session_user') || 'user';
    const storedRole = (sessionStorage.getItem(STORAGE_KEY_CURRENT_ROLE) ||
                       localStorage.getItem('techsupport_session_role')) as UserRole | null;

    let role: UserRole = 'user';
    let email = 'user@techsupport.org';

    const accounts = getRegisteredAccounts();
    const match = accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());
    if (match) {
      role = match.role;
      email = match.email;
    } else if (storedRole === 'admin' || storedRole === 'user') {
      role = storedRole;
    }

    return {
      isAuthenticated: isAuth,
      username,
      role,
      email
    };
  } catch {
    return {
      isAuthenticated: false,
      username: 'user',
      role: 'user',
      email: 'user@techsupport.org'
    };
  }
}

/**
 * Logs out user
 */
export function logoutUser(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
    sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    sessionStorage.removeItem(STORAGE_KEY_CURRENT_ROLE);
    sessionStorage.removeItem('level1_authenticated');
    sessionStorage.removeItem('level1_auth_current_user');
  } catch (e) {
    console.warn('Error clearing session storage:', e);
  }

  try {
    localStorage.removeItem('techsupport_session_auth');
    localStorage.removeItem('techsupport_session_user');
    localStorage.removeItem('techsupport_session_role');
  } catch (e) {
    console.warn('Error clearing local storage session:', e);
  }
}


