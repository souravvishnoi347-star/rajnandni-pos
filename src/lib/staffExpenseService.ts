import { supabase } from "./supabaseClient";

export interface StoreExpense {
  id: string;
  tokenNumber: string;
  title: string;
  category: "chai_nashta" | "refreshments" | "cleaning_pooja" | "stationery_packing" | "transport_fuel" | "other";
  amount: number;
  paidBy: "cash_galla" | "online_upi" | "owner_personal";
  staffName: string;
  date: string; // YYYY-MM-DD
  note?: string;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
}

export interface StaffAdvance {
  id: string;
  tokenNumber: string;
  staffId: string;
  staffName: string;
  amount: number;
  paidBy: "cash_galla" | "online_upi";
  reason: "salary_advance" | "daily_wages" | "emergency" | "travel_incentive" | "other";
  approvedBy: string;
  date: string; // YYYY-MM-DD
  note?: string;
  status: "active" | "cleared";
  createdAt: string;
}

export interface StaffAttendanceRecord {
  id: string;
  tokenNumber: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  status: "present" | "half_day" | "absent" | "leave";
  checkInTime?: string;
  checkOutTime?: string;
  markedBy: string;
  note?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  monthlySalary: number;
  isActive: boolean;
}

export const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  { id: "staff-1", name: "Ramesh Kumar", phone: "9897123456", role: "Head Staff / Store Manager", monthlySalary: 25000, isActive: true },
  { id: "staff-2", name: "Priya Sharma", phone: "9897654321", role: "Senior Sales Executive", monthlySalary: 18000, isActive: true },
  { id: "staff-3", name: "Pooja Verma", phone: "9756123789", role: "Saree & Bridal Specialist", monthlySalary: 16000, isActive: true },
  { id: "staff-4", name: "Rohit Negi", phone: "9412345678", role: "Counter & Inventory Helper", monthlySalary: 14000, isActive: true },
  { id: "staff-5", name: "Suman Rawat", phone: "9634567890", role: "Sales & Alteration Assistant", monthlySalary: 13000, isActive: true },
];

const LOCAL_STORAGE_KEYS = {
  EXPENSES: "rajnandni_store_expenses",
  ADVANCES: "rajnandni_staff_advances",
  ATTENDANCE: "rajnandni_staff_attendance",
  STAFF: "rajnandni_staff_members",
};

