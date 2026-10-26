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
  BookingArtists: 'booking_artists',
  BookingEditions: 'booking_editions',
  BookingItems: 'booking_items',
  CashlessMovements: 'cashless_movements',
  CashlessRegisters: 'cashless_registers',
  CashlessShiftDenominations: 'cashless_shift_denominations',
  CashlessShifts: 'cashless_shifts',
  CrewAvailability: 'crew_availability',
  CrewBriefings: 'crew_briefings',
  CrewEquipmentRequests: 'crew_equipment_requests',
  CrewMilestones: 'crew_milestones',
  CrewResources: 'crew_resources',
  CrewRolePermissions: 'crew_role_permissions',
  CrewUserPermissions: 'crew_user_permissions',
  Profiles: 'profiles',
  ShopOrderItems: 'shop_order_items',
  ShopOrders: 'shop_orders',
  ShopOutboundEmails: 'shop_outbound_emails',
  ShopPayments: 'shop_payments',
  ShopSettings: 'shop_settings',
  ShopTicketTypes: 'shop_ticket_types',
  ShopTickets: 'shop_tickets',
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

export const BookingArtistsStatusOptions = {
  idee: 'idee',
  anfrage: 'anfrage',
  angebot: 'angebot',
  bestaetigt: 'bestaetigt',
  abgesagt: 'abgesagt',
} as const;
export type BookingArtistsStatusOptions =
  (typeof BookingArtistsStatusOptions)[keyof typeof BookingArtistsStatusOptions];
export type BookingArtistsRecord<Tnot_needed = unknown> = {
  agency?: string;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
  contract_signed?: boolean;
  created: IsoAutoDateString;
  day?: string;
  edition: RecordIdString;
  fee?: number;
  fee_note?: string;
  fee_paid?: boolean;
  id: string;
  invoice_received?: boolean;
  name: string;
  not_needed?: null | Tnot_needed;
  notes?: string;
  rider_files?: FileNameString[];
  rider_hospitality?: string;
  rider_tech?: string;
  sanity_slug?: string;
  slot_end?: string;
  slot_start?: string;
  stage?: string;
  status: BookingArtistsStatusOptions;
  updated: IsoAutoDateString;
  updated_by?: RecordIdString;
};

export type BookingEditionsRecord = {
  archived?: boolean;
  budget?: number;
  created: IsoAutoDateString;
  currency?: string;
  end_date?: string;
  id: string;
  name: string;
  start_date?: string;
  updated: IsoAutoDateString;
  year: number;
};

export const BookingItemsKindOptions = {
  anreise: 'anreise',
  hotel: 'hotel',
  transfer: 'transfer',
  zusatzkosten: 'zusatzkosten',
} as const;
export type BookingItemsKindOptions =
  (typeof BookingItemsKindOptions)[keyof typeof BookingItemsKindOptions];
export type BookingItemsRecord = {
  artist: RecordIdString;
  booked?: boolean;
  cost?: number;
  created: IsoAutoDateString;
  end_at?: string;
  id: string;
  kind: BookingItemsKindOptions;
  location?: string;
  notes?: string;
  paid?: boolean;
  persons?: number;
  provider?: string;
  reference?: string;
  start_at?: string;
  title: string;
  updated: IsoAutoDateString;
  updated_by?: RecordIdString;
};

export const CashlessMovementsKindOptions = {
  withdrawal: 'withdrawal',
  exchange_in: 'exchange_in',
  exchange_out: 'exchange_out',
} as const;
export type CashlessMovementsKindOptions =
  (typeof CashlessMovementsKindOptions)[keyof typeof CashlessMovementsKindOptions];
export type CashlessMovementsRecord = {
  amount_cents: number;
  counterpart_register?: RecordIdString;
  created: IsoAutoDateString;
  id: string;
  kind: CashlessMovementsKindOptions;
  note?: string;
  performed_at: IsoDateString;
  performed_by_a: RecordIdString;
  performed_by_b: RecordIdString;
  shift: RecordIdString;
};

export type CashlessRegistersRecord = {
  created: IsoAutoDateString;
  id: string;
  is_active?: boolean;
  location?: string;
  name: string;
  updated: IsoAutoDateString;
};

export const CashlessShiftDenominationsKindOptions = {
  start: 'start',
  end: 'end',
} as const;
export type CashlessShiftDenominationsKindOptions =
  (typeof CashlessShiftDenominationsKindOptions)[keyof typeof CashlessShiftDenominationsKindOptions];
