import { browser } from '$app/environment';

// Warenkorb ist reiner Client-State (localStorage). Preise sind nur Anzeige;
// der Server bepreist beim Checkout neu aus der DB.
export interface CartItem {
  ticketType: string;
  name: string;
  price: number; // Cents, nur zur Anzeige
  qty: number;
}

const KEY = 'platform.cart';

class CartStore {
  items = $state<CartItem[]>([]);
  private loaded = false;

  load() {
    if (!browser || this.loaded) return;
    this.loaded = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.items = JSON.parse(raw) as CartItem[];
    } catch {
      this.items = [];
    }
  }

  private persist() {
    if (!browser) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(this.items));
    } catch {
      // localStorage nicht verfuegbar
    }
  }

  get count(): number {
    return this.items.reduce((n, i) => n + i.qty, 0);
  }
  get total(): number {
    return this.items.reduce((n, i) => n + i.price * i.qty, 0);
  }

  add(item: Omit<CartItem, 'qty'>, qty = 1) {
    const ex = this.items.find((i) => i.ticketType === item.ticketType);
    if (ex) ex.qty += qty;
    else this.items.push({ ...item, qty });
    this.items = [...this.items];
    this.persist();
  }

  setQty(ticketType: string, qty: number) {
    if (qty <= 0) {
      this.items = this.items.filter((i) => i.ticketType !== ticketType);
    } else {
      const ex = this.items.find((i) => i.ticketType === ticketType);
      if (ex) ex.qty = qty;
      this.items = [...this.items];
    }
    this.persist();
  }

  remove(ticketType: string) {
    this.items = this.items.filter((i) => i.ticketType !== ticketType);
    this.persist();
  }

  clear() {
    this.items = [];
    this.persist();
  }
}

export const cart = new CartStore();
