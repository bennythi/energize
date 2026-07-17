import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { createPbClient, type TypedPocketBase } from '@platform/pb-client';

const PB_URL = env.PUBLIC_PB_URL;

export const isAuthConfigured = Boolean(PB_URL);

type PermissionLevel = 'read' | 'write' | 'delete';
const LEVEL_RANK: Record<PermissionLevel, number> = { read: 1, write: 2, delete: 3 };

type AuthUser = { id: string; email: string } & Record<string, unknown>;

interface ProfileData {
  id: string;
  user: string;
  display_name: string;
  handle: string;
  avatar: string;
  locale: string;
}

interface MyPermissionsResponse {
  role: 'user' | 'admin';
  is_crew: boolean;
  crew_roles: string[];
  permissions: Record<string, PermissionLevel>;
}

interface ViewAsResponse extends MyPermissionsResponse {
  userId: string;
  email: string;
  displayName: string;
}

interface ViewAsState {
  userId: string;
  displayName: string;
  email: string;
  realIsAdmin: boolean;
  realIsCrew: boolean;
  realPermissions: Record<string, PermissionLevel>;
}

const VIEW_AS_KEY = 'platform.viewAsUserId';

class AuthStore {
  pb: TypedPocketBase | null = null;
  user = $state<AuthUser | null>(null);
  profile = $state<ProfileData | null>(null);
  loading = $state(true);
  initialized = false;
  isAdmin = $state(false);
  isCrew = $state(false);
  adminChecked = $state(false);
  permissions = $state<Record<string, PermissionLevel>>({});
  viewAs = $state<ViewAsState | null>(null);

  canRead(resource: string): boolean {
    return this.hasLevel(resource, 'read');
  }
  canWrite(resource: string): boolean {
    return this.hasLevel(resource, 'write');
  }
  canDelete(resource: string): boolean {
    return this.hasLevel(resource, 'delete');
  }
  hasLevel(resource: string, required: PermissionLevel): boolean {
    if (this.isAdmin) return true;
    const granted = this.permissions[resource];
    if (!granted) return false;
    return LEVEL_RANK[granted] >= LEVEL_RANK[required];
  }

  init() {
    if (!browser || this.initialized) return;
    this.initialized = true;

    if (!isAuthConfigured) {
      this.loading = false;
      return;
    }

    this.pb = createPbClient(PB_URL!);
    this.syncUser();
    this.loading = false;

    // Auf Aenderungen im Auth-Store reagieren (Login/Logout/Refresh).
    this.pb.authStore.onChange(() => {
      this.syncUser();
      void this.loadPermissions().then(() => this.restoreViewAs());
    });

    // Persistierte Session validieren + initial Rechte laden.
    if (this.pb.authStore.isValid) {
      this.pb
        .collection('users')
        .authRefresh()
        .catch(() => this.pb?.authStore.clear());
    }
    void this.loadPermissions().then(() => this.restoreViewAs());
  }

  private syncUser() {
    const rec = this.pb?.authStore.record;
    this.user = rec ? ({ ...rec } as unknown as AuthUser) : null;
  }

  async loadPermissions(): Promise<void> {
    if (!this.pb || !this.user) {
      this.isAdmin = false;
      this.isCrew = false;
      this.permissions = {};
      this.profile = null;
      this.adminChecked = true;
      return;
    }
    try {
      await this.ensureProfile();
      const res = await this.pb.send<MyPermissionsResponse>('/api/crew/my-permissions', {
        method: 'GET',
      });
      this.isAdmin = res.role === 'admin';
      this.isCrew = this.isAdmin || res.is_crew === true;
      this.permissions = res.permissions ?? {};
    } catch (err) {
      console.warn('[auth] loadPermissions failed', err);
      this.isAdmin = false;
      this.isCrew = false;
      this.permissions = {};
    } finally {
      this.adminChecked = true;
    }
  }

  /** Stellt sicher, dass zum eingeloggten User ein profiles-Datensatz existiert. */
  private async ensureProfile(): Promise<void> {
    if (!this.pb || !this.user) return;
    try {
      this.profile = await this.pb
        .collection('profiles')
        .getFirstListItem<ProfileData>(`user = "${this.user.id}"`);
    } catch {
      try {
        this.profile = await this.pb.collection('profiles').create<ProfileData>({
          user: this.user.id,
          display_name: '',
          handle: '',
          locale: 'de',
        });
      } catch (err) {
        console.warn('[auth] ensureProfile create failed', err);
        this.profile = null;
      }
    }
  }

  /**
   * Fordert einen Login-Code (OTP) fuer die E-Mail an. Legt den User an, falls
   * er noch nicht existiert (Magic-Link-Registrierung). Gibt die otpId zurueck,
   * die zusammen mit dem per Mail zugestellten Code an confirmOtp() geht.
   */
  async requestLoginCode(email: string): Promise<string> {
    if (!this.pb) throw new Error('Auth ist nicht initialisiert');
    const normalized = email.trim().toLowerCase();
    // User anlegen, falls neu. Fehler (existiert bereits) bewusst ignorieren.
    try {
      const random = crypto.randomUUID() + crypto.randomUUID();
      await this.pb.collection('users').create({
        email: normalized,
        password: random,
        passwordConfirm: random,
      });
    } catch {
      // User existiert bereits, weiter mit OTP.
    }
    const req = await this.pb.collection('users').requestOTP(normalized);
    return req.otpId;
  }

  /** Schliesst den Login mit otpId + Code ab. */
  async confirmOtp(otpId: string, code: string): Promise<void> {
    if (!this.pb) throw new Error('Auth ist nicht initialisiert');
    await this.pb.collection('users').authWithOTP(otpId, code);
    this.syncUser();
    await this.loadPermissions();
  }

  async signOut(): Promise<void> {
    this.exitViewAs();
    this.pb?.authStore.clear();
    this.user = null;
    this.profile = null;
    this.isAdmin = false;
    this.isCrew = false;
    this.permissions = {};
  }

  async restoreViewAs(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!this.isAdmin || this.viewAs) return;
    const stored = localStorage.getItem(VIEW_AS_KEY);
    if (stored) await this.enterViewAs(stored);
  }

  async enterViewAs(targetUserId: string): Promise<void> {
    if (!this.pb || !this.isAdmin) return;
    try {
      const res = await this.pb.send<ViewAsResponse>(
        `/api/admin/view-as/${encodeURIComponent(targetUserId)}`,
        { method: 'GET' },
      );

      this.viewAs = {
        userId: targetUserId,
        displayName: res.displayName || res.email,
        email: res.email,
        realIsAdmin: this.isAdmin,
        realIsCrew: this.isCrew,
        realPermissions: { ...this.permissions },
      };

      this.isAdmin = res.role === 'admin';
      this.isCrew = this.isAdmin || res.is_crew === true;
      this.permissions = res.permissions ?? {};

      if (typeof window !== 'undefined') localStorage.setItem(VIEW_AS_KEY, targetUserId);
    } catch (err) {
      console.error('[auth] enterViewAs failed', err);
      this.viewAs = null;
    }
  }

  exitViewAs(): void {
    if (!this.viewAs) return;
    this.isAdmin = this.viewAs.realIsAdmin;
    this.isCrew = this.viewAs.realIsCrew;
    this.permissions = this.viewAs.realPermissions;
    this.viewAs = null;
    if (typeof window !== 'undefined') localStorage.removeItem(VIEW_AS_KEY);
  }
}

export const auth = new AuthStore();
