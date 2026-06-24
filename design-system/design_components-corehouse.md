Here is the complete, implementation-ready component pattern guide for the Corehouse Pilates Studio website. These patterns strictly apply the locked design system decisions, ensuring a "Tactile Calm" aesthetic without relying on SaaS-like borders or pure black.

1.  Site Navigation Header
    A. Purpose: Provides global wayfinding and primary booking action without distracting from the tactile page experience.
    B. Layout structure: Full-width flex container. Desktop: Logo left, navigation links centered, account/booking actions right. Mobile: Logo left, hamburger menu right.
    C. Background and depth: Solid #F4F1E8 (Warm Parchment). No drop shadow. Depth is created by the sticky behavior over scrolling content.
    D. Typography application: Logo uses H3 (Fraunces 500), Links use Label/UI (Sora 600, 13px, uppercase).
    E. Spacing rules: py-6 px-4 md:px-8.
    F. Image/media treatment: No image.
    G. Key Tailwind class strings:
    sticky top-0 z-50 w-full bg-[#F4F1E8] flex items-center justify-between px-4 md:px-8 py-6 transition-colors
    Link wrapper: hidden md:flex items-center gap-8
    H. Interaction states: Links default to opacity-80. Hover: opacity-100 transition-opacity. Active link: text-[#B8A678] opacity-100 relative after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#B8A678] after:rounded-full.
    I. Mobile behavior note: Center links and right actions are hidden behind a mobile menu toggle.
    J. Do not do: Do not add a bottom border or drop shadow to the header.
2.  Homepage Hero Section
    A. Purpose: Establishes the brand feeling, emotional resonance, and primary value proposition immediately upon arrival.
    B. Layout structure: Two-column grid on desktop (text left, large image right). Single column stacked on mobile.
    C. Background and depth: #F4F1E8 base. The image provides the visual weight and depth.
    D. Typography application: Main headline uses Hero (Fraunces 700), Subtitle uses Body Lg (Sora 400).
    E. Spacing rules: pt-16 pb-24 md:pt-24 md:pb-32 gap-12 md:gap-16.
    F. Image/media treatment: 4:5 aspect ratio portrait image. bg-[#E8E2D0] placeholder. rounded-2xl for soft, organic corners.
    G. Key Tailwind class strings:
    Wrapper: w-full max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-24 md:pt-24 md:pb-32 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center
    Headline: font-serif font-bold text-5xl md:text-8xl leading-[1.1] tracking-tight text-[#2D3A1F] mb-6
    H. Interaction states: Primary button hover triggers bg-[#B8A678].
    I. Mobile behavior note: Image stacks below the text. Headline scales down to text-5xl.
    J. Do not do: Do not place text directly over the image; keep them separated to maintain the editorial whitespace.
3.  Homepage Benefits / Studio Points Section
    A. Purpose: Highlights the core pillars of the studio (e.g., equipment, environment, instruction) in an easily scannable format.
    B. Layout structure: Section header top, followed by a 3-column grid of text blocks.
    C. Background and depth: Wrapper uses #E8E2D0 (Warm Cream) to create a soft, borderless separation from the hero section above.
    D. Typography application: Section Title uses H2, Benefit Titles use H3, Benefit Descriptions use Body Reg.
    E. Spacing rules: Section padding py-24. Grid gap gap-12 md:gap-8. Internal block padding p-0 (relying on grid gap for whitespace).
    F. Image/media treatment: No image (or optional small SVG icons in #2D3A1F).
    G. Key Tailwind class strings:
    Wrapper: w-full bg-[#E8E2D0] py-24
    Grid: max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mt-16
    H. Interaction states: Static informational section, no complex interactions.
    I. Mobile behavior note: Grid collapses to 1 column.
    J. Do not do: Do not put the individual benefit items inside white bordered boxes. Let them breathe on the background.
4.  Homepage Classes Preview Section
    A. Purpose: Teases the primary class offerings (Reformer, Mat) and drives users to the full schedule.
    B. Layout structure: Section header with a "View All" link top right. 2-column grid of large class cards below.
    C. Background and depth: #F4F1E8 background. Cards use #E8E2D0 to stand out softly.
    D. Typography application: Section Title uses H2. Card Titles use H3.
    E. Spacing rules: py-24. Grid gap-8.
    F. Image/media treatment: 16:9 aspect ratio image per card. rounded-t-2xl.
    G. Key Tailwind class strings:
    Header Flex: flex flex-col md:flex-row md:items-end justify-between mb-12
    Grid: grid grid-cols-1 md:grid-cols-2 gap-8
    H. Interaction states: Entire card is clickable. Hovering the card slightly scales the image inside an overflow-hidden container (hover:scale-105 duration-500).
    I. Mobile behavior note: Stacks to 1 column. "View All" link moves below the grid.
    J. Do not do: Do not use a drop shadow on the class cards.
5.  Homepage Instructors Preview Section
    A. Purpose: Introduces the teaching team to build trust and humanize the brand.
    B. Layout structure: Section header left, 3-column or 4-column grid of instructor cards.
    C. Background and depth: #F4F1E8 background.
    D. Typography application: Section Title uses H2.
    E. Spacing rules: py-24. Grid gap-6 md:gap-8.
    F. Image/media treatment: 3:4 aspect ratio portrait images. rounded-2xl.
    G. Key Tailwind class strings:
    Grid: grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-12
    H. Interaction states: Image hover effect (subtle scale or grayscale to color transition).
    I. Mobile behavior note: 2-column grid on mobile so faces aren't too small.
    J. Do not do: Do not put text inside the image. Text must sit below the image.
6.  Homepage Testimonials / Trust Section
    A. Purpose: Provides social proof through client quotes in a high-impact, emotional format.
    B. Layout structure: Single column, centered text.
    C. Background and depth: #2D3A1F (Deep Forest Green) full-width background to create a dramatic, grounding break in the page.
    D. Typography application: Quote uses H2 (Fraunces 500), Author uses Tag (Sora 500, 12px).
    E. Spacing rules: py-32 px-4 md:px-8. Max-width constraint on the text.
    F. Image/media treatment: No image.
    G. Key Tailwind class strings:
    Wrapper: w-full bg-[#2D3A1F] py-32 flex flex-col items-center justify-center text-center px-4
    Quote Text: max-w-4xl font-serif font-medium text-2xl md:text-4xl leading-snug text-[#F4F1E8] mb-8
    Author: font-sans font-medium text-xs tracking-wide text-[#B8A678] uppercase
    H. Interaction states: Static.
    I. Mobile behavior note: Padding reduces to py-24.
    J. Do not do: Do not use a carousel with arrows. Show one strong quote, or stack two. Carousels feel like software.
7.  Homepage Final CTA Section
    A. Purpose: Captures the user at the end of the page and drives the primary booking action.
    B. Layout structure: Centered content block.
    C. Background and depth: #E8E2D0 background wrapper, rounded-3xl margin-in from the edges.
    D. Typography application: Headline uses H1, Body uses Body Lg.
    E. Spacing rules: my-24 mx-4 md:mx-8 py-24 px-4.
    F. Image/media treatment: No image.
    G. Key Tailwind class strings:
    Wrapper: max-w-6xl mx-auto bg-[#E8E2D0] rounded-3xl py-24 px-4 flex flex-col items-center text-center my-24
    H. Interaction states: Primary button hover (bg-[#B8A678]).
    I. Mobile behavior note: Margin reduces to mx-4, padding to py-16.
    J. Do not do: Do not make this section full-bleed; the rounded-3xl inset box makes it feel like a tactile card.
8.  Class Card (reusable)
    A. Purpose: Displays class details (Reformer, Mat) in lists and grids.
    B. Layout structure: Vertical stack: Image top, Content bottom.
    C. Background and depth: bg-[#E8E2D0] (Warm Cream). No border.
    D. Typography application: Title uses H3, Meta uses Tag, Description uses Body Sm.
    E. Spacing rules: Image is flush. Content padding p-6 md:p-8.
    F. Image/media treatment: 16:9 aspect ratio, bg-[#CDD2C9] placeholder, rounded-t-2xl.
    G. Key Tailwind class strings:
    Card Wrapper: flex flex-col bg-[#E8E2D0] rounded-2xl overflow-hidden group cursor-pointer
    Content Wrapper: p-6 md:p-8 flex flex-col gap-3
    Title: font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]
    H. Interaction states: Group hover scales the image. Title color might shift to #B8A678 on hover.
    I. Mobile behavior note: Content padding reduces to p-6.
    J. Do not do: Do not add a "Read More" button inside the card. The whole card is the target.
9.  Instructor Card (reusable)
    A. Purpose: Displays instructor name and specialty.
    B. Layout structure: Portrait image with text stacked directly below.
    C. Background and depth: Transparent background. The image defines the shape.
    D. Typography application: Name uses H3, Role uses Body Sm or Tag.
    E. Spacing rules: mt-4 between image and text.
    F. Image/media treatment: 3:4 aspect ratio, rounded-2xl, object-cover.
    G. Key Tailwind class strings:
    Wrapper: flex flex-col group cursor-pointer
    Image Wrapper: w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#E8E2D0] mb-4
    Name: font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]
    H. Interaction states: Image zooms slightly on hover.
    I. Mobile behavior note: Remains standard vertical stack.
    J. Do not do: Do not put a border around the instructor card.
10. Pricing Tier Card (reusable)
    A. Purpose: Presents a specific purchasing option clearly and attractively.
    B. Layout structure: Vertical stack: Tagline/Duration top, Price middle, Features list, Button bottom.
    C. Background and depth: bg-[#E8E2D0]. rounded-3xl. No border.
    D. Typography application: Price uses H1 (Fraunces 600), Title uses H3, Features use Body Reg.
    E. Spacing rules: p-8 md:p-10. gap-6 between internal sections.
    F. Image/media treatment: No image.
    G. Key Tailwind class strings:
    Card Wrapper: bg-[#E8E2D0] rounded-3xl p-8 md:p-10 flex flex-col h-full
    Price: font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-[#2D3A1F] my-4
    Feature List: flex flex-col gap-3 mb-8 flex-grow
    H. Interaction states: Button hover state. If it's a "featured" tier, background could be #2D3A1F and text #F4F1E8.
    I. Mobile behavior note: Padding reduces to p-6.
    J. Do not do: Do not make the price small. The price is the visual anchor of this card.
11. Pricing Page Layout
    A. Purpose: Organizes all pricing options (Drop-in, Memberships, Packages) logically.
    B. Layout structure: Page Header (H1), followed by sectioned grids (e.g., a 1-col section for Drop-in, a 3-col grid for Memberships).
    C. Background and depth: Page background #F4F1E8.
    D. Typography application: Page Title H1, Section Titles H2.
    E. Spacing rules: py-24 for the page, gap-16 between pricing categories.
    F. Image/media treatment: No image.
    G. Key Tailwind class strings:
    Page Wrapper: max-w-7xl mx-auto px-4 md:px-8 py-24
    Category Grid: grid grid-cols-1 md:grid-cols-3 gap-8 mt-8
    H. Interaction states: Standard card interactions.
    I. Mobile behavior note: All grids collapse to 1 column.
    J. Do not do: Do not use a complex toggle switch (Monthly/Yearly) if it can be avoided; keep options visible and tactile.
12. FAQ Accordion Component
    A. Purpose: Answers common questions compactly without overwhelming the page.
    B. Layout structure: Vertical list of items. Click to expand.
    C. Background and depth: Transparent background. Separated by hairline borders.
    D. Typography application: Question uses H3, Answer uses Body Reg.
    E. Spacing rules: py-6 per item.
    F. Image/media treatment: Plus/Minus SVG icon (w-6 h-6 text-[#2D3A1F]).
    G. Key Tailwind class strings:
    List Wrapper: w-full max-w-3xl mx-auto flex flex-col border-t border-[#CDD2C9]
    Item Wrapper: border-b border-[#CDD2C9] py-6 cursor-pointer group
    Question Flex: flex justify-between items-center
    Question Text: font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F] group-hover:text-[#B8A678] transition-colors
    Answer Text: font-sans text-[17px] leading-relaxed tracking-[0.01em] text-[#2D3A1F] opacity-80 pt-4 hidden (toggle hidden via state)
    H. Interaction states: Question text shifts to #B8A678 on hover. Icon rotates on active.
    I. Mobile behavior note: Standard behavior.
    J. Do not do: Do not put each FAQ inside its own bordered box. Use only horizontal dividers.
    Implementation note: The Answer Text toggle (hidden/visible state)
    requires the FAQ accordion parent to be a client component.
    Add 'use client' at the top of the FAQ accordion component file.
    This is the only component in the entire design system that requires
    client-side interactivity for its basic function.
    All other components are safe to implement as React Server Components.
13. Contact Form Section
    A. Purpose: Captures user inquiries elegantly.
    B. Layout structure: 2-column grid. Contact info/text on left, form on right.
    C. Background and depth: Page #F4F1E8. Form inputs use #E8E2D0 to create inset depth.
    D. Typography application: Labels use Label/UI, Inputs use Body Reg.
    E. Spacing rules: gap-16 between columns. Inputs have p-4 and mb-6.
    F. Image/media treatment: No image.
    G. Key Tailwind class strings:
    Input Field: w-full bg-[#E8E2D0] rounded-xl p-4 font-sans text-[17px] text-[#2D3A1F] placeholder:text-[#2D3A1F]/50 focus:outline-none focus:ring-2 focus:ring-[#B8A678] transition-all
    Label: block font-sans font-semibold text-[13px] uppercase tracking-widest leading-none text-[#2D3A1F] mb-2
    H. Interaction states: Input focus triggers ring-2 ring-[#B8A678].
    I. Mobile behavior note: Stacks to 1 column, info on top.
    J. Do not do: Do not use white inputs with gray borders. It looks like a SaaS login screen.
14. About / Story Section
    A. Purpose: Tells the brand story and philosophy with an editorial feel.
    B. Layout structure: Asymmetric 2-column grid (e.g., 5 columns text, 7 columns image).
    C. Background and depth: #F4F1E8.
    D. Typography application: Headline H2, Text Body Lg.
    E. Spacing rules: py-24, gap-16.
    F. Image/media treatment: Large, unconstrained height image. rounded-2xl.
    G. Key Tailwind class strings:
    Grid: grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center
    Text Col: md:col-span-5
    Image Col: md:col-span-7
    H. Interaction states: Static.
    I. Mobile behavior note: Stacks to 1 column. Image goes above or below text depending on narrative flow.
    J. Do not do: Do not center-align long paragraphs of text. Left-align for readability.
15. Booking Calendar UI (date picker + time slot selector)
    A. Purpose: Allows users to select a class time without feeling like a medical portal.
    B. Layout structure: Horizontal scrollable row of dates top. Grid of time pills below.
    C. Background and depth: Container #F4F1E8. Inactive pills #E8E2D0. Active pills #2D3A1F.
    D. Typography application: Day/Date uses Label/UI and H3. Time uses Body Reg.
    E. Spacing rules: gap-4 between dates, gap-3 between time pills.
    F. Image/media treatment: No image.
    G. Key Tailwind class strings:
    Date Pill (Inactive): flex flex-col items-center justify-center min-w-[80px] py-4 rounded-2xl bg-[#E8E2D0] text-[#2D3A1F] cursor-pointer hover:bg-[#CDD2C9] transition-colors
    Date Pill (Active): flex flex-col items-center justify-center min-w-[80px] py-4 rounded-2xl bg-[#2D3A1F] text-[#F4F1E8] shadow-md
    Time Pill (Inactive):
    w-full py-3 rounded-xl bg-[#E8E2D0] text-center font-sans
    text-[17px] text-[#2D3A1F] hover:bg-[#CDD2C9]
    cursor-pointer transition-colors

        Time Pill (Active):
        w-full py-3 rounded-xl bg-[#2D3A1F] text-center font-sans
        text-[17px] text-[#F4F1E8]
        H. Interaction states: Hover darkens inactive pills. Selected state inverts colors.
        I. Mobile behavior note: Horizontal scroll for dates is essential on mobile (overflow-x-auto snap-x).
        J. Do not do: Do not use a standard HTML <input type="date"> grid. Use custom tactile pills.

16. Site Footer
    A. Purpose: Secondary navigation, contact info, and legal grounding.
    B. Layout structure: 4-column grid top (Brand, Links, Links, Contact). Hairline divider. Copyright bottom.
    C. Background and depth: #2D3A1F (Deep Forest Green) to anchor the bottom of the page.
    D. Typography application: Headings use Label/UI (text-[#B8A678]), Links use Body Sm (text-[#F4F1E8]), Copyright uses Micro.
    E. Spacing rules: pt-24 pb-8 px-4 md:px-8.
    F. Image/media treatment: Logo in #F4F1E8.
    G. Key Tailwind class strings:
    Wrapper: w-full bg-[#2D3A1F] text-[#F4F1E8] pt-24 pb-8 px-4 md:px-8
    Grid: max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16
    Divider: border-t border-[#F4F1E8]/20 pt-8 flex justify-between items-center
    H. Interaction states: Link hover text-[#B8A678].
    I. Mobile behavior note: Stacks to 1 column.
    J. Do not do: Do not make the footer the same color as the page background; it needs to act as a visual terminus.
17. Section Wrapper (Reusable)
    A. Purpose: Standardizes spacing and max-width across all page sections.
    B. Layout structure: Centered container.
    C. Background and depth: Inherits from parent.
    D. Typography application: N/A.
    E. Spacing rules: max-w-7xl mx-auto px-4 md:px-8.
    F. Image/media treatment: N/A.
    G. Key Tailwind class strings:
    w-full max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24
    H. Interaction states: N/A.
    I. Mobile behavior note: Padding reduces to px-4 py-16.
    J. Do not do: Do not hardcode widths; always use max-w and w-full.
18. Image Placeholder Block
    A. Purpose: Stand-in for missing photography that still looks intentional and premium.
    B. Layout structure: Fills parent container.
    C. Background and depth: bg-[#E8E2D0].
    D. Typography application: N/A.
    E. Spacing rules: N/A.
    F. Image/media treatment: object-cover.
    G. Key Tailwind class strings:
    w-full h-full bg-[#E8E2D0] rounded-2xl object-cover flex items-center justify-center
    H. Interaction states: N/A.
    I. Mobile behavior note: N/A.
    J. Do not do: Do not use gray (#CCCCCC) for placeholders. Always use the Warm Cream (#E8E2D0).
    GLOBAL LAYOUT RULES
    Max Container Width & Padding:
    Desktop: max-w-7xl (80rem / 1280px). Horizontal padding px-8.
    Mobile: Horizontal padding px-4.
    Standard Section Vertical Padding Scale:
    Small (sm): py-12 (Used for tight groupings, like within pricing or FAQ).
    Medium (md): py-16 md:py-24 (Standard section gap).
    Large (lg): py-24 md:py-32 (Hero sections, Trust/Testimonial sections).
    Background Alternation Strategy:
    To avoid the "zebra-stripe" look while maintaining separation:
    Default page background is always #F4F1E8 (Warm Parchment).
    Use #E8E2D0 (Warm Cream) for inset cards or specific tactile sections (like the CTA block) rather than full full-bleed bands where possible.
    If a full-bleed band is needed for pacing, use #E8E2D0 sparingly.
    Use #2D3A1F (Deep Forest Green) strictly for high-contrast interruptions (Testimonials, Footer).
    Standard Grid Column Patterns:
    2-Column: grid-cols-1 md:grid-cols-2. Used for Hero, Image/Text splits, Class cards.
    3-Column: grid-cols-1 md:grid-cols-3. Used for Benefits, Memberships.
    4-Column: grid-cols-2 md:grid-cols-4. Used for Instructors, Footer links.
    Dark Section Structure (#2D3A1F backgrounds):
    Background: bg-[#2D3A1F].
    Text: Primary text becomes #F4F1E8.
    Accents: Use #B8A678 (Muted Gold) for buttons, active states, and small labels (Tags/Micro).
    Borders: If dividers are needed in dark sections, use border-[#F4F1E8]/20 (20% opacity parchment).
    Responsive Image Strategy (Pre-Photography):
    All image slots must have a defined aspect ratio (e.g., aspect-[4/5], aspect-[16/9], aspect-[3/4]) to prevent layout shift.
    All placeholders must use bg-[#E8E2D0] and rounded-2xl.
    Do not put text inside the placeholder boxes. Let the UI structure stand on its own so that when real photos are dropped in, no text legibility issues arise.
