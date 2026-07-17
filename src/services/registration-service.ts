import { createClient } from "@/lib/supabase/client";
import type { RegistrationForm, RegistrationField, RegistrationResponse } from "@/lib/types";

export async function getFormByEventId(eventId: string): Promise<RegistrationForm | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("registration_forms").select("*").eq("event_id", eventId).eq("is_active", true).single();
  if (error) return null;
  return data;
}

export async function createForm(form: Omit<RegistrationForm, "id" | "created_at" | "updated_at">): Promise<RegistrationForm> {
  const supabase = createClient();
  const { data, error } = await supabase.from("registration_forms").insert(form).select().single();
  if (error) throw error;
  return data;
}

export async function updateForm(id: string, updates: Partial<RegistrationForm>): Promise<RegistrationForm> {
  const supabase = createClient();
  const { data, error } = await supabase.from("registration_forms").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function getFormFields(formId: string): Promise<RegistrationField[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("registration_fields").select("*").eq("form_id", formId).order("sort_order");
  if (error) throw error;
  return data || [];
}

export async function createField(field: Omit<RegistrationField, "id" | "created_at">): Promise<RegistrationField> {
  const supabase = createClient();
  const { data, error } = await supabase.from("registration_fields").insert(field).select().single();
  if (error) throw error;
  return data;
}

export async function updateField(id: string, updates: Partial<RegistrationField>): Promise<RegistrationField> {
  const supabase = createClient();
  const { data, error } = await supabase.from("registration_fields").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteField(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("registration_fields").delete().eq("id", id);
  if (error) throw error;
}

export async function submitRegistration(response: Omit<RegistrationResponse, "id" | "created_at" | "reviewed_at">): Promise<RegistrationResponse> {
  const supabase = createClient();
  const { data, error } = await supabase.from("registration_responses").insert(response).select().single();
  if (error) throw error;
  return data;
}

export async function getRegistrationsByEvent(eventId: string): Promise<RegistrationResponse[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("registration_responses").select("*").eq("event_id", eventId).order("submitted_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllRegistrations(): Promise<RegistrationResponse[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("registration_responses").select("*").order("submitted_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateRegistrationStatus(id: string, status: "approved" | "rejected", notes?: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("registration_responses").update({ status, notes: notes || "", reviewed_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export function exportRegistrationsCSV(registrations: RegistrationResponse[], fields: RegistrationField[]): string {
  const headers = ["Name", "Email", "Status", "Submitted At", ...fields.map((f) => f.label)];
  const rows = registrations.map((r) => {
    return [
      `"${r.respondent_name}"`,
      `"${r.respondent_email}"`,
      r.status,
      r.submitted_at,
      ...fields.map((f) => `"${String(r.data[f.label] ?? "")}"`),
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}