export type CashlessShiftDenominationsRecord = {
  count?: number;
  denomination_cents: number;
  id: string;
  kind: CashlessShiftDenominationsKindOptions;
  shift: RecordIdString;
};

export type CashlessShiftsRecord = {
  closed_at?: IsoDateString;
  closed_by_a?: RecordIdString;
  closed_by_b?: RecordIdString;
  created: IsoAutoDateString;
  ending_cents?: number;
  has_ending?: boolean;
  id: string;
  note?: string;
  opened_at: IsoDateString;
  opened_by_a: RecordIdString;
  opened_by_b: RecordIdString;
  register: RecordIdString;
  starting_cents?: number;
  updated: IsoAutoDateString;
};

export const CrewAvailabilityKindOptions = {
  all_day: 'all_day',
  window: 'window',
} as const;
export type CrewAvailabilityKindOptions =
  (typeof CrewAvailabilityKindOptions)[keyof typeof CrewAvailabilityKindOptions];
export type CrewAvailabilityRecord = {
  created: IsoAutoDateString;
  end_at: IsoDateString;
  id: string;
  kind: CrewAvailabilityKindOptions;
  note?: string;
  start_at: IsoDateString;
  updated: IsoAutoDateString;
  user: RecordIdString;
};

export type CrewBriefingsRecord = {
  body?: string;
  created: IsoAutoDateString;
  department: string;
  id: string;
  pinned?: boolean;
  title: string;
  updated: IsoAutoDateString;
  updated_by?: RecordIdString;
};

export const CrewEquipmentRequestsEquipmentOptions = {
  razor: 'razor',
  headphones: 'headphones',
  inear: 'inear',
} as const;
export type CrewEquipmentRequestsEquipmentOptions =
  (typeof CrewEquipmentRequestsEquipmentOptions)[keyof typeof CrewEquipmentRequestsEquipmentOptions];
export type CrewEquipmentRequestsRecord = {
  created: IsoAutoDateString;
  equipment: CrewEquipmentRequestsEquipmentOptions;
  event_day: string;
  id: string;
  note?: string;
  updated: IsoAutoDateString;
  user: RecordIdString;
};

