import { supabase } from '@/infrastructure/supabase/client';

import type {
  BookingBarber,
  BookingCatalog,
  BookingService,
  BookingStyle,
  PublicBarbershop,
  PublicOpeningHour,
} from './types';

const BARBERSHOP_COLUMNS =
  'id, name, description, logo_url, phone, address, location_reference, status';

function mapBarbershop(row: {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  location_reference: string | null;
  status: PublicBarbershop['status'];
}): PublicBarbershop {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    logoUrl: row.logo_url,
    phone: row.phone,
    address: row.address,
    locationReference: row.location_reference,
    status: row.status,
  };
}

export async function getPublicBarbershops(): Promise<PublicBarbershop[]> {
  const { data, error } = await supabase
    .from('barbershops')
    .select(BARBERSHOP_COLUMNS)
    .in('status', ['published', 'paused'])
    .order('name');

  if (error) throw error;

  return data.map(mapBarbershop).sort((left, right) => {
    if (left.status === right.status) return left.name.localeCompare(right.name, 'es');
    return left.status === 'published' ? -1 : 1;
  });
}

async function getVisibleBarbershop(barbershopId: string) {
  const { data, error } = await supabase
    .from('barbershops')
    .select(BARBERSHOP_COLUMNS)
    .eq('id', barbershopId)
    .in('status', ['published', 'paused'])
    .maybeSingle();

  if (error) throw error;
  return data ? mapBarbershop(data) : null;
}

async function getPublicHours(barbershopId: string): Promise<PublicOpeningHour[]> {
  const { data, error } = await supabase
    .from('barbershop_hours')
    .select('id, weekday, start_time, end_time')
    .eq('barbershop_id', barbershopId)
    .order('weekday')
    .order('start_time');

  if (error) throw error;
  return data.map((hour) => ({
    id: hour.id,
    weekday: hour.weekday,
    startTime: hour.start_time.slice(0, 5),
    endTime: hour.end_time.slice(0, 5),
  }));
}

async function getPublicServices(barbershopId: string): Promise<BookingService[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, price, duration_minutes')
    .eq('barbershop_id', barbershopId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    price: Number(service.price),
    durationMinutes: service.duration_minutes,
  }));
}

export async function getPublicBarbershopDetail(barbershopId: string) {
  const barbershop = await getVisibleBarbershop(barbershopId);
  if (!barbershop) return null;

  const [hours, services] = await Promise.all([
    getPublicHours(barbershopId),
    getPublicServices(barbershopId),
  ]);
  return { barbershop, hours, services };
}

async function getBookingStyles(serviceIds: string[]): Promise<BookingStyle[]> {
  if (serviceIds.length === 0) return [];

  const { data, error } = await supabase
    .from('styles')
    .select('id, service_id, name, description, image_url')
    .in('service_id', serviceIds)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data.map((style) => ({
    id: style.id,
    serviceId: style.service_id,
    name: style.name,
    description: style.description,
    imageUrl: style.image_url,
  }));
}

async function getBookingBarbers(barbershopId: string): Promise<BookingBarber[]> {
  const { data, error } = await supabase
    .from('barbers')
    .select('id, display_name, bio, photo_url')
    .eq('barbershop_id', barbershopId)
    .eq('is_active', true)
    .order('display_name');

  if (error) throw error;
  return data.map((barber) => ({
    id: barber.id,
    displayName: barber.display_name,
    bio: barber.bio,
    photoUrl: barber.photo_url,
  }));
}

async function getBookingAssignments(barbershopId: string) {
  const { data, error } = await supabase
    .from('barber_services')
    .select('barber_id, service_id')
    .eq('barbershop_id', barbershopId);

  if (error) throw error;
  return data.map((assignment) => ({
    barberId: assignment.barber_id,
    serviceId: assignment.service_id,
  }));
}

async function getYapeSettings(barbershopId: string) {
  const { data, error } = await supabase
    .from('barbershop_payment_settings')
    .select('yape_holder_name, yape_phone, yape_qr_url')
    .eq('barbershop_id', barbershopId)
    .maybeSingle();

  if (error) throw error;
  return data
    ? {
        holderName: data.yape_holder_name,
        phone: data.yape_phone,
        qrUrl: data.yape_qr_url,
      }
    : null;
}

export async function getBookingCatalog(barbershopId: string): Promise<BookingCatalog | null> {
  const detail = await getPublicBarbershopDetail(barbershopId);
  if (!detail) return null;

  const [styles, barbers, assignments, yapeSettings] = await Promise.all([
    getBookingStyles(detail.services.map((service) => service.id)),
    getBookingBarbers(barbershopId),
    getBookingAssignments(barbershopId),
    getYapeSettings(barbershopId),
  ]);

  return { ...detail, styles, barbers, assignments, yapeSettings };
}
