/* PocketBase JS hooks type hints (ES5 runtime). */

type AnyRecord = Record<string, any>;

declare const __hooks: string;
declare const __scripts: string;
declare const __pbjs: string;

declare const $os: {
  getenv(name: string): string | null;
};

declare const $http: {
  send(options: AnyRecord): {
    status: number;
    body?: string;
    json?: AnyRecord;
    headers?: AnyRecord;
  };
};

declare const $security: {
  randomBytes?(size: number): string;
  hs256?(data: string, secret: string): string;
  equal?(a: string, b: string): boolean;
};

interface PocketBaseCollection {
  id?: string;
  name?: string;
}

interface PocketBaseRecord {
  id: string;
  get(field: string): any;
  set(field: string, value: any): void;
}

interface PocketBaseApp {
  findRecordsByFilter(
    collection: string,
    filter: string,
    sort?: string,
    limit?: number,
    offset?: number,
    params?: AnyRecord,
  ): PocketBaseRecord[];
  findRecordById(
    collection: string,
    id: string,
    options?: AnyRecord,
  ): PocketBaseRecord;
  findFirstRecordByFilter(
    collection: string,
    filter: string,
    params?: AnyRecord,
  ): PocketBaseRecord;
  findCollectionByNameOrId(nameOrId: string): PocketBaseCollection;
  save(record: PocketBaseRecord): void;
  delete(record: PocketBaseRecord): void;
  countRecords(collection: string): number;
  [key: string]: any;
}

declare const $app: PocketBaseApp;

type PocketBaseHeaders = {
  get(name: string): string | undefined;
  set?(name: string, value: string): void;
};

interface PocketBaseRequest {
  method?: string;
  path?: string;
  url?: { path?: string };
  header?: PocketBaseHeaders;
  remoteAddr?: string;
  remoteIP?: string;
  pathValue?(name: string): string | undefined;
}

interface PocketBaseResponse {
  header(): PocketBaseHeaders;
}

interface PocketBaseContext {
  request: PocketBaseRequest;
  response?: PocketBaseResponse | (() => PocketBaseResponse);
  auth?: PocketBaseRecord | null;
  json(status: number, data: AnyRecord): any;
  noContent?(status: number): any;
  redirect?(status: number, url: string): any;
  realIP?(): string;
  requestInfo?(): AnyRecord;
}

interface PocketBaseRecordEvent {
  collection?: PocketBaseCollection;
  record?: PocketBaseRecord;
  auth?: PocketBaseRecord | null;
  next(): any;
}

declare function routerAdd(
  method: string,
  path: string,
  handler: (c: PocketBaseContext) => any,
): void;

declare function routerUse(
  handler:
    | ((next: (c: PocketBaseContext) => any) => (c: PocketBaseContext) => any)
    | ((e: any) => any),
): void;

declare function cronAdd(
  name: string,
  schedule: string,
  handler: () => any,
): void;

declare function onRecordCreateRequest(
  handler: (e: PocketBaseRecordEvent) => any,
): void;
declare function onRecordUpdateRequest(
  handler: (e: PocketBaseRecordEvent) => any,
): void;
declare function onRecordAfterCreateSuccess(
  handler: (e: PocketBaseRecordEvent) => any,
): void;
declare function onRecordAfterUpdateSuccess(
  handler: (e: PocketBaseRecordEvent) => any,
): void;

declare const Record: {
  new (collection: PocketBaseCollection, data?: AnyRecord): PocketBaseRecord;
};

declare class BadRequestError extends Error {
  constructor(message?: string);
}

declare class ForbiddenError extends Error {
  constructor(message?: string);
}
