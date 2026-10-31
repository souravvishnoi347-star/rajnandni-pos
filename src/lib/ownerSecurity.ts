import { supabase } from "./supabaseClient";

export const MASTER_OWNER_PIN = "Indu@123";
export const QUICK_OWNER_PIN = "7898";
export const OWNER_PHONE_NUMBER = "+91 7464987898";
export const OWNER_NAME = "Indu (Rajnandini Showroom Owner)";

// 5-minute rolling window for OTP
const TIME_STEP_MS = 5 * 60 * 1000;

export interface InventoryAuthRequest {
  id: string;
  actionType: "stock_change" | "price_change" | "product_edit" | "product_delete" | "bill_edit" | "bill_delete" | "bill_amount_change";
  productId: string;
  productName: string;
  sku: string;
  oldValue: string;
  newValue: string;
  reason: string;
  staffName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt?: string;
  approvedVia?: "otp" | "remote_click" | "master_pin";
}

export interface InventoryAuditLog {
  id: string;
  actionType: "stock_change" | "price_change" | "product_edit" | "product_delete" | "bill_edit" | "bill_delete" | "bill_amount_change";
  productId: string;
  productName: string;
  sku: string;
  oldValue: string;
  newValue: string;
  reason: string;
  staffName: string;
  approvedVia: "otp" | "remote_click" | "master_pin";
  timestamp: string;
}

/**
 * Deterministic rolling OTP calculation based on time window
 */
function getOtpForStep(step: number): string {
  const seed = `RAJNANDINI_HARIDWAR_SECURE_AUTH_STEP_${step}_TOKEN_2026`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const positive = Math.abs(hash);
  // Guarantee 6-digit number between 100000 and 999999
  const code = (100000 + (positive % 900000)).toString();
  return code;
}

/**
 * Returns active live OTP and remaining countdown
 */
export function getCurrentOwnerOtp(): {
  otp: string;
  formattedOtp: string;
  secondsRemaining: number;
  totalSeconds: number;
} {
  const now = Date.now();
  const step = Math.floor(now / TIME_STEP_MS);
  const code = getOtpForStep(step);
  const msElapsedInStep = now % TIME_STEP_MS;
  const secondsRemaining = Math.max(1, Math.floor((TIME_STEP_MS - msElapsedInStep) / 1000));
  
  // Formatted like "384 921" for visual clarity
  const formattedOtp = `${code.slice(0, 3)} ${code.slice(3)}`;

  return {
    otp: code,
    formattedOtp,
    secondsRemaining,
    totalSeconds: TIME_STEP_MS / 1000,
  };
}

/**
 * Validates entered OTP code against current step, previous step (grace period),
 * and master/emergency pins.
 */
export function verifyOwnerOtp(inputCode: string): boolean {
  if (!inputCode) return false;
  const clean = inputCode.trim().replace(/\s+/g, "");

  // Master PIN or Quick PIN check
  if (clean === MASTER_OWNER_PIN || clean === QUICK_OWNER_PIN) {
    return true;
  }

  const now = Date.now();
  const currentStep = Math.floor(now / TIME_STEP_MS);
  const currentOtp = getOtpForStep(currentStep);
  const previousOtp = getOtpForStep(currentStep - 1); // 5 min grace window

  return clean === currentOtp || clean === previousOtp;
}

/**
 * Direct WhatsApp Owner OTP System (Option B)
 */