export const StaffExpenseService = {
  // =========================================================================
  // 1. SHOWROOM DAILY EXPENSES
  // =========================================================================
  async fetchExpenses(): Promise<StoreExpense[]> {
    let cloudList: StoreExpense[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("alterations")
          .select("*")
          .eq("customer_name", "STORE_EXPENSE")
          .order("created_at", { ascending: false })
          .limit(500);

        if (!error && Array.isArray(data)) {
          cloudList = data.map((row: any) => {
            let details: any = {};
            try {
              details = JSON.parse(row.instructions || "{}");
            } catch {}
            return {
              id: row.id,
              tokenNumber: row.token_number,
              title: row.item_name || details.title || "Showroom Expense",
              category: details.category || "other",
              amount: Number(details.amount) || 0,
              paidBy: (details.paidBy || row.customer_phone || "cash_galla") as any,
              staffName: details.staffName || row.tailor_name || "Head Staff",
              date: details.date || (row.delivery_date ? row.delivery_date : row.created_at.split("T")[0]),
              note: details.note || "",
              status: (row.status || details.status || "approved") as any,
              createdAt: row.created_at,
            };
          });
        }
      } catch (err) {
        console.warn("Error fetching expenses from Supabase:", err);
      }
    }

    // Merge with local fallback
    if (typeof window !== "undefined") {
      try {
        const localRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.EXPENSES);
        const localList: StoreExpense[] = localRaw ? JSON.parse(localRaw) : [];
        if (cloudList.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENSES, JSON.stringify(cloudList));
          return cloudList;
        }
        return localList;
      } catch {}
    }

    return cloudList;
  },

  async recordExpense(exp: {
    title: string;
    category: StoreExpense["category"];
    amount: number;
    paidBy: StoreExpense["paidBy"];
    staffName: string;
    note?: string;
  }): Promise<StoreExpense | null> {
    const todayStr = new Date().toISOString().split("T")[0];
    const token = "EXP-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

    const payload = {
      title: exp.title.trim(),
      category: exp.category,
      amount: exp.amount,
      paidBy: exp.paidBy,
      staffName: exp.staffName.trim(),
      date: todayStr,
      note: exp.note?.trim() || "",
      status: "approved",
    };

    let newExpense: StoreExpense = {
      id: "local-" + Date.now(),
      tokenNumber: token,
      title: payload.title,
      category: payload.category,
      amount: payload.amount,
      paidBy: payload.paidBy,
      staffName: payload.staffName,
      date: todayStr,
      note: payload.note,
      status: "approved",
      createdAt: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("alterations")
          .insert({
            token_number: token,
            customer_name: "STORE_EXPENSE",
            customer_phone: exp.paidBy,
            item_name: exp.title.trim(),
            instructions: JSON.stringify(payload),
            tailor_name: exp.staffName.trim(),
            delivery_date: todayStr,
            status: "approved",
          })
          .select();

        if (!error && data && data[0]) {
          newExpense.id = data[0].id;
        }
      } catch (e) {
        console.warn("Failed recording expense to Supabase:", e);
      }
    }

    // Update local cache
    if (typeof window !== "undefined") {
      try {
        const current = await this.fetchExpenses();
        const updated = [newExpense, ...current];
        localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
      } catch {}
    }

    return newExpense;
  },

  async deleteExpense(id: string, tokenNumber?: string): Promise<boolean> {
    if (supabase) {
      try {
        if (id && !id.startsWith("local-")) {
          await supabase.from("alterations").delete().eq("id", id);
        } else if (tokenNumber) {
          await supabase.from("alterations").delete().eq("token_number", tokenNumber);
        }
      } catch (e) {
        console.warn("Delete expense Supabase error:", e);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.EXPENSES);
        if (raw) {
          const list: StoreExpense[] = JSON.parse(raw);
          const filtered = list.filter((x) => x.id !== id && (!tokenNumber || x.tokenNumber !== tokenNumber));
          localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
        }
      } catch {}
    }
    return true;
  },

  async updateExpense(id: string, tokenNumber: string, updates: Partial<StoreExpense>): Promise<boolean> {
    if (supabase) {
      try {
        const payload: any = {};
        if (updates.title !== undefined) payload.item_name = updates.title.trim();
        if (updates.paidBy !== undefined) payload.customer_phone = updates.paidBy;
        if (updates.date !== undefined) payload.delivery_date = updates.date;
        if (updates.status !== undefined) payload.status = updates.status;

        let instructions: any = {};
        if (id && !id.startsWith("local-")) {
          const { data } = await supabase.from("alterations").select("instructions").eq("id", id).maybeSingle();
          if (data?.instructions) {
            try { instructions = JSON.parse(data.instructions); } catch {}
          }
        }
        const mergedInstructions = {
          ...instructions,
          title: updates.title !== undefined ? updates.title.trim() : instructions.title,
          amount: updates.amount !== undefined ? updates.amount : instructions.amount,
          category: updates.category !== undefined ? updates.category : instructions.category,
          paidBy: updates.paidBy !== undefined ? updates.paidBy : instructions.paidBy,
          staffName: updates.staffName !== undefined ? updates.staffName : instructions.staffName,
          date: updates.date !== undefined ? updates.date : instructions.date,
          note: updates.note !== undefined ? updates.note : instructions.note,
          status: updates.status !== undefined ? updates.status : instructions.status,
        };
        payload.instructions = JSON.stringify(mergedInstructions);

        if (id && !id.startsWith("local-")) {
          await supabase.from("alterations").update(payload).eq("id", id);
        } else if (tokenNumber) {
          await supabase.from("alterations").update(payload).eq("token_number", tokenNumber);
        }
      } catch (e) {
        console.warn("Update expense Supabase error:", e);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.EXPENSES);
        if (raw) {
          const list: StoreExpense[] = JSON.parse(raw);
          const updated = list.map((x) =>
            x.id === id || (tokenNumber && x.tokenNumber === tokenNumber) ? { ...x, ...updates } : x
          );
          localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
        }
      } catch {}
    }
    return true;
  },

  async updateExpenseStatus(id: string, tokenNumber: string, status: StoreExpense["status"]): Promise<boolean> {
    if (supabase) {
      try {
        if (id && !id.startsWith("local-")) {
          await supabase.from("alterations").update({ status }).eq("id", id);
        } else if (tokenNumber) {
          await supabase.from("alterations").update({ status }).eq("token_number", tokenNumber);
        }
      } catch {}
    }
    return true;
  },

  // =========================================================================
  // 2. STAFF ADVANCES & PAYOUTS
  // =========================================================================
  async fetchAdvances(): Promise<StaffAdvance[]> {
    let cloudList: StaffAdvance[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("alterations")
          .select("*")
          .eq("customer_name", "STAFF_ADVANCE")
          .order("created_at", { ascending: false })
          .limit(300);

        if (!error && Array.isArray(data)) {
          cloudList = data.map((row: any) => {
            let details: any = {};
            try {
              details = JSON.parse(row.instructions || "{}");
            } catch {}
            return {
              id: row.id,
              tokenNumber: row.token_number,
              staffId: details.staffId || "staff-unknown",
              staffName: row.item_name || details.staffName || "Staff Member",
              amount: Number(details.amount) || 0,
              paidBy: (details.paidBy || row.customer_phone || "cash_galla") as any,
              reason: details.reason || "salary_advance",
              approvedBy: details.approvedBy || row.tailor_name || "Head Staff",
              date: details.date || row.created_at.split("T")[0],
              note: details.note || "",
              status: (row.status || details.status || "active") as any,
              createdAt: row.created_at,
            };
          });
        }
      } catch (err) {
        console.warn("Error fetching advances:", err);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const localRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.ADVANCES);
        const localList: StaffAdvance[] = localRaw ? JSON.parse(localRaw) : [];
        if (cloudList.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_KEYS.ADVANCES, JSON.stringify(cloudList));
          return cloudList;
        }
        return localList;
      } catch {}
    }
    return cloudList;
  },

  async recordAdvance(adv: {
    staffId: string;
    staffName: string;
    amount: number;
    paidBy: StaffAdvance["paidBy"];
    reason: StaffAdvance["reason"];
    approvedBy: string;
    note?: string;
  }): Promise<StaffAdvance | null> {
    const todayStr = new Date().toISOString().split("T")[0];
    const token = "ADV-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

    const payload = {
      staffId: adv.staffId,
      staffName: adv.staffName.trim(),
      amount: adv.amount,
      paidBy: adv.paidBy,
      reason: adv.reason,
      approvedBy: adv.approvedBy.trim(),
      date: todayStr,
      note: adv.note?.trim() || "",
      status: "active",
    };

    let newAdv: StaffAdvance = {
      id: "local-" + Date.now(),
      tokenNumber: token,
      staffId: adv.staffId,
      staffName: adv.staffName,
      amount: adv.amount,
      paidBy: adv.paidBy,
      reason: adv.reason,
      approvedBy: adv.approvedBy,
      date: todayStr,
      note: adv.note,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("alterations")
          .insert({
            token_number: token,
            customer_name: "STAFF_ADVANCE",
            customer_phone: adv.paidBy,
            item_name: adv.staffName.trim(),
            instructions: JSON.stringify(payload),
            tailor_name: adv.approvedBy.trim(),
            delivery_date: todayStr,
            status: "active",
          })
          .select();

        if (!error && data && data[0]) {
          newAdv.id = data[0].id;
        }
      } catch (e) {
        console.warn("Failed recording advance to Supabase:", e);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const current = await this.fetchAdvances();
        const updated = [newAdv, ...current];
        localStorage.setItem(LOCAL_STORAGE_KEYS.ADVANCES, JSON.stringify(updated));
      } catch {}
    }
    return newAdv;
  },

  async updateAdvanceStatus(id: string, tokenNumber: string, status: StaffAdvance["status"]): Promise<boolean> {
    if (supabase) {
      try {
        if (id && !id.startsWith("local-")) {
          await supabase.from("alterations").update({ status }).eq("id", id);
        } else if (tokenNumber) {
          await supabase.from("alterations").update({ status }).eq("token_number", tokenNumber);
        }
      } catch {}
    }
    return true;
  },

  async updateAdvance(id: string, tokenNumber: string, updates: Partial<StaffAdvance>): Promise<boolean> {
    if (supabase) {
      try {
        const payload: any = {};
        if (updates.staffName !== undefined) payload.item_name = updates.staffName.trim();
        if (updates.paidBy !== undefined) payload.customer_phone = updates.paidBy;
        if (updates.date !== undefined) payload.delivery_date = updates.date;
        if (updates.status !== undefined) payload.status = updates.status;

        let instructions: any = {};
        if (id && !id.startsWith("local-")) {
          const { data } = await supabase.from("alterations").select("instructions").eq("id", id).maybeSingle();
          if (data?.instructions) {
            try { instructions = JSON.parse(data.instructions); } catch {}
          }
        }
        const mergedInstructions = {
          ...instructions,
          staffId: updates.staffId !== undefined ? updates.staffId : instructions.staffId,
          staffName: updates.staffName !== undefined ? updates.staffName : instructions.staffName,
          amount: updates.amount !== undefined ? updates.amount : instructions.amount,
          paidBy: updates.paidBy !== undefined ? updates.paidBy : instructions.paidBy,
          reason: updates.reason !== undefined ? updates.reason : instructions.reason,
          date: updates.date !== undefined ? updates.date : instructions.date,
          note: updates.note !== undefined ? updates.note : instructions.note,
          status: updates.status !== undefined ? updates.status : instructions.status,
        };
        payload.instructions = JSON.stringify(mergedInstructions);

        if (id && !id.startsWith("local-")) {
          await supabase.from("alterations").update(payload).eq("id", id);
        } else if (tokenNumber) {
          await supabase.from("alterations").update(payload).eq("token_number", tokenNumber);
        }
      } catch (e) {
        console.warn("Update advance Supabase error:", e);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.ADVANCES);
        if (raw) {
          const list: StaffAdvance[] = JSON.parse(raw);
          const updated = list.map((x) =>
            x.id === id || (tokenNumber && x.tokenNumber === tokenNumber) ? { ...x, ...updates } : x
          );
          localStorage.setItem(LOCAL_STORAGE_KEYS.ADVANCES, JSON.stringify(updated));
        }
      } catch {}
    }
    return true;
  },

  async deleteAdvance(id: string, tokenNumber?: string): Promise<boolean> {
    if (supabase) {
      try {
        if (id && !id.startsWith("local-")) {
          await supabase.from("alterations").delete().eq("id", id);
        } else if (tokenNumber) {
          await supabase.from("alterations").delete().eq("token_number", tokenNumber);
        }
      } catch {}
    }
    return true;
  },

  // =========================================================================
  // 3. DAILY STAFF ATTENDANCE
  // =========================================================================
  async fetchAttendance(dateStr?: string): Promise<StaffAttendanceRecord[]> {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
    let cloudList: StaffAttendanceRecord[] = [];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("alterations")
          .select("*")
          .eq("customer_name", "STAFF_ATTENDANCE")
          .eq("delivery_date", targetDate);

        if (!error && Array.isArray(data)) {
          cloudList = data.map((row: any) => {
            let details: any = {};
            try {
              details = JSON.parse(row.instructions || "{}");
            } catch {}
            return {
              id: row.id,
              tokenNumber: row.token_number,
              staffId: details.staffId || row.token_number.split("-")[4] || "staff",
              staffName: row.item_name || details.staffName || "Staff Member",
              date: row.delivery_date || targetDate,
              status: (row.status || details.status || "present") as any,
              checkInTime: details.checkInTime || "",
              checkOutTime: details.checkOutTime || "",
              markedBy: details.markedBy || row.tailor_name || "Head Staff",
              note: details.note || "",
              createdAt: row.created_at,
            };
          });
        }
      } catch (err) {
        console.warn("Attendance fetch error:", err);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_KEYS.ATTENDANCE}_${targetDate}`);
        const localList: StaffAttendanceRecord[] = raw ? JSON.parse(raw) : [];
        if (cloudList.length > 0) {
          localStorage.setItem(`${LOCAL_STORAGE_KEYS.ATTENDANCE}_${targetDate}`, JSON.stringify(cloudList));
          return cloudList;
        }
        return localList;
      } catch {}
    }
    return cloudList;
  },

  async markAttendance(record: {
    staffId: string;
    staffName: string;
    date: string;
    status: StaffAttendanceRecord["status"];
    checkInTime?: string;
    checkOutTime?: string;
    markedBy: string;
    note?: string;
  }): Promise<boolean> {
    const token = `ATT-${record.date}-${record.staffId}`;
    const payload = {
      staffId: record.staffId,
      staffName: record.staffName,
      date: record.date,
      status: record.status,
      checkInTime: record.checkInTime || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      checkOutTime: record.checkOutTime || "",
      markedBy: record.markedBy,
      note: record.note || "",
    };

    if (supabase) {
      try {
        // Upsert by token_number in alterations
        const { error } = await supabase.from("alterations").upsert(
          {
            token_number: token,
            customer_name: "STAFF_ATTENDANCE",
            customer_phone: record.staffId,
            item_name: record.staffName,
            instructions: JSON.stringify(payload),
            tailor_name: record.markedBy,
            delivery_date: record.date,
            status: record.status,
          },
          { onConflict: "token_number" }
        );

        if (error) {
          console.warn("Attendance upsert error:", error);
        }
      } catch (e) {
        console.warn("Attendance save failed:", e);
      }
    }

    // Local storage cache
    if (typeof window !== "undefined") {
      try {
        const existing = await this.fetchAttendance(record.date);
        const filtered = existing.filter((x) => x.staffId !== record.staffId);
        const updated = [
          ...filtered,
          {
            id: token,
            tokenNumber: token,
            ...payload,
            createdAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem(`${LOCAL_STORAGE_KEYS.ATTENDANCE}_${record.date}`, JSON.stringify(updated));
      } catch {}
    }

    return true;
  },

  // =========================================================================
  // 4. STAFF MEMBERS DIRECTORY
  // =========================================================================
  async fetchStaffMembers(): Promise<StaffMember[]> {
    let cloudList: StaffMember[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("alterations")
          .select("*")
          .eq("customer_name", "STAFF_MEMBER")
          .order("created_at", { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          cloudList = data.map((row: any) => {
            let details: any = {};
            try {
              details = JSON.parse(row.instructions || "{}");
            } catch {}
            return {
              id: row.token_number ? row.token_number.replace("STAFF-", "") : row.id,
              name: row.item_name || "Staff Member",
              phone: row.customer_phone || "",
              role: row.tailor_name || "Showroom Staff",
              monthlySalary: Number(details.monthlySalary) || 15000,
              isActive: row.status === "active",
            };
          });
        }
      } catch (err) {
        console.warn("fetchStaffMembers cloud error:", err);
      }
    }

    if (cloudList.length > 0) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEYS.STAFF, JSON.stringify(cloudList));
        } catch {}
      }
      return cloudList;
    }

    // Check localStorage or seed defaults
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.STAFF);
        if (raw) return JSON.parse(raw);
        localStorage.setItem(LOCAL_STORAGE_KEYS.STAFF, JSON.stringify(DEFAULT_STAFF_MEMBERS));
      } catch {}
    }
    return DEFAULT_STAFF_MEMBERS;
  },

  async addStaffMember(member: Omit<StaffMember, "id" | "isActive">): Promise<StaffMember> {
    const id = "staff-" + Date.now();
    const token = "STAFF-" + id;
    const newStaff: StaffMember = {
      id,
      name: member.name.trim(),
      phone: member.phone.trim(),
      role: member.role.trim(),
      monthlySalary: member.monthlySalary,
      isActive: true,
    };

    if (supabase) {
      try {
        await supabase.from("alterations").insert({
          token_number: token,
          customer_name: "STAFF_MEMBER",
          customer_phone: member.phone.trim(),
          item_name: member.name.trim(),
          instructions: JSON.stringify({ monthlySalary: member.monthlySalary }),
          tailor_name: member.role.trim(),
          status: "active",
        });
      } catch (e) {
        console.warn("Error adding staff to cloud:", e);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const current = await this.fetchStaffMembers();
        const updated = [...current, newStaff];
        localStorage.setItem(LOCAL_STORAGE_KEYS.STAFF, JSON.stringify(updated));
      } catch {}
    }
    return newStaff;
  },

  async updateStaffMember(id: string, updates: Partial<Omit<StaffMember, "id">>): Promise<boolean> {
    const token = "STAFF-" + id;
    if (supabase) {
      try {
        const payload: any = {};
        if (updates.name !== undefined) payload.item_name = updates.name.trim();
        if (updates.phone !== undefined) payload.customer_phone = updates.phone.trim();
        if (updates.role !== undefined) payload.tailor_name = updates.role.trim();
        if (updates.monthlySalary !== undefined) {
          payload.instructions = JSON.stringify({ monthlySalary: updates.monthlySalary });
        }
        if (updates.isActive !== undefined) {
          payload.status = updates.isActive ? "active" : "inactive";
        }

        const { error } = await supabase
          .from("alterations")
          .update(payload)
          .eq("customer_name", "STAFF_MEMBER")
          .or(`token_number.eq.${token},token_number.eq.${id},id.eq.${id}`);

        if (error) {
          console.warn("Update staff in Supabase error:", error);
        }
      } catch (e) {
        console.warn("Failed updating staff in cloud:", e);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.STAFF);
        const list: StaffMember[] = raw ? JSON.parse(raw) : DEFAULT_STAFF_MEMBERS;
        const updated = list.map((s) => (s.id === id ? { ...s, ...updates } : s));
        localStorage.setItem(LOCAL_STORAGE_KEYS.STAFF, JSON.stringify(updated));
      } catch {}
    }
    return true;
  },

  async deleteStaffMember(id: string): Promise<boolean> {
    const token = "STAFF-" + id;
    if (supabase) {
      try {
        await supabase
          .from("alterations")
          .delete()
          .eq("customer_name", "STAFF_MEMBER")
          .or(`token_number.eq.${token},token_number.eq.${id},id.eq.${id}`);
      } catch (e) {
        console.warn("Delete staff error:", e);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.STAFF);
        const list: StaffMember[] = raw ? JSON.parse(raw) : DEFAULT_STAFF_MEMBERS;
        const updated = list.filter((s) => s.id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEYS.STAFF, JSON.stringify(updated));
      } catch {}
    }
    return true;
  },

  async toggleStaffStatus(id: string, isActive: boolean): Promise<boolean> {
    return this.updateStaffMember(id, { isActive });
  },
};
