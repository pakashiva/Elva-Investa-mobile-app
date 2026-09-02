export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          full_name: string;
          mobile_number: string;
          email_address: string;
          date_of_birth: string;
          address: string;
          city: string;
          state: string;
          pin_code: string;
          authorized: boolean;
          mobile_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          full_name: string;
          mobile_number: string;
          email_address: string;
          date_of_birth: string;
          address: string;
          city: string;
          state: string;
          pin_code: string;
          authorized: boolean;
          mobile_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      kyc_documents: {
        Row: {
          id: string;
          user_id: string;
          aadhaar_number: string;
          pan_number: string;
          aadhaar_front_path: string;
          aadhaar_back_path: string;
          pan_card_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          aadhaar_number: string;
          pan_number: string;
          aadhaar_front_path: string;
          aadhaar_back_path: string;
          pan_card_path: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['kyc_documents']['Insert']>;
        Relationships: [];
      };
      bank_accounts: {
        Row: {
          id: string;
          user_id: string;
          account_holder_name: string;
          account_number: string;
          ifsc_code: string;
          bank_name: string;
          account_type: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_holder_name: string;
          account_number: string;
          ifsc_code: string;
          bank_name: string;
          account_type?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['bank_accounts']['Insert']>;
        Relationships: [];
      };
      nominees: {
        Row: {
          id: string;
          user_id: string;
          nominee_name: string;
          relationship: string;
          nominee_aadhaar: string;
          nominee_percentage: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nominee_name: string;
          relationship: string;
          nominee_aadhaar: string;
          nominee_percentage: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['nominees']['Insert']>;
        Relationships: [];
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          name: string;
          detail_subtitle: string | null;
          status: string;
          fund_amount: number;
          current_value: number | null;
          invested_date: string | null;
          interest_rate: number;
          tds_percent: number;
          completed_interest_periods: number;
          total_earnings: number;
          tds_deducted_amount: number;
          yield_rate: string | null;
          earned_interest: string | null;
          tds_deducted: string | null;
          net_earned: string | null;
          bank_account_id: string;
          nominee_id: string;
          pay_date: string;
          referral_code: string | null;
          agreement_charges: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code?: string;
          name?: string;
          detail_subtitle?: string | null;
          status?: string;
          fund_amount: number;
          current_value?: number | null;
          invested_date?: string | null;
          interest_rate?: number;
          tds_percent?: number;
          completed_interest_periods?: number;
          total_earnings?: number;
          tds_deducted_amount?: number;
          yield_rate?: string | null;
          earned_interest?: string | null;
          tds_deducted?: string | null;
          net_earned?: string | null;
          bank_account_id: string;
          nominee_id: string;
          pay_date: string;
          referral_code?: string | null;
          agreement_charges?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['investments']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'investments_bank_account_id_fkey';
            columns: ['bank_account_id'];
            isOneToOne: false;
            referencedRelation: 'bank_accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'investments_nominee_id_fkey';
            columns: ['nominee_id'];
            isOneToOne: false;
            referencedRelation: 'nominees';
            referencedColumns: ['id'];
          },
        ];
      };
      withdrawals: {
        Row: {
          id: string;
          user_id: string;
          investment_id: string;
          bank_account_id: string;
          status: string;
          withdrawal_amount: number;
          strategy: string;
          requested_on: string;
          net_payout: number | null;
          status_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          investment_id: string;
          bank_account_id: string;
          status?: string;
          withdrawal_amount: number;
          strategy?: string;
          requested_on?: string;
          net_payout?: number | null;
          status_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['withdrawals']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'withdrawals_investment_id_fkey';
            columns: ['investment_id'];
            isOneToOne: false;
            referencedRelation: 'investments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'withdrawals_bank_account_id_fkey';
            columns: ['bank_account_id'];
            isOneToOne: false;
            referencedRelation: 'bank_accounts';
            referencedColumns: ['id'];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_code: string;
          transaction_type: string;
          amount: number;
          investment_id: string | null;
          investment_plan_id: string;
          reference_id: string | null;
          transaction_date: string;
          source_type: string;
          source_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_code?: string;
          transaction_type: string;
          amount: number;
          investment_id?: string | null;
          investment_plan_id: string;
          reference_id?: string | null;
          transaction_date: string;
          source_type: string;
          source_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'transactions_investment_id_fkey';
            columns: ['investment_id'];
            isOneToOne: false;
            referencedRelation: 'investments';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      process_user_investment_interest: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_recovery_mobile_by_email: {
        Args: { p_email: string };
        Returns: string;
      };
      mark_mobile_verified: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      complete_password_recovery: {
        Args: { p_email: string; p_new_password: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