export function createWhatsAppOtpRequest(details: {
  action: string;
  productName: string;
  oldValue: string;
  newValue?: string;
  staffName?: string;
  reason?: string;
}): { otp: string; whatsappUrl: string; expiryMs: number } {
  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiryMs = Date.now() + 10 * 60 * 1000; // 10 minutes valid

  if (typeof window !== "undefined") {
    sessionStorage.setItem("rajnandni_active_whatsapp_otp", otp);
    sessionStorage.setItem("rajnandni_active_whatsapp_otp_expiry", expiryMs.toString());
  }

  const staff = details.staffName?.trim() || "Showroom Staff";
  const reason = details.reason?.trim() || "Inventory Adjustment";
  const changeLine = details.newValue
    ? `\n📊 *Details*: ${details.oldValue} ➔ ${details.newValue}`
    : `\n📊 *Details*: ${details.oldValue}`;

  const message =
`🔐 *RAJNANDINI BOUTIQUE - OWNER SECURITY ALERT*

🏪 *Store*: Rajnandini Haridwar
👤 *Staff*: ${staff}
📦 *Product*: ${details.productName}
🔄 *Action*: ${details.action}${changeLine}
📝 *Reason*: ${reason}

👉 *YOUR 6-DIGIT APPROVAL OTP: ${otp}*

⚠️ *Warning*: Staff ko ye OTP tabhi batayein agar aapne stock/rate change allow kiya ho. Agar aapne permission nahi di hai, to ye OTP kisi ko na dein.`;

  const phone = "917464987898";
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

  return { otp, whatsappUrl, expiryMs };
}

export function verifyWhatsAppOtp(enteredCode: string): boolean {
  if (!enteredCode) return false;
  const clean = enteredCode.trim().replace(/\s+/g, "");

  // Master PIN or Quick PIN emergency override
  if (clean === MASTER_OWNER_PIN || clean === QUICK_OWNER_PIN) {
    return true;
  }

  if (typeof window !== "undefined") {
    const savedOtp = sessionStorage.getItem("rajnandni_active_whatsapp_otp");
    const expiryStr = sessionStorage.getItem("rajnandni_active_whatsapp_otp_expiry");
    const expiry = expiryStr ? Number(expiryStr) : 0;

    if (savedOtp && clean === savedOtp && Date.now() <= expiry) {
      sessionStorage.removeItem("rajnandni_active_whatsapp_otp");
      sessionStorage.removeItem("rajnandni_active_whatsapp_otp_expiry");
      return true;
    }
  }

  // Also accept rolling OTP as alternative
  return verifyOwnerOtp(clean);
}

/**
 * Broadcast channel for local & cloud real-time cross-device synchronization
 */
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel("rajnandni_owner_auth_channel");
  } catch (e) {
    console.warn("BroadcastChannel not supported:", e);
  }
}

// Global Supabase Realtime broadcast channel
let cloudBroadcastChannel: any = null;
if (supabase) {
  try {
    cloudBroadcastChannel = supabase.channel("rajnandni_owner_security_realtime");
    cloudBroadcastChannel.subscribe();
  } catch (e) {
    console.warn("Supabase realtime channel error:", e);
  }
}

export function notifyBroadcast(event: { type: string; payload: any }) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch (e) {
      console.warn("BroadcastChannel post error:", e);
    }
  }

  // Broadcast to phone & other devices via Supabase WebSockets
  if (cloudBroadcastChannel) {
    try {
      cloudBroadcastChannel.send({
        type: "broadcast",
        event: "SECURITY_EVENT",
        payload: event,
      });
    } catch (e) {
      console.warn("Cloud broadcast error:", e);
    }
  }
}

