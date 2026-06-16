export const site_design_v1 = {
  version: 'v1',
  design_mode: 'simple_first_release',
  reference_source: 'pilates_republic',
  allowed_reference_sources: ['pilates_republic'],

  implementation_intent: {
    keep_simple: true,
    keep_professional: true,
    keep_booking_prominent: true,
    allow_placeholder_content: true,
    avoid_scope_drift: true,
    homepage_sets_visual_language: true,
  },

  cta_rules: {
    primary_label: 'Book Now',
    secondary_label: 'View Classes',
    primary_cta_goal: 'booking',
    booking_visibility_priority: 'high',
  },

  layout_rules: {
    required_homepage_order: [
      'header',
      'hero',
      'studio_overview',
      'classes_preview',
      'pricing_preview',
      'instructors_preview',
      'contact_preview',
      'faq_preview',
      'footer',
    ],
    container_style: 'clean_marketing',
    section_rhythm: 'spacious_but_simple',
    density: 'medium',
    allow_complex_layouts: false,
  },

  visual_rules: {
    tone: ['calm', 'clear', 'professional', 'simple', 'modern'],
    avoid: [
      'overdesigned_sections',
      'heavy_animation',
      'experimental_layouts',
      'visual_clutter',
      'multiple_competing_ctas',
      'mixed_reference_styles',
    ],
    footer_style: 'professional_complete_footer',
    hero_style: 'simple_conversion_focused',
    pricing_style: 'easy_to_scan',
    card_style: 'clean_consistent_cards',
  },

  motion_rules: {
    use_subtle_motion_only: true,
    allow_hover_transitions: true,
    allow_small_card_interactions: true,
    allow_small_button_interactions: true,
    allow_heavy_scroll_theatrics: false,
    allow_animation_led_design: false,
  },

  content_rules: {
    centralize_placeholder_content: true,
    placeholder_prefix: 'TODO_',
    keep_placeholders_obvious: true,
    do_not_invent_detailed_business_facts: true,
    use_real_business_data_when_approved: true,
  },

  accessibility_rules: {
    require_semantic_headings: true,
    require_visible_focus_states: true,
    require_alt_text: true,
    require_keyboard_usable_navigation: true,
    require_mobile_usability: true,
  },

  engineering_rules: {
    reuse_existing_repo_patterns: true,
    prefer_small_clean_changes: true,
    prefer_existing_architecture_over_new_systems: true,
    avoid_large_new_abstractions: true,
    build_one_page_at_a_time: true,
    preferred_variable_case: 'snake_case',
  },

  rollout_rules: {
    current_priority: 'homepage',
    next_pages_after_homepage: ['classes', 'pricing', 'instructors', 'contact', 'faq'],
    require_review_before_next_page: true,
  },
} as const;

export type SiteDesignV1 = typeof site_design_v1;
