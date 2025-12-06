import { InventoryItem, ConsumptionLog, Subscription, ItemCategory, User, RegisteredUser } from '../types';

// Keys for LocalStorage
const STORAGE_KEYS = {
  INVENTORY: 'ruralmed_inventory',
  LOGS: 'ruralmed_logs',
  SUBSCRIPTION: 'ruralmed_sub',
  USER_SESSION: 'ruralmed_user_session',
  LAST_SYNC: 'ruralmed_last_sync',
  USERS: 'ruralmed_registered_users',
  OTP_REGISTRY: 'ruralmed_otp_registry' // New key for OTPs
};

// Helper to get fresh seed data (prevents mutation issues)
const getSeedInventory = (): InventoryItem[] => [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    quantity: 450,
    minLevel: 100,
    batchNumber: 'BATCH-001',
    expiryDate: new Date(Date.now() + 86400000 * 365).toISOString(),
    category: ItemCategory.ESSENTIAL,
    lastUpdated: new Date().toISOString(),
    isForSale: true,
    price: 5.00
  },
  {
    id: '2',
    name: 'Amoxicillin 250mg',
    quantity: 20,
    minLevel: 50,
    batchNumber: 'BATCH-002',
    expiryDate: new Date(Date.now() + 86400000 * 180).toISOString(),
    category: ItemCategory.CRITICAL,
    lastUpdated: new Date().toISOString(),
    isForSale: true,
    price: 15.50
  },
  {
    id: '3',
    name: 'Oral Rehydration Salts',
    quantity: 15,
    minLevel: 30,
    batchNumber: 'BATCH-003',
    expiryDate: new Date(Date.now() - 86400000 * 5).toISOString(), // Expired
    category: ItemCategory.ESSENTIAL,
    lastUpdated: new Date().toISOString(),
    isForSale: false,
    price: 0
  },
  {
    id: '4',
    name: 'Surgical Gloves (Pair)',
    quantity: 200,
    minLevel: 50,
    batchNumber: 'BATCH-004',
    expiryDate: new Date(Date.now() + 86400000 * 700).toISOString(),
    category: ItemCategory.NON_ESSENTIAL,
    lastUpdated: new Date().toISOString(),
    isForSale: true,
    price: 2.00
  }
];

const getSeedSubscription = (): Subscription => ({
  isActive: true,
  expiryDate: new Date(Date.now() + 86400000 * 15).toISOString(), // 15 days left
  lastPaymentMethod: 'MoMo'
});

const getSeedUsers = (): RegisteredUser[] => [
  {
    id: 'admin-001',
    username: 'admin',
    pin: '8888',
    role: 'Admin',
    phone: '0550000000',
    email: 'admin@ruralmed.com'
  },
  {
    id: 'staff-001',
    username: 'staff',
    pin: '1111',
    role: 'Staff',
    phone: '0551111111',
    email: 'staff@ruralmed.com'
  }
];

interface OtpRecord {
  code: string;
  expiresAt: number;
}