export type CrewMilestonesRecord = {
  category: string;
  completed_at?: IsoDateString;
  completed_by?: RecordIdString;
  created: IsoAutoDateString;
  created_by?: RecordIdString;
  description?: string;
  due_date: string;
  id: string;
  title: string;
  updated: IsoAutoDateString;
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

export type ShopOrderItemsRecord = {
  created: IsoAutoDateString;
  id: string;
  line_total: number;
  order: RecordIdString;
  qty: number;
  ticket_type: RecordIdString;
  unit_price: number;
  updated: IsoAutoDateString;
};

export const ShopOrdersStatusOptions = {
  draft: 'draft',
  pending: 'pending',
  paid: 'paid',
  cancelled: 'cancelled',
  refunded: 'refunded',
  expired: 'expired',
} as const;
export type ShopOrdersStatusOptions =
  (typeof ShopOrdersStatusOptions)[keyof typeof ShopOrdersStatusOptions];

export const ShopOrdersProviderOptions = {
  mollie: 'mollie',
  stripe: 'stripe',
  stub: 'stub',
} as const;
export type ShopOrdersProviderOptions =
  (typeof ShopOrdersProviderOptions)[keyof typeof ShopOrdersProviderOptions];
export type ShopOrdersRecord = {
  buyer: RecordIdString;
  created: IsoAutoDateString;
  currency: string;
  expires_at?: IsoDateString;
  id: string;
  paid_at?: IsoDateString;
  provider?: ShopOrdersProviderOptions;
  provider_payment_id?: string;
  status: ShopOrdersStatusOptions;
  subtotal?: number;
  total?: number;
  updated: IsoAutoDateString;
};

export const ShopOutboundEmailsStatusOptions = {
  queued: 'queued',
  sending: 'sending',
  sent: 'sent',
  failed: 'failed',
} as const;
export type ShopOutboundEmailsStatusOptions =
  (typeof ShopOutboundEmailsStatusOptions)[keyof typeof ShopOutboundEmailsStatusOptions];
export type ShopOutboundEmailsRecord<Tpayload = unknown> = {
  attempts?: number;
  id: string;
  last_error?: string;
  locale?: string;
  payload?: null | Tpayload;
  send_after?: IsoDateString;
  status: ShopOutboundEmailsStatusOptions;
  template: string;
  to: string;
};

export const ShopPaymentsProviderOptions = {
  mollie: 'mollie',
  stripe: 'stripe',
  stub: 'stub',
} as const;
export type ShopPaymentsProviderOptions =
  (typeof ShopPaymentsProviderOptions)[keyof typeof ShopPaymentsProviderOptions];

export const ShopPaymentsStatusOptions = {
  open: 'open',
  paid: 'paid',
  failed: 'failed',
  expired: 'expired',
  refunded: 'refunded',
} as const;
export type ShopPaymentsStatusOptions =
  (typeof ShopPaymentsStatusOptions)[keyof typeof ShopPaymentsStatusOptions];
export type ShopPaymentsRecord<Traw = unknown> = {
  amount?: number;
  created: IsoAutoDateString;
  currency?: string;
  id: string;
  order: RecordIdString;
  provider?: ShopPaymentsProviderOptions;
  provider_ref: string;
  raw?: null | Traw;
  status?: ShopPaymentsStatusOptions;
  updated: IsoAutoDateString;
};

export const ShopSettingsActiveProviderOptions = {
  mollie: 'mollie',
  stripe: 'stripe',
  both: 'both',
  stub: 'stub',
} as const;
export type ShopSettingsActiveProviderOptions =
  (typeof ShopSettingsActiveProviderOptions)[keyof typeof ShopSettingsActiveProviderOptions];
export type ShopSettingsRecord = {
  active_provider: ShopSettingsActiveProviderOptions;
  default_currency: string;
  id: string;
  module_enabled?: boolean;
  order_ttl_minutes?: number;
  support_email?: string;
};

export type ShopTicketTypesRecord = {
  active?: boolean;
  currency: string;
  description?: string;
  id: string;
  name: string;
  per_order_limit?: number;
  price: number;
  quota?: number;
  reserved?: number;
  sales_end?: IsoDateString;
  sales_start?: IsoDateString;
  slug: string;
  sold?: number;
  sort?: number;
};

export const ShopTicketsStatusOptions = {
  valid: 'valid',
  used: 'used',
  void: 'void',
} as const;
export type ShopTicketsStatusOptions =
  (typeof ShopTicketsStatusOptions)[keyof typeof ShopTicketsStatusOptions];
export type ShopTicketsRecord = {
  code: string;
  created: IsoAutoDateString;
  holder_name?: string;
  id: string;
  order: RecordIdString;
  qr_token?: string;
  scanned_by?: RecordIdString;
  scanned_gate?: string;
  status: ShopTicketsStatusOptions;
  ticket_type: RecordIdString;
  token_version?: number;
  updated: IsoAutoDateString;
  used_at?: IsoDateString;
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
export type BookingArtistsResponse<Tnot_needed = unknown, Texpand = unknown> = Required<
  BookingArtistsRecord<Tnot_needed>
> &
  BaseSystemFields<Texpand>;
export type BookingEditionsResponse<Texpand = unknown> = Required<BookingEditionsRecord> &
  BaseSystemFields<Texpand>;
export type BookingItemsResponse<Texpand = unknown> = Required<BookingItemsRecord> &
  BaseSystemFields<Texpand>;
export type CashlessMovementsResponse<Texpand = unknown> = Required<CashlessMovementsRecord> &
  BaseSystemFields<Texpand>;
export type CashlessRegistersResponse<Texpand = unknown> = Required<CashlessRegistersRecord> &
  BaseSystemFields<Texpand>;
export type CashlessShiftDenominationsResponse<Texpand = unknown> =
  Required<CashlessShiftDenominationsRecord> & BaseSystemFields<Texpand>;
export type CashlessShiftsResponse<Texpand = unknown> = Required<CashlessShiftsRecord> &
  BaseSystemFields<Texpand>;
export type CrewAvailabilityResponse<Texpand = unknown> = Required<CrewAvailabilityRecord> &
  BaseSystemFields<Texpand>;
export type CrewBriefingsResponse<Texpand = unknown> = Required<CrewBriefingsRecord> &
  BaseSystemFields<Texpand>;
export type CrewEquipmentRequestsResponse<Texpand = unknown> =
  Required<CrewEquipmentRequestsRecord> & BaseSystemFields<Texpand>;
export type CrewMilestonesResponse<Texpand = unknown> = Required<CrewMilestonesRecord> &
  BaseSystemFields<Texpand>;
export type CrewResourcesResponse<Texpand = unknown> = Required<CrewResourcesRecord> &
  BaseSystemFields<Texpand>;
export type CrewRolePermissionsResponse<Texpand = unknown> = Required<CrewRolePermissionsRecord> &
  BaseSystemFields<Texpand>;
export type CrewUserPermissionsResponse<Texpand = unknown> = Required<CrewUserPermissionsRecord> &
  BaseSystemFields<Texpand>;
export type ProfilesResponse<Texpand = unknown> = Required<ProfilesRecord> &
  BaseSystemFields<Texpand>;
export type ShopOrderItemsResponse<Texpand = unknown> = Required<ShopOrderItemsRecord> &
  BaseSystemFields<Texpand>;
export type ShopOrdersResponse<Texpand = unknown> = Required<ShopOrdersRecord> &
  BaseSystemFields<Texpand>;
export type ShopOutboundEmailsResponse<Tpayload = unknown, Texpand = unknown> = Required<
  ShopOutboundEmailsRecord<Tpayload>
> &
  BaseSystemFields<Texpand>;
export type ShopPaymentsResponse<Traw = unknown, Texpand = unknown> = Required<
  ShopPaymentsRecord<Traw>
> &
  BaseSystemFields<Texpand>;
export type ShopSettingsResponse<Texpand = unknown> = Required<ShopSettingsRecord> &
  BaseSystemFields<Texpand>;
export type ShopTicketTypesResponse<Texpand = unknown> = Required<ShopTicketTypesRecord> &
  BaseSystemFields<Texpand>;
export type ShopTicketsResponse<Texpand = unknown> = Required<ShopTicketsRecord> &
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
  booking_artists: BookingArtistsRecord;
  booking_editions: BookingEditionsRecord;
  booking_items: BookingItemsRecord;
  cashless_movements: CashlessMovementsRecord;
  cashless_registers: CashlessRegistersRecord;
  cashless_shift_denominations: CashlessShiftDenominationsRecord;
  cashless_shifts: CashlessShiftsRecord;
  crew_availability: CrewAvailabilityRecord;
  crew_briefings: CrewBriefingsRecord;
  crew_equipment_requests: CrewEquipmentRequestsRecord;
  crew_milestones: CrewMilestonesRecord;
  crew_resources: CrewResourcesRecord;
  crew_role_permissions: CrewRolePermissionsRecord;
  crew_user_permissions: CrewUserPermissionsRecord;
  profiles: ProfilesRecord;
  shop_order_items: ShopOrderItemsRecord;
  shop_orders: ShopOrdersRecord;
  shop_outbound_emails: ShopOutboundEmailsRecord;
  shop_payments: ShopPaymentsRecord;
  shop_settings: ShopSettingsRecord;
  shop_ticket_types: ShopTicketTypesRecord;
  shop_tickets: ShopTicketsRecord;
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
  booking_artists: BookingArtistsResponse;
  booking_editions: BookingEditionsResponse;
  booking_items: BookingItemsResponse;
  cashless_movements: CashlessMovementsResponse;
  cashless_registers: CashlessRegistersResponse;
  cashless_shift_denominations: CashlessShiftDenominationsResponse;
  cashless_shifts: CashlessShiftsResponse;
  crew_availability: CrewAvailabilityResponse;
  crew_briefings: CrewBriefingsResponse;
  crew_equipment_requests: CrewEquipmentRequestsResponse;
  crew_milestones: CrewMilestonesResponse;
  crew_resources: CrewResourcesResponse;
  crew_role_permissions: CrewRolePermissionsResponse;
  crew_user_permissions: CrewUserPermissionsResponse;
  profiles: ProfilesResponse;
  shop_order_items: ShopOrderItemsResponse;
  shop_orders: ShopOrdersResponse;
  shop_outbound_emails: ShopOutboundEmailsResponse;
  shop_payments: ShopPaymentsResponse;
  shop_settings: ShopSettingsResponse;
  shop_ticket_types: ShopTicketTypesResponse;
  shop_tickets: ShopTicketsResponse;
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