export function subscribeBroadcast(callback: (event: { type: string; payload: any }) => void) {
  const localHandler = (e: MessageEvent) => {
    if (e.data && e.data.type) {
      callback(e.data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener("message", localHandler);
  }

  let cloudListener: any = null;
  if (supabase) {
    try {
      cloudListener = supabase.channel(`rajnandni_owner_sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
      cloudListener.on("broadcast", { event: "SECURITY_EVENT" }, ({ payload }: any) => {
        if (payload && payload.type) {
          callback(payload);
        }
      });
      cloudListener.subscribe();
    } catch (err) {
      console.warn("Supabase subscribe cloud error:", err);
    }
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener("message", localHandler);
    }
    if (cloudListener) {
      cloudListener.unsubscribe();
    }
  };
}

/**
 * LocalStorage Fallback Helpers
 */
export function getLocalAuthRequests(): InventoryAuthRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("rajnandni_inventory_auth_requests");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAuthRequests(requests: InventoryAuthRequest[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("rajnandni_inventory_auth_requests", JSON.stringify(requests));
  } catch (e) {
    console.warn("Failed saving auth requests to local storage:", e);
  }
}

export function getLocalAuditLogs(): InventoryAuditLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("rajnandni_inventory_audit_log");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAuditLog(entry: InventoryAuditLog) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalAuditLogs();
    const updated = [entry, ...existing].slice(0, 500); // keep last 500 records
    localStorage.setItem("rajnandni_inventory_audit_log", JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed saving audit log entry to local storage:", e);
  }
}

/**
 * Service to manage Auth Requests (Create, Check, Approve, Reject)
 */
export const OwnerSecurityService = {
  // Create an approval request from POS
  async createRequest(req: Omit<InventoryAuthRequest, "id" | "status" | "createdAt">): Promise<InventoryAuthRequest> {
    const newReq: InventoryAuthRequest = {
      ...req,
      id: "REQ-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Save locally
    const current = getLocalAuthRequests();
    saveLocalAuthRequests([newReq, ...current]);

    // Broadcast locally & to Cloud WebSockets
    notifyBroadcast({ type: "NEW_REQUEST", payload: newReq });

    // Sync to Supabase Cloud
    if (supabase) {
      try {
        const { error } = await supabase.from("inventory_auth_requests").insert({
          id: newReq.id,
          action_type: newReq.actionType,
          product_id: newReq.productId,
          product_name: newReq.productName,
          sku: newReq.sku,
          old_value: newReq.oldValue,
          new_value: newReq.newValue,
          reason: newReq.reason,
          staff_name: newReq.staffName,
          status: "pending",
          created_at: newReq.createdAt,
        });

        // If inventory_auth_requests table not created yet, store safely in alterations table
        if (error) {
          await supabase.from("alterations").insert({
            token_number: newReq.id,
            customer_name: "INVENTORY_SECURITY_AUTH",
            customer_phone: "7464987898",
            item_name: newReq.productName,
            instructions: JSON.stringify(newReq),
            tailor_name: newReq.staffName,
            status: "pending",
          });
        }
      } catch (err) {
        console.warn("Supabase auth request insert notice:", err);
      }
    }

    return newReq;
  },

  // Check request status (used by POS while waiting)
  async getRequestStatus(requestId: string): Promise<"pending" | "approved" | "rejected"> {
    // Check Supabase Cloud first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("inventory_auth_requests")
          .select("status")
          .eq("id", requestId)
          .single();
        if (!error && data) {
          return data.status as "pending" | "approved" | "rejected";
        }

        // Check fallback alterations storage
        const alt = await supabase
          .from("alterations")
          .select("status")
          .eq("token_number", requestId)
          .single();
        if (!alt.error && alt.data) {
          return alt.data.status as "pending" | "approved" | "rejected";
        }
      } catch {
        // Fall back to local
      }
    }

    // Fall back to local storage
    const list = getLocalAuthRequests();
    const found = list.find((r) => r.id === requestId);
    return found ? found.status : "pending";
  },

  // Fetch pending requests (for Owner page on mobile)
  async fetchPendingRequests(): Promise<InventoryAuthRequest[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("inventory_auth_requests")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            actionType: d.action_type,
            productId: d.product_id,
            productName: d.product_name,
            sku: d.sku,
            oldValue: d.old_value,
            newValue: d.new_value,
            reason: d.reason,
            staffName: d.staff_name,
            status: d.status,
            createdAt: d.created_at,
          }));
        }

        // Query fallback alterations table
        const alt = await supabase
          .from("alterations")
          .select("*")
          .eq("customer_name", "INVENTORY_SECURITY_AUTH")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (!alt.error && alt.data && alt.data.length > 0) {
          return alt.data.map((row: any) => {
            try {
              const parsed = JSON.parse(row.instructions || "{}");
              return {
                id: row.token_number,
                actionType: parsed.actionType || "stock_change",
                productId: parsed.productId || "",
                productName: row.item_name || parsed.productName,
                sku: parsed.sku || "",
                oldValue: parsed.oldValue || "",
                newValue: parsed.newValue || "",
                reason: parsed.reason || "Showroom inventory adjustment",
                staffName: row.tailor_name || parsed.staffName || "Showroom Staff",
                status: "pending" as const,
                createdAt: row.created_at,
              };
            } catch {
              return {
                id: row.token_number,
                actionType: "stock_change" as const,
                productId: "",
                productName: row.item_name,
                sku: "",
                oldValue: "",
                newValue: "",
                reason: "",
                staffName: row.tailor_name || "Showroom Staff",
                status: "pending" as const,
                createdAt: row.created_at,
              };
            }
          });
        }
      } catch {
        // Fall back
      }
    }

    const localList = getLocalAuthRequests();
    return localList.filter((r) => r.status === "pending");
  },

  // Owner 1-click Approve or Reject
  async resolveRequest(
    requestId: string,
    status: "approved" | "rejected",
    approvedVia: "remote_click" | "otp" = "remote_click"
  ): Promise<boolean> {
    const updatedAt = new Date().toISOString();

    // Update locally
    const current = getLocalAuthRequests();
    const updated = current.map((r) =>
      r.id === requestId ? { ...r, status, updatedAt, approvedVia } : r
    );
    saveLocalAuthRequests(updated);

    // Broadcast event locally & to Cloud WebSockets
    notifyBroadcast({
      type: "REQUEST_RESOLVED",
      payload: { id: requestId, status, approvedVia },
    });

    // Update Supabase Cloud
    if (supabase) {
      try {
        await supabase
          .from("inventory_auth_requests")
          .update({
            status,
            updated_at: updatedAt,
            approved_via: approvedVia,
          })
          .eq("id", requestId);

        // Also update fallback alterations table
        await supabase
          .from("alterations")
          .update({
            status,
          })
          .eq("token_number", requestId);
      } catch (err) {
        console.warn("Supabase resolve request warning:", err);
      }
    }

    return true;
  },

  // Record completed audit log
  async logAuditEntry(entry: Omit<InventoryAuditLog, "id" | "timestamp">): Promise<void> {
    const fullEntry: InventoryAuditLog = {
      ...entry,
      id: "LOG-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
    };

    saveLocalAuditLog(fullEntry);
    notifyBroadcast({ type: "NEW_AUDIT_LOG", payload: fullEntry });

    if (supabase) {
      try {
        await supabase.from("inventory_audit_log").insert({
          id: fullEntry.id,
          action_type: fullEntry.actionType,
          product_id: fullEntry.productId,
          product_name: fullEntry.productName,
          sku: fullEntry.sku,
          old_value: fullEntry.oldValue,
          new_value: fullEntry.newValue,
          reason: fullEntry.reason,
          staff_name: fullEntry.staffName,
          approved_via: fullEntry.approvedVia,
          timestamp: fullEntry.timestamp,
        });
      } catch (err) {
        console.warn("Supabase audit log insert warning:", err);
      }
    }
  },

  // Fetch recent audit logs
  async fetchAuditLogs(): Promise<InventoryAuditLog[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("inventory_audit_log")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(200);

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            actionType: d.action_type,
            productId: d.product_id,
            productName: d.product_name,
            sku: d.sku,
            oldValue: d.old_value,
            newValue: d.new_value,
            reason: d.reason,
            staffName: d.staff_name,
            approvedVia: d.approved_via,
            timestamp: d.timestamp,
          }));
        }
      } catch {
        // Fall back
      }
    }

    return getLocalAuditLogs();
  },
};
