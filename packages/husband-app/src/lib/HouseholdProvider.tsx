import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Household, Profile } from "../types";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthProvider";

interface HouseholdState {
  household: Household | null;
  members: Profile[];
  partner: Profile | null;
  loading: boolean;
  createHousehold: (name: string) => Promise<Household>;
  joinHousehold: (code: string) => Promise<Household>;
  refresh: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdState | undefined>(undefined);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) {
      setHousehold(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id, households(*)")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!membership) {
      setHousehold(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    const householdRow = Array.isArray(membership.households) ? membership.households[0] : membership.households;
    setHousehold(householdRow as Household);

    const { data: roster } = await supabase
      .from("household_members")
      .select("profiles(*)")
      .eq("household_id", membership.household_id);

    const profiles = (roster ?? [])
      .map((row) => (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles))
      .filter((p): p is Profile => Boolean(p));
    setMembers(profiles);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function createHousehold(name: string): Promise<Household> {
    const { data, error } = await supabase.rpc("create_household", { household_name: name });
    if (error) throw error;
    await load();
    return data as Household;
  }

  async function joinHousehold(code: string): Promise<Household> {
    const { data, error } = await supabase.rpc("join_household", { code });
    if (error) throw error;
    await load();
    return data as Household;
  }

  const partner = members.find((m) => m.id !== session?.user.id) ?? null;

  return (
    <HouseholdContext.Provider
      value={{ household, members, partner, loading, createHousehold, joinHousehold, refresh: load }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error("useHousehold must be used within HouseholdProvider");
  return ctx;
}
