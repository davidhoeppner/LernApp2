// uuidFallback - small wrapper to expose v4 alias
export function v4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default { v4 };