export const StorageService = {
  // --- Inventory ---
  getInventory: (): InventoryItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    // Return parsed data or a FRESH copy of seed data
    return data ? JSON.parse(data) : getSeedInventory();
  },

  saveInventory: (items: InventoryItem[]) => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  },

  addItem: (item: InventoryItem) => {
    const items = StorageService.getInventory();
    items.push(item);
    StorageService.saveInventory(items);
  },

  updateItem: (updatedItem: InventoryItem) => {
    const items = StorageService.getInventory();
    const index = items.findIndex(i => i.id === updatedItem.id);
    if (index !== -1) {
      items[index] = updatedItem;
      StorageService.saveInventory(items);
    }
  },

  deleteItem: (id: string) => {
    const items = StorageService.getInventory();
    const filtered = items.filter(i => i.id !== id);
    StorageService.saveInventory(filtered);
  },

  // --- Logs ---
  getLogs: (): ConsumptionLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },

  addLog: (log: ConsumptionLog) => {
    const logs = StorageService.getLogs();
    logs.push(log);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  // --- Subscription ---
  getSubscription: (): Subscription => {
    const data = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
    return data ? JSON.parse(data) : getSeedSubscription();
  },

  updateSubscription: (sub: Subscription) => {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(sub));
  },
  
  // --- Auth & Users ---
  getRegisteredUsers: (): RegisteredUser[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (data) {
      return JSON.parse(data);
    }
    // Initialize with seed users if none exist
    const seeds = getSeedUsers();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seeds));
    return seeds;
  },

  saveRegisteredUsers: (users: RegisteredUser[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  registerUser: (user: RegisteredUser): boolean => {
    const users = StorageService.getRegisteredUsers();
    if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
      return false; // Username taken
    }
    users.push(user);
    StorageService.saveRegisteredUsers(users);
    return true;
  },

  findUserByContact: (contact: string): RegisteredUser | null => {
    const users = StorageService.getRegisteredUsers();
    return users.find(u => u.email === contact || u.phone === contact) || null;
  },

  resetUserPin: (userId: string, newPin: string) => {
    const users = StorageService.getRegisteredUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].pin = newPin;
      StorageService.saveRegisteredUsers(users);
    }
  },

  getUserSession: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    return data ? JSON.parse(data) : null;
  },

  saveUserSession: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(user));
  },

  login: (username: string, pin: string): User | null => {
    const users = StorageService.getRegisteredUsers();
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin);
    
    if (found) {
      const sessionUser: User = { id: found.id, name: found.username, role: found.role };
      StorageService.saveUserSession(sessionUser);
      return sessionUser;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  },

  // --- OTP Management (Real Logic Simulation) ---
  requestPasswordResetOtp: async (contact: string): Promise<boolean> => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit random
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    
    const registryData = localStorage.getItem(STORAGE_KEYS.OTP_REGISTRY);
    const registry: Record<string, OtpRecord> = registryData ? JSON.parse(registryData) : {};
    
    registry[contact] = { code: otp, expiresAt };
    localStorage.setItem(STORAGE_KEYS.OTP_REGISTRY, JSON.stringify(registry));
    
    // Simulate Network Delay (e.g. calling an SMS Gateway)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // ---------------------------------------------------------
    // REAL WORLD INTEGRATION POINT
    // In a production environment, you would call your backend here:
    // await fetch('https://api.ruralmed.com/v1/sms/send', {
    //   method: 'POST',
    //   body: JSON.stringify({ to: contact, message: `Your RuralMed code is: ${otp}` })
    // });
    // ---------------------------------------------------------

    // For this frontend-only environment, we log the OTP to the console 
    // so the developer/tester can access it, simulating 'receiving' it on a phone.
    console.log(`%c 📨 SMS SENT TO ${contact}: [ ${otp} ] `, 'background: #22c55e; color: white; padding: 4px; font-weight: bold; border-radius: 4px;');
    
    return true;
  },

  verifyPasswordResetOtp: (contact: string, code: string): boolean => {
    const registryData = localStorage.getItem(STORAGE_KEYS.OTP_REGISTRY);
    if (!registryData) return false;

    const registry: Record<string, OtpRecord> = JSON.parse(registryData);
    const record = registry[contact];

    if (!record) return false;
    if (Date.now() > record.expiresAt) return false; // Expired
    
    // Check code
    if (record.code === code) {
      // Consume the OTP so it can't be used again
      delete registry[contact];
      localStorage.setItem(STORAGE_KEYS.OTP_REGISTRY, JSON.stringify(registry));
      return true;
    }

    return false;
  },

  // --- Reset for Demo ---
  resetData: () => {
    localStorage.clear();
    // Explicitly write fresh seed data to storage to reset state
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(getSeedInventory()));
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(getSeedSubscription()));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(getSeedUsers()));
  },

  // --- Sync Simulation ---
  getLastSync: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  },

  syncWithServer: async (): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    return true;
  }
};