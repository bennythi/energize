import { browser } from '$app/environment';
// Statisch eingebaut statt $env/dynamic: _app/env.js hat keinen Hash im
// Namen und kann im Browser veraltet gecacht sein (z.B. von der alten Seite).
import { PUBLIC_PB_URL } from '$env/static/public';
import { createPbClient, type TypedPocketBase } from '@platform/pb-client';

const PB_URL = PUBLIC_PB_URL;

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
      // requestKey null: init() und onChange() laden parallel; mit dem
      // SDK-Auto-Cancel wuerde der erste Request abgebrochen und kurz
      // "kein Crew" melden (Gates leiten dann faelschlich weg).
      const res = await this.pb.send<MyPermissionsResponse>('/api/crew/my-permissions', {
        method: 'GET',
        requestKey: null,
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

  private profilePromise: Promise<void> | null = null;

  /**
   * Stellt sicher, dass zum eingeloggten User ein profiles-Datensatz existiert.
   * init() und onChange() rufen das parallel auf; ein gemeinsames Promise
   * verhindert, dass beide gleichzeitig ein Profil anlegen wollen.
   */
  private ensureProfile(): Promise<void> {
    this.profilePromise ??= this.loadOrCreateProfile().finally(() => {
      this.profilePromise = null;
    });
    return this.profilePromise;
  }

  private async loadOrCreateProfile(): Promise<void> {
    if (!this.pb || !this.user) return;
    try {
      this.profile = await this.pb
        .collection('profiles')
        .getFirstListItem<ProfileData>(`user = "${this.user.id}"`, { requestKey: null });
    } catch {
      try {
        this.profile = await this.pb
          .collection('profiles')
          .create<ProfileData>(
            { user: this.user.id, display_name: '', handle: '', locale: 'de' },
            { requestKey: null },
          );
      } catch (err) {
        console.warn('[auth] ensureProfile create failed', err);
        this.profile = null;
      }
    }
  }

  /**
   * Fordert einen Login-Code (OTP) fuer die E-Mail an. Accounts legt nur ein
   * Admin an; fuer unbekannte Adressen antwortet Pocketbase trotzdem mit einer
   * otpId (keine Enumeration), es kommt dann einfach keine Mail.
   */
  async requestLoginCode(email: string): Promise<string> {
    if (!this.pb) throw new Error('Auth ist nicht initialisiert');
    const normalized = email.trim().toLowerCase();
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

  /** Login mit E-Mail + Passwort (Alternative zum Mail-Code). */
  async signInWithPassword(email: string, password: string): Promise<void> {
    if (!this.pb) throw new Error('Auth ist nicht initialisiert');
    await this.pb.collection('users').authWithPassword(email.trim().toLowerCase(), password);
    this.syncUser();
    await this.loadPermissions();
  }

  /**
   * Setzt ein neues Passwort. Pocketbase verlangt das alte nur, wenn eines
   * gesetzt war; nach der Aenderung sind alte Tokens ungueltig, daher neu einloggen.
   */
  async changePassword(oldPassword: string, password: string): Promise<void> {
    if (!this.pb || !this.user) throw new Error('Nicht eingeloggt');
    const email = this.user.email;
    await this.pb
      .collection('users')
      .update(this.user.id, { oldPassword, password, passwordConfirm: password });
    await this.pb.collection('users').authWithPassword(email, password);
    this.syncUser();
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
