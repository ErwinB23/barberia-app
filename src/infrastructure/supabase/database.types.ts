export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      barber_blocks: {
        Row: {
          barber_id: string;
          barbershop_id: string;
          created_at: string;
          created_by: string;
          ends_at: string;
          id: string;
          reason: string | null;
          starts_at: string;
          updated_at: string;
        };
        Insert: {
          barber_id: string;
          barbershop_id: string;
          created_at?: string;
          created_by: string;
          ends_at: string;
          id?: string;
          reason?: string | null;
          starts_at: string;
          updated_at?: string;
        };
        Update: {
          barber_id?: string;
          barbershop_id?: string;
          created_at?: string;
          created_by?: string;
          ends_at?: string;
          id?: string;
          reason?: string | null;
          starts_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'barber_blocks_barber_fk';
            columns: ['barber_id', 'barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbers';
            referencedColumns: ['id', 'barbershop_id'];
          },
          {
            foreignKeyName: 'barber_blocks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      barber_schedules: {
        Row: {
          barber_id: string;
          barbershop_id: string;
          created_at: string;
          end_time: string;
          id: string;
          start_time: string;
          updated_at: string;
          weekday: number;
        };
        Insert: {
          barber_id: string;
          barbershop_id: string;
          created_at?: string;
          end_time: string;
          id?: string;
          start_time: string;
          updated_at?: string;
          weekday: number;
        };
        Update: {
          barber_id?: string;
          barbershop_id?: string;
          created_at?: string;
          end_time?: string;
          id?: string;
          start_time?: string;
          updated_at?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'barber_schedules_barber_fk';
            columns: ['barber_id', 'barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbers';
            referencedColumns: ['id', 'barbershop_id'];
          },
        ];
      };
      barber_services: {
        Row: {
          barber_id: string;
          barbershop_id: string;
          created_at: string;
          id: string;
          service_id: string;
        };
        Insert: {
          barber_id: string;
          barbershop_id: string;
          created_at?: string;
          id?: string;
          service_id: string;
        };
        Update: {
          barber_id?: string;
          barbershop_id?: string;
          created_at?: string;
          id?: string;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'barber_services_barber_fk';
            columns: ['barber_id', 'barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbers';
            referencedColumns: ['id', 'barbershop_id'];
          },
          {
            foreignKeyName: 'barber_services_service_fk';
            columns: ['service_id', 'barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id', 'barbershop_id'];
          },
        ];
      };
      barbers: {
        Row: {
          barbershop_id: string;
          bio: string | null;
          created_at: string;
          display_name: string;
          id: string;
          is_active: boolean;
          photo_url: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          barbershop_id: string;
          bio?: string | null;
          created_at?: string;
          display_name: string;
          id?: string;
          is_active?: boolean;
          photo_url?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          barbershop_id?: string;
          bio?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_active?: boolean;
          photo_url?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'barbers_membership_fk';
            columns: ['barbershop_id', 'user_id'];
            isOneToOne: true;
            referencedRelation: 'barbershop_memberships';
            referencedColumns: ['barbershop_id', 'user_id'];
          },
        ];
      };
      barbershop_closures: {
        Row: {
          barbershop_id: string;
          created_at: string;
          created_by: string;
          ends_at: string;
          id: string;
          reason: string | null;
          starts_at: string;
          updated_at: string;
        };
        Insert: {
          barbershop_id: string;
          created_at?: string;
          created_by: string;
          ends_at: string;
          id?: string;
          reason?: string | null;
          starts_at: string;
          updated_at?: string;
        };
        Update: {
          barbershop_id?: string;
          created_at?: string;
          created_by?: string;
          ends_at?: string;
          id?: string;
          reason?: string | null;
          starts_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'barbershop_closures_barbershop_id_fkey';
            columns: ['barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbershops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'barbershop_closures_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      barbershop_hours: {
        Row: {
          barbershop_id: string;
          created_at: string;
          end_time: string;
          id: string;
          start_time: string;
          updated_at: string;
          weekday: number;
        };
        Insert: {
          barbershop_id: string;
          created_at?: string;
          end_time: string;
          id?: string;
          start_time: string;
          updated_at?: string;
          weekday: number;
        };
        Update: {
          barbershop_id?: string;
          created_at?: string;
          end_time?: string;
          id?: string;
          start_time?: string;
          updated_at?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'barbershop_hours_barbershop_id_fkey';
            columns: ['barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbershops';
            referencedColumns: ['id'];
          },
        ];
      };
      barbershop_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          barbershop_id: string;
          channel: Database['public']['Enums']['invitation_channel'];
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          recipient_user_id: string | null;
          responded_at: string | null;
          role: Database['public']['Enums']['membership_role'];
          status: Database['public']['Enums']['invitation_status'];
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          barbershop_id: string;
          channel: Database['public']['Enums']['invitation_channel'];
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by: string;
          recipient_user_id?: string | null;
          responded_at?: string | null;
          role: Database['public']['Enums']['membership_role'];
          status?: Database['public']['Enums']['invitation_status'];
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          barbershop_id?: string;
          channel?: Database['public']['Enums']['invitation_channel'];
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          recipient_user_id?: string | null;
          responded_at?: string | null;
          role?: Database['public']['Enums']['membership_role'];
          status?: Database['public']['Enums']['invitation_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'barbershop_invitations_accepted_by_fkey';
            columns: ['accepted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'barbershop_invitations_barbershop_id_fkey';
            columns: ['barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbershops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'barbershop_invitations_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'barbershop_invitations_recipient_user_id_fkey';
            columns: ['recipient_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      barbershop_memberships: {
        Row: {
          barbershop_id: string;
          created_at: string;
          id: string;
          joined_at: string;
          role: Database['public']['Enums']['membership_role'];
          status: Database['public']['Enums']['membership_status'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          barbershop_id: string;
          created_at?: string;
          id?: string;
          joined_at?: string;
          role: Database['public']['Enums']['membership_role'];
          status?: Database['public']['Enums']['membership_status'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          barbershop_id?: string;
          created_at?: string;
          id?: string;
          joined_at?: string;
          role?: Database['public']['Enums']['membership_role'];
          status?: Database['public']['Enums']['membership_status'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'barbershop_memberships_barbershop_id_fkey';
            columns: ['barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbershops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'barbershop_memberships_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      barbershop_payment_settings: {
        Row: {
          barbershop_id: string;
          created_at: string;
          updated_at: string;
          yape_holder_name: string | null;
          yape_phone: string | null;
          yape_qr_url: string | null;
        };
        Insert: {
          barbershop_id: string;
          created_at?: string;
          updated_at?: string;
          yape_holder_name?: string | null;
          yape_phone?: string | null;
          yape_qr_url?: string | null;
        };
        Update: {
          barbershop_id?: string;
          created_at?: string;
          updated_at?: string;
          yape_holder_name?: string | null;
          yape_phone?: string | null;
          yape_qr_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'barbershop_payment_settings_barbershop_id_fkey';
            columns: ['barbershop_id'];
            isOneToOne: true;
            referencedRelation: 'barbershops';
            referencedColumns: ['id'];
          },
        ];
      };
      barbershop_settings: {
        Row: {
          appointment_buffer_minutes: number;
          barbershop_id: string;
          cancellation_notice_minutes: number;
          created_at: string;
          late_cancellation_refund_policy: Database['public']['Enums']['late_cancellation_refund_policy'];
          max_booking_days: number;
          min_booking_notice_minutes: number;
          slot_interval_minutes: number;
          updated_at: string;
        };
        Insert: {
          appointment_buffer_minutes?: number;
          barbershop_id: string;
          cancellation_notice_minutes?: number;
          created_at?: string;
          late_cancellation_refund_policy?: Database['public']['Enums']['late_cancellation_refund_policy'];
          max_booking_days?: number;
          min_booking_notice_minutes?: number;
          slot_interval_minutes?: number;
          updated_at?: string;
        };
        Update: {
          appointment_buffer_minutes?: number;
          barbershop_id?: string;
          cancellation_notice_minutes?: number;
          created_at?: string;
          late_cancellation_refund_policy?: Database['public']['Enums']['late_cancellation_refund_policy'];
          max_booking_days?: number;
          min_booking_notice_minutes?: number;
          slot_interval_minutes?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'barbershop_settings_barbershop_id_fkey';
            columns: ['barbershop_id'];
            isOneToOne: true;
            referencedRelation: 'barbershops';
            referencedColumns: ['id'];
          },
        ];
      };
      barbershops: {
        Row: {
          address: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          location_reference: string | null;
          logo_url: string | null;
          name: string;
          phone: string | null;
          status: Database['public']['Enums']['barbershop_status'];
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          location_reference?: string | null;
          logo_url?: string | null;
          name: string;
          phone?: string | null;
          status?: Database['public']['Enums']['barbershop_status'];
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          location_reference?: string | null;
          logo_url?: string | null;
          name?: string;
          phone?: string | null;
          status?: Database['public']['Enums']['barbershop_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'barbershops_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      favorite_barbershops: {
        Row: {
          barbershop_id: string;
          created_at: string;
          id: string;
          is_primary: boolean;
          user_id: string;
        };
        Insert: {
          barbershop_id: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          user_id: string;
        };
        Update: {
          barbershop_id?: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'favorite_barbershops_barbershop_id_fkey';
            columns: ['barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbershops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'favorite_barbershops_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          barbershop_id: string | null;
          created_at: string;
          id: string;
          invitation_id: string | null;
          is_read: boolean;
          message: string;
          payment_id: string | null;
          read_at: string | null;
          reservation_id: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          barbershop_id?: string | null;
          created_at?: string;
          id?: string;
          invitation_id?: string | null;
          is_read?: boolean;
          message: string;
          payment_id?: string | null;
          read_at?: string | null;
          reservation_id?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          barbershop_id?: string | null;
          created_at?: string;
          id?: string;
          invitation_id?: string | null;
          is_read?: boolean;
          message?: string;
          payment_id?: string | null;
          read_at?: string | null;
          reservation_id?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_barbershop_id_fkey';
            columns: ['barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbershops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_invitation_fk';
            columns: ['invitation_id', 'barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbershop_invitations';
            referencedColumns: ['id', 'barbershop_id'];
          },
          {
            foreignKeyName: 'notifications_payment_fk';
            columns: ['payment_id', 'barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'payments';
            referencedColumns: ['id', 'barbershop_id'];
          },
          {
            foreignKeyName: 'notifications_reservation_fk';
            columns: ['reservation_id', 'barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'reservations';
            referencedColumns: ['id', 'barbershop_id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          barbershop_id: string;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          id: string;
          method: Database['public']['Enums']['payment_method'];
          payment_note: string | null;
          refunded_at: string | null;
          refunded_by: string | null;
          reservation_id: string;
          status: Database['public']['Enums']['payment_status'];
          updated_at: string;
          yape_reference: string | null;
        };
        Insert: {
          amount: number;
          barbershop_id: string;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          id?: string;
          method: Database['public']['Enums']['payment_method'];
          payment_note?: string | null;
          refunded_at?: string | null;
          refunded_by?: string | null;
          reservation_id: string;
          status?: Database['public']['Enums']['payment_status'];
          updated_at?: string;
          yape_reference?: string | null;
        };
        Update: {
          amount?: number;
          barbershop_id?: string;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          id?: string;
          method?: Database['public']['Enums']['payment_method'];
          payment_note?: string | null;
          refunded_at?: string | null;
          refunded_by?: string | null;
          reservation_id?: string;
          status?: Database['public']['Enums']['payment_status'];
          updated_at?: string;
          yape_reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_confirmed_by_fkey';
            columns: ['confirmed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_refunded_by_fkey';
            columns: ['refunded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_reservation_fk';
            columns: ['reservation_id', 'barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'reservations';
            referencedColumns: ['id', 'barbershop_id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reservation_services: {
        Row: {
          barbershop_id: string;
          created_at: string;
          duration_at_booking: number;
          id: string;
          price_at_booking: number;
          reservation_id: string;
          service_id: string;
          style_id: string | null;
        };
        Insert: {
          barbershop_id: string;
          created_at?: string;
          duration_at_booking: number;
          id?: string;
          price_at_booking: number;
          reservation_id: string;
          service_id: string;
          style_id?: string | null;
        };
        Update: {
          barbershop_id?: string;
          created_at?: string;
          duration_at_booking?: number;
          id?: string;
          price_at_booking?: number;
          reservation_id?: string;
          service_id?: string;
          style_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reservation_services_reservation_fk';
            columns: ['reservation_id', 'barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'reservations';
            referencedColumns: ['id', 'barbershop_id'];
          },
          {
            foreignKeyName: 'reservation_services_service_fk';
            columns: ['service_id', 'barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id', 'barbershop_id'];
          },
          {
            foreignKeyName: 'reservation_services_style_fk';
            columns: ['style_id', 'service_id'];
            isOneToOne: false;
            referencedRelation: 'styles';
            referencedColumns: ['id', 'service_id'];
          },
        ];
      };
      reservations: {
        Row: {
          barber_id: string;
          barbershop_id: string;
          buffer_minutes_at_booking: number;
          cancelled_at: string | null;
          cancelled_by: string | null;
          client_id: string;
          completed_at: string | null;
          created_at: string;
          ends_at: string;
          id: string;
          is_late_cancellation: boolean;
          is_late_reschedule: boolean;
          is_refund_eligible: boolean;
          no_show_at: string | null;
          occupied_until: string;
          previous_barber_id: string | null;
          previous_starts_at: string | null;
          refund_policy_at_late_action:
            Database['public']['Enums']['late_cancellation_refund_policy'] | null;
          reschedule_count: number;
          rescheduled_at: string | null;
          started_at: string | null;
          starts_at: string;
          status: Database['public']['Enums']['reservation_status'];
          total_duration_minutes: number;
          total_price: number;
          updated_at: string;
        };
        Insert: {
          barber_id: string;
          barbershop_id: string;
          buffer_minutes_at_booking: number;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          client_id: string;
          completed_at?: string | null;
          created_at?: string;
          ends_at: string;
          id?: string;
          is_late_cancellation?: boolean;
          is_late_reschedule?: boolean;
          is_refund_eligible?: boolean;
          no_show_at?: string | null;
          occupied_until: string;
          previous_barber_id?: string | null;
          previous_starts_at?: string | null;
          refund_policy_at_late_action?:
            Database['public']['Enums']['late_cancellation_refund_policy'] | null;
          reschedule_count?: number;
          rescheduled_at?: string | null;
          started_at?: string | null;
          starts_at: string;
          status?: Database['public']['Enums']['reservation_status'];
          total_duration_minutes: number;
          total_price: number;
          updated_at?: string;
        };
        Update: {
          barber_id?: string;
          barbershop_id?: string;
          buffer_minutes_at_booking?: number;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          client_id?: string;
          completed_at?: string | null;
          created_at?: string;
          ends_at?: string;
          id?: string;
          is_late_cancellation?: boolean;
          is_late_reschedule?: boolean;
          is_refund_eligible?: boolean;
          no_show_at?: string | null;
          occupied_until?: string;
          previous_barber_id?: string | null;
          previous_starts_at?: string | null;
          refund_policy_at_late_action?:
            Database['public']['Enums']['late_cancellation_refund_policy'] | null;
          reschedule_count?: number;
          rescheduled_at?: string | null;
          started_at?: string | null;
          starts_at?: string;
          status?: Database['public']['Enums']['reservation_status'];
          total_duration_minutes?: number;
          total_price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reservations_barber_fk';
            columns: ['barber_id', 'barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbers';
            referencedColumns: ['id', 'barbershop_id'];
          },
          {
            foreignKeyName: 'reservations_barbershop_id_fkey';
            columns: ['barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbershops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reservations_cancelled_by_fkey';
            columns: ['cancelled_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reservations_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reservations_previous_barber_fk';
            columns: ['previous_barber_id', 'barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbers';
            referencedColumns: ['id', 'barbershop_id'];
          },
        ];
      };
      services: {
        Row: {
          barbershop_id: string;
          created_at: string;
          description: string | null;
          duration_minutes: number;
          id: string;
          is_active: boolean;
          name: string;
          price: number;
          updated_at: string;
        };
        Insert: {
          barbershop_id: string;
          created_at?: string;
          description?: string | null;
          duration_minutes: number;
          id?: string;
          is_active?: boolean;
          name: string;
          price: number;
          updated_at?: string;
        };
        Update: {
          barbershop_id?: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'services_barbershop_id_fkey';
            columns: ['barbershop_id'];
            isOneToOne: false;
            referencedRelation: 'barbershops';
            referencedColumns: ['id'];
          },
        ];
      };
      styles: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          service_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          service_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          service_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'styles_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_barbershop_invitation: {
        Args: {
          p_bio?: string;
          p_display_name?: string;
          p_invitation_id: string;
          p_photo_url?: string;
        };
        Returns: string;
      };
      cancel_barbershop_invitation: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
      cancel_reservation: {
        Args: { p_reservation_id: string };
        Returns: undefined;
      };
      change_payment_method: {
        Args: {
          p_method: Database['public']['Enums']['payment_method'];
          p_reservation_id: string;
        };
        Returns: undefined;
      };
      complete_reservation: {
        Args: { p_reservation_id: string };
        Returns: undefined;
      };
      confirm_cash_payment: {
        Args: { p_reservation_id: string };
        Returns: undefined;
      };
      confirm_yape_payment: {
        Args: {
          p_payment_note?: string;
          p_reservation_id: string;
          p_yape_reference?: string;
        };
        Returns: undefined;
      };
      create_barbershop: {
        Args: {
          p_address?: string;
          p_description?: string;
          p_location_reference?: string;
          p_logo_url?: string;
          p_name: string;
          p_phone?: string;
        };
        Returns: string;
      };
      create_reservation: {
        Args: {
          p_barber_id: string;
          p_items: Json;
          p_payment_method: Database['public']['Enums']['payment_method'];
          p_starts_at: string;
        };
        Returns: string;
      };
      deactivate_barber: { Args: { p_barber_id: string }; Returns: undefined };
      enable_own_barber_profile: {
        Args: {
          p_barbershop_id: string;
          p_bio?: string;
          p_display_name?: string;
          p_photo_url?: string;
        };
        Returns: string;
      };
      get_available_slots: {
        Args: { p_barber_id: string; p_date: string; p_service_ids: string[] };
        Returns: {
          ends_at: string;
          starts_at: string;
        }[];
      };
      get_own_barber_profile: {
        Args: { p_barbershop_id: string };
        Returns: {
          barber_id: string;
          is_active: boolean;
        }[];
      };
      mark_no_show: { Args: { p_reservation_id: string }; Returns: undefined };
      pause_barbershop: {
        Args: { p_barbershop_id: string };
        Returns: undefined;
      };
      publish_barbershop: {
        Args: { p_barbershop_id: string };
        Returns: undefined;
      };
      refund_payment: { Args: { p_reservation_id: string }; Returns: undefined };
      reject_barbershop_invitation: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
      reschedule_reservation: {
        Args: {
          p_new_barber_id: string;
          p_new_starts_at: string;
          p_reservation_id: string;
        };
        Returns: undefined;
      };
      send_barbershop_invitation: {
        Args: {
          p_barbershop_id: string;
          p_channel: Database['public']['Enums']['invitation_channel'];
          p_email: string;
          p_role: Database['public']['Enums']['membership_role'];
        };
        Returns: string;
      };
      start_reservation: {
        Args: { p_reservation_id: string };
        Returns: undefined;
      };
      unpublish_barbershop: {
        Args: { p_barbershop_id: string };
        Returns: undefined;
      };
      update_barbershop: {
        Args: {
          p_address?: string;
          p_barbershop_id: string;
          p_description?: string;
          p_location_reference?: string;
          p_logo_url?: string;
          p_name: string;
          p_phone?: string;
        };
        Returns: undefined;
      };
      update_barbershop_settings: {
        Args: {
          p_appointment_buffer_minutes: number;
          p_barbershop_id: string;
          p_cancellation_notice_minutes: number;
          p_late_cancellation_refund_policy: Database['public']['Enums']['late_cancellation_refund_policy'];
          p_max_booking_days: number;
          p_min_booking_notice_minutes: number;
          p_slot_interval_minutes: number;
        };
        Returns: undefined;
      };
      update_yape_settings: {
        Args: {
          p_barbershop_id: string;
          p_yape_holder_name?: string;
          p_yape_phone?: string;
          p_yape_qr_url?: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      barbershop_status: 'unpublished' | 'published' | 'paused';
      invitation_channel: 'email' | 'app';
      invitation_status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
      late_cancellation_refund_policy: 'full_refund' | 'no_refund';
      membership_role: 'barber' | 'administrator';
      membership_status: 'active' | 'inactive';
      payment_method: 'cash' | 'yape';
      payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
      reservation_status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      barbershop_status: ['unpublished', 'published', 'paused'],
      invitation_channel: ['email', 'app'],
      invitation_status: ['pending', 'accepted', 'rejected', 'expired', 'cancelled'],
      late_cancellation_refund_policy: ['full_refund', 'no_refund'],
      membership_role: ['barber', 'administrator'],
      membership_status: ['active', 'inactive'],
      payment_method: ['cash', 'yape'],
      payment_status: ['pending', 'paid', 'refunded', 'failed'],
      reservation_status: ['confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    },
  },
} as const;
