import crypto from "crypto";
import { db } from "./db";

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

export function createCateringLead(input: CateringLeadInput): CateringLeadDTO {
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  db.prepare(
    `INSERT INTO catering_leads
       (id, name, phone, email, event_date, guests, location, budget, preferences, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
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
  );
  return { id, createdAt, ...input };
}

export function listCateringLeads(): CateringLeadDTO[] {
  const rows = db.prepare("SELECT * FROM catering_leads ORDER BY created_at DESC").all() as Array<{
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
  }>;
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
