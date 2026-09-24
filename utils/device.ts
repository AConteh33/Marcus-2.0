const DEVICE_ID_KEY = 'qb_device_id';

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

const TABLE_KEY = 'qb_table_number';

export function getTableNumber(): number {
  const params = new URLSearchParams(window.location.search);
  const urlTable = params.get('table');
  if (urlTable) {
    const num = parseInt(urlTable, 10);
    if (!isNaN(num) && num > 0) {
      localStorage.setItem(TABLE_KEY, String(num));
      return num;
    }
  }
  const stored = localStorage.getItem(TABLE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}
