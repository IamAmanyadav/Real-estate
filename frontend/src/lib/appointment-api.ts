// ============================================
// Appointment API Client — shared by buyer, seller, admin
// ============================================

import axios from "axios";
import type {
  TimeSlot,
  Appointment,
  PaginatedResponse,
} from "@/types";
import { API_BASE_URL } from "./constants";

const appointmentApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token
appointmentApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("luxe_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-logout on 401
appointmentApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("luxe_token");
      localStorage.removeItem("luxe_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Public: Property Availability ────────────────────────────────────────────

export async function getPropertyAvailability(
  propertyId: string
): Promise<TimeSlot[]> {
  const { data } = await appointmentApi.get<TimeSlot[]>(
    `/properties/${propertyId}/availability`
  );
  return data;
}

// ── Seller: Time Slot Management ─────────────────────────────────────────────

export async function getSellerAvailability(params?: {
  propertyId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<TimeSlot>> {
  const { data } = await appointmentApi.get<PaginatedResponse<TimeSlot>>(
    "/seller/availability",
    { params }
  );
  return data;
}

export async function createTimeSlot(slotData: {
  propertyId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
}): Promise<TimeSlot> {
  const { data } = await appointmentApi.post<TimeSlot>(
    "/seller/availability",
    slotData
  );
  return data;
}

export async function deleteTimeSlot(slotId: string): Promise<void> {
  await appointmentApi.delete(`/seller/availability/${slotId}`);
}

export async function getSellerAppointments(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Appointment>> {
  const { data } = await appointmentApi.get<PaginatedResponse<Appointment>>(
    "/seller/appointments",
    { params }
  );
  return data;
}

// ── Buyer: Appointments ──────────────────────────────────────────────────────

export async function getBuyerAppointments(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Appointment>> {
  const { data } = await appointmentApi.get<PaginatedResponse<Appointment>>(
    "/buyer/appointments",
    { params }
  );
  return data;
}

export async function createAppointment(appointmentData: {
  propertyId: string;
  timeSlotId: string;
}): Promise<Appointment> {
  const { data } = await appointmentApi.post<Appointment>(
    "/buyer/appointments",
    appointmentData
  );
  return data;
}

// ── Admin: Appointment Management ────────────────────────────────────────────

export async function getAdminAppointments(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Appointment>> {
  const { data } = await appointmentApi.get<PaginatedResponse<Appointment>>(
    "/admin/appointments",
    { params }
  );
  return data;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  updateData: {
    status: string;
    adminNotes?: string;
    newTimeSlotId?: string;
  }
): Promise<Appointment> {
  const { data } = await appointmentApi.patch<Appointment>(
    `/admin/appointments/${appointmentId}`,
    updateData
  );
  return data;
}

export default appointmentApi;
