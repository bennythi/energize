/**
 * This file was @generated using pocketbase-typegen
 */

import type PocketBase from 'pocketbase';
import type { RecordService } from 'pocketbase';

export const Collections = {
  Authorigins: '_authOrigins',
  Externalauths: '_externalAuths',
  Mfas: '_mfas',
  Otps: '_otps',
  Superusers: '_superusers',
  AccountFlags: 'account_flags',
  CrewResources: 'crew_resources',
  CrewRolePermissions: 'crew_role_permissions',
  CrewUserPermissions: 'crew_user_permissions',
  Profiles: 'profiles',
  SupportMessages: 'support_messages',
  SupportTickets: 'support_tickets',
  Users: 'users',
} as const;
export type Collections = (typeof Collections)[keyof typeof Collections];

// Alias types for improved usability
export type IsoDateString = string;
export type IsoAutoDateString = string & { readonly autodate: unique symbol };
export type RecordIdString = string;
export type FileNameString = string & { readonly filename: unique symbol };
export type HTMLString = string;

type ExpandType<T> = unknown extends T
  ? T extends unknown
    ? { expand?: unknown }
    : { expand: T }
  : { expand: T };

// System fields
export type BaseSystemFields<T = unknown> = {
  id: RecordIdString;
  collectionId: string;
  collectionName: Collections;
} & ExpandType<T>;

export type AuthSystemFields<T = unknown> = {
  email: string;
  emailVisibility: boolean;
  username: string;
  verified: boolean;
} & BaseSystemFields<T>;

// Record types for each collection

export type AuthoriginsRecord = {
  collectionRef: string;
  created: IsoAutoDateString;
  fingerprint: string;
  id: string;
  recordRef: string;
  updated: IsoAutoDateString;
};

export type ExternalauthsRecord = {
  collectionRef: string;
  created: IsoAutoDateString;
  id: string;
  provider: string;
  providerId: string;
  recordRef: string;
  updated: IsoAutoDateString;
};

export type MfasRecord = {
  collectionRef: string;
  created: IsoAutoDateString;
  id: string;
  method: string;
  recordRef: string;
  updated: IsoAutoDateString;
};

export type OtpsRecord = {
  collectionRef: string;
  created: IsoAutoDateString;
  id: string;
  password: string;
  recordRef: string;
  sentTo?: string;
  updated: IsoAutoDateString;
};

export type SuperusersRecord = {
  created: IsoAutoDateString;
  email: string;
  emailVisibility?: boolean;
  id: string;
  password: string;
  tokenKey: string;
  updated: IsoAutoDateString;
  verified?: boolean;
};

export const AccountFlagsRoleOptions = {
  user: 'user',
  admin: 'admin',
} as const;
export type AccountFlagsRoleOptions =
  (typeof AccountFlagsRoleOptions)[keyof typeof AccountFlagsRoleOptions];
export type AccountFlagsRecord<Tcrew_roles = unknown> = {
  created: IsoAutoDateString;
  crew_roles?: null | Tcrew_roles;
  id: string;
  is_crew?: boolean;
  role: AccountFlagsRoleOptions;
  updated: IsoAutoDateString;
  user: RecordIdString;
};

export type CrewResourcesRecord = {
  created: IsoAutoDateString;
  id: string;
  label?: string;
  module?: string;
  slug: string;
  sort_order?: number;
};

export const CrewRolePermissionsLevelOptions = {
  read: 'read',
  write: 'write',
  delete: 'delete',
} as const;
export type CrewRolePermissionsLevelOptions =
  (typeof CrewRolePermissionsLevelOptions)[keyof typeof CrewRolePermissionsLevelOptions];
export type CrewRolePermissionsRecord = {
  id: string;
  level: CrewRolePermissionsLevelOptions;
  resource: string;
  role: string;
};

export const CrewUserPermissionsLevelOptions = {
  read: 'read',
  write: 'write',
  delete: 'delete',
} as const;
export type CrewUserPermissionsLevelOptions =
  (typeof CrewUserPermissionsLevelOptions)[keyof typeof CrewUserPermissionsLevelOptions];
export type CrewUserPermissionsRecord = {
  id: string;
  level: CrewUserPermissionsLevelOptions;
  resource: string;
  user: RecordIdString;
};

export type ProfilesRecord = {
  avatar?: FileNameString;
  created: IsoAutoDateString;
  display_name?: string;
  handle?: string;
  id: string;
  locale?: string;
  updated: IsoAutoDateString;
  user: RecordIdString;
};

export type SupportMessagesRecord = {
  author: RecordIdString;
  body: string;
  created: IsoAutoDateString;
  id: string;
  is_staff?: boolean;
  ticket: RecordIdString;
};

export const SupportTicketsCategoryOptions = {
  account: 'account',
  ticket: 'ticket',
  cashless: 'cashless',
  wall: 'wall',
  tech: 'tech',
  other: 'other',
} as const;
export type SupportTicketsCategoryOptions =
  (typeof SupportTicketsCategoryOptions)[keyof typeof SupportTicketsCategoryOptions];

