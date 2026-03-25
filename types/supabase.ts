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
      announcement_categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      announcement_category_links: {
        Row: {
          announcement_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          announcement_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          announcement_id?: string;
          category_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'announcement_category_links_announcement_id_fkey';
            columns: ['announcement_id'];
            isOneToOne: false;
            referencedRelation: 'announcements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'announcement_category_links_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'announcement_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      announcement_files: {
        Row: {
          announcement_id: string;
          created_at: string | null;
          file_name: string | null;
          file_type: string;
          file_url: string;
          id: string;
        };
        Insert: {
          announcement_id: string;
          created_at?: string | null;
          file_name?: string | null;
          file_type: string;
          file_url: string;
          id?: string;
        };
        Update: {
          announcement_id?: string;
          created_at?: string | null;
          file_name?: string | null;
          file_type?: string;
          file_url?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'announcement_files_announcement_id_fkey';
            columns: ['announcement_id'];
            isOneToOne: false;
            referencedRelation: 'announcements';
            referencedColumns: ['id'];
          },
        ];
      };
      announcements: {
        Row: {
          created_at: string;
          description: string | null;
          division_id: string;
          expires_at: string | null;
          group_id: string | null;
          id: string;
          published_at: string | null;
          slug: string;
          status: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          division_id: string;
          expires_at?: string | null;
          group_id?: string | null;
          id?: string;
          published_at?: string | null;
          slug: string;
          status?: string;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          division_id?: string;
          expires_at?: string | null;
          group_id?: string | null;
          id?: string;
          published_at?: string | null;
          slug?: string;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'announcements_division_id_fkey';
            columns: ['division_id'];
            isOneToOne: false;
            referencedRelation: 'divisions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'announcements_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      breaking_news: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          expires_at: string | null;
          id: string;
          level: string;
          slug: string;
          status: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          expires_at?: string | null;
          id?: string;
          level: string;
          slug: string;
          status?: string;
          title: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          expires_at?: string | null;
          id?: string;
          level?: string;
          slug?: string;
          status?: string;
          title?: string;
        };
        Relationships: [];
      };
      danger_news: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          expires_at: string;
          id: string;
          status: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          expires_at: string;
          id?: string;
          status?: string;
          title: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          expires_at?: string;
          id?: string;
          status?: string;
          title?: string;
        };
        Relationships: [];
      };
      danger_news_settings: {
        Row: {
          accent_color: string;
          badge_label: string;
          created_at: string;
          gradient_from_color: string;
          gradient_to_color: string;
          id: string;
          icon_name: string;
          is_enabled: boolean;
          max_items: number;
          separator: string;
          speed_seconds: number;
          text_color: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          accent_color?: string;
          badge_label?: string;
          created_at?: string;
          gradient_from_color?: string;
          gradient_to_color?: string;
          id?: string;
          icon_name?: string;
          is_enabled?: boolean;
          max_items?: number;
          separator?: string;
          speed_seconds?: number;
          text_color?: string;
          title?: string;
          updated_at?: string;
        };
        Update: {
          accent_color?: string;
          badge_label?: string;
          created_at?: string;
          gradient_from_color?: string;
          gradient_to_color?: string;
          id?: string;
          icon_name?: string;
          is_enabled?: boolean;
          max_items?: number;
          separator?: string;
          speed_seconds?: number;
          text_color?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      divisions: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      event_categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      event_category_links: {
        Row: {
          category_id: string;
          created_at: string;
          event_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          event_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          event_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_category_links_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'event_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_category_links_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      event_people: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          name: string;
          role: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          name: string;
          role: string;
          type: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          name?: string;
          role?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_people_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      event_photos: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          photo_url: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          photo_url: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          photo_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_photos_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          cover_image: string | null;
          created_at: string;
          description: string | null;
          ends_at: string;
          id: string;
          location: string | null;
          slug: string;
          starts_at: string;
          status: string;
          title: string;
          total_attendees: number;
        };
        Insert: {
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at: string;
          id?: string;
          location?: string | null;
          slug: string;
          starts_at: string;
          status?: string;
          title: string;
          total_attendees?: number;
        };
        Update: {
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at?: string;
          id?: string;
          location?: string | null;
          slug?: string;
          starts_at?: string;
          status?: string;
          title?: string;
          total_attendees?: number;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          created_at: string;
          division_id: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          division_id: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          division_id?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_division_id_fkey';
            columns: ['division_id'];
            isOneToOne: false;
            referencedRelation: 'divisions';
            referencedColumns: ['id'];
          },
        ];
      };
      home_carousel_slides: {
        Row: {
          created_at: string;
          cta_label: string;
          id: string;
          image_url: string;
          sort_order: number;
          status: string;
          subtitle: string;
          target: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          cta_label: string;
          id?: string;
          image_url: string;
          sort_order?: number;
          status?: string;
          subtitle: string;
          target: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          cta_label?: string;
          id?: string;
          image_url?: string;
          sort_order?: number;
          status?: string;
          subtitle?: string;
          target?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      search_public_content: {
        Args: {
          date_from?: string | null;
          date_to?: string | null;
          filter_type?: string | null;
          search_query: string;
        };
        Returns: {
          badge: string | null;
          excerpt: string | null;
          happened_at: string;
          id: string;
          slug: string;
          title: string;
          type: string;
        }[];
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

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer Row;
    }
    ? Row
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer Row;
      }
      ? Row
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer Insert;
    }
    ? Insert
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer Insert;
      }
      ? Insert
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer Update;
    }
    ? Update
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer Update;
      }
      ? Update
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
