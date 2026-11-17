import crypto from "crypto";
import { query } from "./db";

export interface CateringLeadInput {
  name: string;
  phone: string;
  email: string;
  eventDate?: string;
  guests?: string;
  location?: string;
  budget?: string;
  preferences?: string;
  message?: string;
}

export interface CateringLeadDTO extends CateringLeadInput {
  id: string;
  createdAt: number;
}

export async function createCateringLead(input: CateringLeadInput): Promise<CateringLeadDTO> {
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  await query(
    `INSERT INTO catering_leads
       (id, name, phone, email, event_date, guests, location, budget, preferences, message, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      input.name,
      input.phone,
      input.email,
      input.eventDate ?? "",
      input.guests ?? "",
      input.location ?? "",
      input.budget ?? "",
      input.preferences ?? "",
      input.message ?? "",
      createdAt,
    ],
  );
  return { id, createdAt, ...input };
}

export async function listCateringLeads(): Promise<CateringLeadDTO[]> {
  const rows = await query<{
    id: string;
    name: string;
    phone: string;
    email: string;
    event_date: string;
    guests: string;
    location: string;
    budget: string;
    preferences: string;
    message: string;
    created_at: number;
  }>("SELECT * FROM catering_leads ORDER BY created_at DESC");
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    eventDate: r.event_date,
    guests: r.guests,
    location: r.location,
    budget: r.budget,
    preferences: r.preferences,
    message: r.message,
    createdAt: r.created_at,
  }));
}
