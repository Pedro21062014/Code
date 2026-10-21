/** Local-only document store. Data stays in this browser's localStorage; no server sync. */
type Data = Record<string, any>;
type State = { collections: Record<string, Record<string, Data>> };
type DocRef = { kind: 'doc'; collection: string; id: string };
type ColRef = { kind: 'collection'; collection: string };
type QueryRef = { kind: 'query'; collection: string; constraints: Constraint[] };
type Constraint = { kind: 'where'; field: string; op: string; value: any } | { kind: 'limit'; count: number };
type Transform = { __localTransform: 'increment' | 'arrayUnion' | 'arrayRemove'; values: any[] };
const KEY = 'codegem-local-database-v1';
const memory: State = { collections: {} };
const tx = (kind: Transform['__localTransform'], values: any[]): Transform => ({ __localTransform: kind, values });

function read(): State {
  if (typeof window === 'undefined') return memory;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return memory;
    const value = JSON.parse(raw);
    return value && value.collections ? value : memory;
  } catch { return memory; }
}
function write(state: State) {
  if (typeof window === 'undefined') { Object.assign(memory, state); return; }
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (error) { console.warn('Local storage unavailable or full; changes may not persist.', error); }
}
function docs(state: State, name: string) {
  if (!state.collections[name]) state.collections[name] = {};
  return state.collections[name];
}
function apply(current: Data, updates: Data): Data {
  const result = { ...current };
  for (const [key, value] of Object.entries(updates || {})) {
    if (value && typeof value === 'object' && '__localTransform' in value) {
      const t = value as Transform;
      if (t.__localTransform === 'increment') result[key] = (Number(result[key]) || 0) + (Number(t.values[0]) || 0);
      else if (t.__localTransform === 'arrayUnion') {
        const list = Array.isArray(result[key]) ? [...result[key]] : [];
        for (const item of t.values) if (!list.includes(item)) list.push(item);
        result[key] = list;
      } else if (t.__localTransform === 'arrayRemove') {
        const list = Array.isArray(result[key]) ? result[key] : [];
        result[key] = list.filter((item: any) => !t.values.includes(item));
      }
    } else result[key] = value;
  }
  return result;
}
function matches(data: Data, c: Extract<Constraint, {kind:'where'}>) {
  const value = data?.[c.field];
  if (c.op === '==') return value === c.value;
  if (c.op === '!=') return value !== c.value;
  if (c.op === 'array-contains') return Array.isArray(value) && value.includes(c.value);
  if (c.op === 'in') return Array.isArray(c.value) && c.value.includes(value);
  return false;
}

export const db = { localOnly: true };
export const doc = (_db: any, name: string, id: string | number): DocRef => ({ kind: 'doc', collection: name, id: String(id) });
export const collection = (_db: any, name: string): ColRef => ({ kind: 'collection', collection: name });
export const where = (field: string, op: string, value: any): Constraint => ({ kind: 'where', field, op, value });
export const limit = (count: number): Constraint => ({ kind: 'limit', count });
export const query = (ref: ColRef | QueryRef, ...constraints: Constraint[]): QueryRef =>
  ({ kind: 'query', collection: ref.collection, constraints: [...('constraints' in ref ? ref.constraints : []), ...constraints] });
export const serverTimestamp = (): string => new Date().toISOString();
export const increment = (amount: number): Transform => tx('increment', [amount]);
export const arrayUnion = (...values: any[]): Transform => tx('arrayUnion', values);
export const arrayRemove = (...values: any[]): Transform => tx('arrayRemove', values);

export async function getDoc(ref: DocRef) {
  const value = read().collections[ref.collection]?.[ref.id];
  return { id: ref.id, exists: () => value !== undefined, data: () => value ? { ...value } : undefined };
}
export async function setDoc(ref: DocRef, value: Data, options?: { merge?: boolean }) {
  const state = read();
  const collectionData = docs(state, ref.collection);
  collectionData[ref.id] = options?.merge ? apply(collectionData[ref.id] || {}, value) : apply({}, value);
  write(state);
}
export async function updateDoc(ref: DocRef, updates: Data) {
  const state = read();
  const collectionData = docs(state, ref.collection);
  if (!collectionData[ref.id]) throw new Error('Documento local não encontrado.');
  collectionData[ref.id] = apply(collectionData[ref.id], updates);
  write(state);
}
export async function deleteDoc(ref: DocRef) {
  const state = read();
  delete docs(state, ref.collection)[ref.id];
  write(state);
}
export async function getDocs(ref: ColRef | QueryRef) {
  const state = read();
  const constraints = 'constraints' in ref ? ref.constraints : [];
  const filters = constraints.filter((c): c is Extract<Constraint, {kind:'where'}> => c.kind === 'where');
  const max = constraints.find((c): c is Extract<Constraint, {kind:'limit'}> => c.kind === 'limit')?.count;
  let entries = Object.entries(state.collections[ref.collection] || {}).filter(([, value]) => filters.every(c => matches(value, c)));
  if (max !== undefined) entries = entries.slice(0, Math.max(0, max));
  const snapshots = entries.map(([id, value]) => ({ id, data: () => ({ ...value }) }));
  return { docs: snapshots, size: snapshots.length, empty: snapshots.length === 0, forEach: (fn: (snapshot: typeof snapshots[number]) => void) => snapshots.forEach(fn) };
}