export const SupportTicketsStatusOptions = {
  open: 'open',
  in_progress: 'in_progress',
  answered: 'answered',
  closed: 'closed',
} as const;
export type SupportTicketsStatusOptions =
  (typeof SupportTicketsStatusOptions)[keyof typeof SupportTicketsStatusOptions];
export type SupportTicketsRecord = {
  category?: SupportTicketsCategoryOptions;
  created: IsoAutoDateString;
  id: string;
  status: SupportTicketsStatusOptions;
  subject: string;
  updated: IsoAutoDateString;
  user: RecordIdString;
};

export type UsersRecord = {
  avatar?: FileNameString;
  created: IsoAutoDateString;
  email: string;
  emailVisibility?: boolean;
  id: string;
  name?: string;
  password: string;
  tokenKey: string;
  updated: IsoAutoDateString;
  verified?: boolean;
};

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> &
  BaseSystemFields<Texpand>;
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> &
  BaseSystemFields<Texpand>;
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>;
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>;
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> &
  AuthSystemFields<Texpand>;
export type AccountFlagsResponse<Tcrew_roles = unknown, Texpand = unknown> = Required<
  AccountFlagsRecord<Tcrew_roles>
> &
  BaseSystemFields<Texpand>;
export type CrewResourcesResponse<Texpand = unknown> = Required<CrewResourcesRecord> &
  BaseSystemFields<Texpand>;
export type CrewRolePermissionsResponse<Texpand = unknown> = Required<CrewRolePermissionsRecord> &
  BaseSystemFields<Texpand>;
export type CrewUserPermissionsResponse<Texpand = unknown> = Required<CrewUserPermissionsRecord> &
  BaseSystemFields<Texpand>;
export type ProfilesResponse<Texpand = unknown> = Required<ProfilesRecord> &
  BaseSystemFields<Texpand>;
export type SupportMessagesResponse<Texpand = unknown> = Required<SupportMessagesRecord> &
  BaseSystemFields<Texpand>;
export type SupportTicketsResponse<Texpand = unknown> = Required<SupportTicketsRecord> &
  BaseSystemFields<Texpand>;
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>;

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
  _authOrigins: AuthoriginsRecord;
  _externalAuths: ExternalauthsRecord;
  _mfas: MfasRecord;
  _otps: OtpsRecord;
  _superusers: SuperusersRecord;
  account_flags: AccountFlagsRecord;
  crew_resources: CrewResourcesRecord;
  crew_role_permissions: CrewRolePermissionsRecord;
  crew_user_permissions: CrewUserPermissionsRecord;
  profiles: ProfilesRecord;
  support_messages: SupportMessagesRecord;
  support_tickets: SupportTicketsRecord;
  users: UsersRecord;
};

export type CollectionResponses = {
  _authOrigins: AuthoriginsResponse;
  _externalAuths: ExternalauthsResponse;
  _mfas: MfasResponse;
  _otps: OtpsResponse;
  _superusers: SuperusersResponse;
  account_flags: AccountFlagsResponse;
  crew_resources: CrewResourcesResponse;
  crew_role_permissions: CrewRolePermissionsResponse;
  crew_user_permissions: CrewUserPermissionsResponse;
  profiles: ProfilesResponse;
  support_messages: SupportMessagesResponse;
  support_tickets: SupportTicketsResponse;
  users: UsersResponse;
};

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<
  {
    // Omit AutoDate fields
    [
      K in keyof T as Extract<T[K], IsoAutoDateString> extends never ? K : never
    ]: // Convert FileNameString to File
    T[K] extends infer U
      ? U extends FileNameString | FileNameString[]
        ? U extends any[]
          ? File[]
          : File
        : U
      : never;
  },
  'id'
>;

// Create type for Auth collections
export type CreateAuth<T> = {
  id?: RecordIdString;
  email: string;
  emailVisibility?: boolean;
  password: string;
  passwordConfirm: string;
  verified?: boolean;
} & ProcessCreateAndUpdateFields<T>;

// Create type for Base collections
export type CreateBase<T> = {
  id?: RecordIdString;
} & ProcessCreateAndUpdateFields<T>;

// Update type for Auth collections
export type UpdateAuth<T> = Partial<
  Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>
> & {
  email?: string;
  emailVisibility?: boolean;
  oldPassword?: string;
  password?: string;
  passwordConfirm?: string;
  verified?: boolean;
};

// Update type for Base collections
export type UpdateBase<T> = Partial<Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>>;

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses> =
  CollectionResponses[T] extends AuthSystemFields
    ? CreateAuth<CollectionRecords[T]>
    : CreateBase<CollectionRecords[T]>;

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses> =
  CollectionResponses[T] extends AuthSystemFields
    ? UpdateAuth<CollectionRecords[T]>
    : UpdateBase<CollectionRecords[T]>;

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
  collection<T extends keyof CollectionResponses>(
    idOrName: T,
  ): RecordService<CollectionResponses[T]>;
} & PocketBase;
