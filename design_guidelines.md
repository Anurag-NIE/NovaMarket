{
  "brand": {
    "name": "NovoMarket",
    "personality": ["trustworthy", "sleek", "efficient", "human"],
    "design_style": "Swiss grid + Glassmorphism accents + Bento grid. Mobile-first with subtle depth and crisp typography."
  },
  "typography": {
    "fonts": {
      "heading": "Space Grotesk",
      "body": "Karla",
      "fallbacks": "system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif",
      "import_snippet": "<link href=\"https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Karla:wght@400;500;600;700&display=swap\" rel=\"stylesheet\">"
    },
    "scale": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl tracking-tight font-semibold",
      "h2": "text-base md:text-lg font-semibold text-foreground/90",
      "body": "text-base md:text-base leading-7",
      "small": "text-sm leading-6",
      "mono": "font-mono text-sm"
    },
    "usage": {
      "headings": "Space Grotesk for H1–H4. Tight tracking on large display, normal elsewhere.",
      "body": "Karla for paragraphs, forms, and controls for readability.",
      "weights": "400–700 only.",
      "line_length": "45–75ch for reading areas (product details, policies)."
    }
  },
  "color_system": {
    "semantics": {
      "primary": {"hsl": "202 84% 38%", "hex": "#146C94", "usage": "Actions, highlights, links, active nav"},
      "accent": {"hsl": "160 60% 40%", "hex": "#199A74", "usage": "Positive accents, verified seller, success CTAs"},
      "surface": {"hsl": "0 0% 100%", "hex": "#FFFFFF", "usage": "Cards, content areas"},
      "elevated": {"hsl": "210 20% 98%", "hex": "#F7F9FC", "usage": "Bento tiles, section backgrounds"},
      "ink": {"hsl": "220 14% 12%", "hex": "#151718", "usage": "Primary text on light"},
      "muted": {"hsl": "220 10% 40%", "hex": "#5D636B", "usage": "Secondary text"},
      "border": {"hsl": "220 13% 90%", "hex": "#E6E8EB", "usage": "Dividers, inputs"},
      "warning": {"hsl": "35 92% 52%", "hex": "#F59E0B"},
      "success": {"hsl": "142 70% 35%", "hex": "#15803D"},
      "error": {"hsl": "0 72% 50%", "hex": "#EF4444"}
    },
    "dark_mode": {
      "background": "0 0% 6%",
      "surface": "0 0% 10%",
      "ink": "0 0% 98%",
      "muted": "0 0% 70%",
      "border": "0 0% 18%",
      "primary": "202 90% 60%",
      "accent": "160 60% 48%"
    },
    "tailwind_tokens_addition": "Add to /app/frontend/src/index.css under :root and .dark. Keep existing tokens and ADD these:",
    "css_vars_snippet": ":root{--brand-primary:202 84% 38%;--brand-accent:160 60% 40%;--brand-elevated:210 20% 98%;--brand-ink:220 14% 12%;--brand-muted:220 10% 40%;--brand-border:220 13% 90%;--brand-success:142 70% 35%;--brand-warning:35 92% 52%;--brand-error:0 72% 50%;--ring:202 84% 38%;} .dark{--brand-primary:202 90% 60%;--brand-accent:160 60% 48%;--brand-elevated:0 0% 10%;--brand-ink:0 0% 98%;--brand-muted:0 0% 70%;--brand-border:0 0% 18%;}",
    "contrast_rules": "AA contrast on all text. Prefer solid surfaces behind dense copy."
  },
  "gradients_and_textures": {
    "restriction_rule": "NEVER use dark/saturated purple/pink gradients. Never exceed 20% viewport coverage. Never on text blocks or small UI elements.",
    "approved_blends": [
      {"name": "Seafoam Breeze", "css": "bg-[radial-gradient(100%_60%_at_10%_0%,hsl(202_84%_95%)_0%,hsl(160_60%_96%)_40%,transparent_70%)]"},
      {"name": "Coastal Dawn", "css": "bg-[linear-gradient(120deg,hsl(202_84%_96%)_0%,hsl(35_92%_96%)_50%,hsl(160_60%_96%)_100%)]"}
    ],
    "usage": "Hero backdrop and section separators only (decorative). Add subtle grain via 2% noise overlay to avoid flatness.",
    "enforcement": "If gradient harms readability or exceeds 20% viewport, revert to solid elevated surface."
  },
  "layout_patterns": {
    "global": {
      "container": "mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8",
      "grid_system": "12-column fluid grid. Mobile: single column; md: 6/6; lg: 4/8 and 3/9 options.",
      "spacing": "8px scale. Section padding: py-10 md:py-14 lg:py-20."
    },
    "home_bento": "Grid of bento tiles (Search, Trending, New Arrivals, Top Services, Sell CTA, Safety Tips).",
    "listing_page": {
      "filters": "Sticky sidebar on md+ (w-72). On mobile use Sheet full-height.",
      "results": "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6",
      "empty_state": "Centered card with icon, message, broaden filters CTA."
    },
    "product_detail": "F-pattern layout. Left: Carousel gallery. Right: title, price, seller, actions. Tabs below for Details, Reviews, Policies.",
    "service_detail": "Split hero: illustration + booking card (Calendar).",
    "buyer_dashboard": "Bento overview of Orders, Wishlist, Messages, with recent activity list.",
    "seller_dashboard": "Analytics-first with Recharts for sales, views. Quick actions: Add Listing, Manage Orders, Messages.",
    "chat": "Two-panel md+ (threads | messages). Mobile single column with sticky composer.",
    "auth": "Single column within container; do not center the whole app globally."
  },
  "components": {
    "search": {
      "pattern": "Command palette (Cmd/Ctrl+K) + filter chips row.",
      "shadcn": ["command.jsx", "input.jsx", "badge.jsx", "popover.jsx", "button.jsx"],
      "micro_interactions": "Hover chip elevates (shadow-sm). Clear-all fades in when filters exist.",
      "classes": "sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b"
    },
    "filter_sidebar": {
      "shadcn": ["sheet.jsx", "accordion.jsx", "checkbox.jsx", "slider.jsx", "select.jsx", "button.jsx"],
      "mobile": "Sheet from left, full-height, scrollable. Close on route change.",
      "states": "Remember selections; show active count badge.",
      "data_testid_examples": ["open-filter-button", "price-range-slider", "brand-checkbox"]
    },
    "product_card": {
      "shadcn": ["card.jsx", "badge.jsx", "button.jsx", "tooltip.jsx"],
      "layout": "Image top (AspectRatio 4/3), content: title, price, rating, seller badge, actions row.",
      "styles": "rounded-xl border bg-surface hover:shadow-md transition-shadow duration-200",
      "states": "Discount badge. Out-of-stock dims image and disables CTA.",
      "hover": "Scale image 1.02; reveal quick actions (wishlist, compare).",
      "accessibility": "Icons have aria-label and data-testid."
    },
    "service_card": {"pattern": "Like product_card with schedule CTA and duration.", "extra": "Use Calendar in booking modal."},
    "product_gallery": {"shadcn": ["carousel.jsx", "aspect-ratio.jsx", "dialog.jsx"], "pattern": "Thumbnails + Dialog zoom."},
    "review_rating": {"shadcn": ["form.jsx", "textarea.jsx", "radio-group.jsx", "button.jsx"], "pattern": "5-point rating with stars.", "states": "Optimistic update + Sonner toast."},
    "chat": {"shadcn": ["scroll-area.jsx", "input.jsx", "button.jsx", "avatar.jsx", "separator.jsx"], "pattern": "Message list + sticky composer.", "safety": "Report/Block in dropdown-menu.jsx"},
    "navigation": {"shadcn": ["navigation-menu.jsx", "menubar.jsx", "dropdown-menu.jsx", "badge.jsx"], "pattern": "Logo | search | Sell, Wishlist, Cart, Messages, Profile.", "states": "Unread count badges, visible focus."},
    "tables": {"shadcn": ["table.jsx", "tabs.jsx", "pagination.jsx"]},
    "forms": {"shadcn": ["form.jsx", "input.jsx", "select.jsx", "checkbox.jsx", "switch.jsx", "textarea.jsx", "calendar.jsx", "popover.jsx"]},
    "feedback": {"shadcn": ["alert.jsx", "toast.jsx", "sonner.jsx", "progress.jsx"], "usage": "Sonner for toasts."}
  },
  "buttons": {
    "tokens": {"radius": "--btn-radius: 0.625rem", "shadow": "--btn-shadow: 0 6px 20px -8px hsl(var(--brand-primary)/0.45)", "motion": "--btn-motion: 150ms cubic-bezier(.2,.8,.2,1)"},
    "variants": {
      "primary": "bg-[hsl(var(--brand-primary))] text-white hover:bg-[hsl(202_84%_34%)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-primary))]",
      "secondary": "bg-white text-[hsl(var(--brand-ink))] border border-[hsl(var(--brand-border))] hover:bg-[hsl(var(--brand-elevated))]",
      "ghost": "bg-transparent text-[hsl(var(--brand-ink))] hover:bg-[hsl(var(--brand-elevated))]"
    },
    "sizes": {"sm": "h-8 px-3 text-sm", "md": "h-10 px-4", "lg": "h-12 px-6 text-base"},
    "motion": "Use translate-y-[1px] on active; never use transition: all; restrict to colors/shadows."
  },
  "tokens": {
    "css_custom_properties": {
      "spacing": "--space-1:4px;--space-2:8px;--space-3:12px;--space-4:16px;--space-5:20px;--space-6:24px;--space-8:32px;--space-10:40px;--space-12:48px;--space-16:64px;",
      "radius": "--radius-sm:6px;--radius-md:10px;--radius-lg:14px;--radius-xl:18px;",
      "shadows": "--shadow-sm:0 2px 8px hsl(220 3% 15%/0.06);--shadow-md:0 8px 24px hsl(220 3% 15%/0.08);--shadow-lg:0 20px 40px hsl(220 3% 15%/0.10);"
    }
  },
  "motion_and_microinteractions": {
    "principles": ["Purposeful, fast, reversible", "Entrance fade+slide 120ms", "Hover elevate 2–4dp", "Stagger lists"],
    "framer_motion": "Use framer-motion for card hovers, empty-state entrances, chat typing dots.",
    "parallax": "Mild parallax in hero (translateY max 12px).",
    "scroll_reveal": "IntersectionObserver to add 'animate-in' classes; respect prefers-reduced-motion."
  },
  "accessibility": {
    "focus": "Visible focus rings (ring-2 ring-[hsl(var(--brand-primary))]).",
    "keyboard": "All interactive components keyboard navigable.",
    "aria_labels": "Icons and quick actions must have aria-labels.",
    "reduced_motion": "Honor prefers-reduced-motion.",
    "contrast": "AA contrast minimum."
  },
  "dark_mode": {
    "toggle": "Toggle 'dark' on <html>. Persist via localStorage.",
    "surface_rules": "Keep content surfaces dark solid; gradients lighter and decorative only.",
    "elevation": "Use subtle inner borders (border-white/5) to separate stacked cards."
  },
  "libraries_and_installation": {
    "framer_motion": {"install": "npm i framer-motion", "usage": "import { motion } from 'framer-motion'"},
    "recharts": {"install": "npm i recharts", "usage": "Use for seller KPIs: AreaChart, LineChart, BarChart with accessible labels."},
    "lucide_icons": {"install": "npm i lucide-react", "usage": "import { Star, Heart, MessageCircle, ShieldCheck, Moon, Sun } from 'lucide-react'"},
    "sonner_toast": {"path": "./components/ui/sonner.jsx", "usage": "import { Toaster, toast } from './components/ui/sonner'"}
  },
  "example_code": {
    "navbar_with_search_and_darkmode_js": "import React from 'react';\nimport { Command, CommandInput, CommandList, CommandItem } from './components/ui/command';\nimport { Button } from './components/ui/button';\nimport { Badge } from './components/ui/badge';\nimport { Moon, Sun } from 'lucide-react';\n\nexport default function Navbar(){\n  const [dark,setDark]=React.useState(()=>document.documentElement.classList.contains('dark'));\n  const toggle=()=>{\n    const html=document.documentElement;\n    html.classList.toggle('dark');\n    const now=html.classList.contains('dark');\n    setDark(now);\n    localStorage.setItem('theme', now?'dark':'light');\n  };\n  return (\n    <header className=\"border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60\">\n      <div className=\"mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4\">\n        <a href=\"/\" className=\"font-semibold\" data-testid=\"logo-link\">NovoMarket</a>\n        <div className=\"hidden md:flex flex-1\">\n          <Command className=\"w-full border rounded-lg\">\n            <CommandInput placeholder=\"Search products and services\" data-testid=\"global-search-input\" />\n            <CommandList>\n              <CommandItem>Recent search</CommandItem>\n            </CommandList>\n          </Command>\n        </div>\n        <nav className=\"ml-auto flex items-center gap-3\">\n          <Button variant=\"ghost\" className=\"hidden md:inline-flex\" data-testid=\"sell-nav-button\">Sell</Button>\n          <Button variant=\"ghost\" aria-label=\"Toggle theme\" onClick={toggle} data-testid=\"darkmode-toggle-button\">{dark? <Sun size={18}/> : <Moon size={18}/>}\n          </Button>\n          <Badge data-testid=\"cart-count-badge\">2</Badge>\n        </nav>\n      </div>\n    </header>\n  );\n}",
    "product_card_js": "import React from 'react';\nimport { Card, CardHeader, CardContent, CardFooter } from './components/ui/card';\nimport { Button } from './components/ui/button';\nimport { Badge } from './components/ui/badge';\nimport { Tooltip, TooltipTrigger, TooltipContent } from './components/ui/tooltip';\nimport { Heart, ShieldCheck, Star } from 'lucide-react';\n\nexport const ProductCard = ({item}) => {\n  const onWishlist=()=>{/* api */};\n  return (\n    <Card className=\"group rounded-xl overflow-hidden border bg-white dark:bg-neutral-900 hover:shadow-md transition-shadow duration-200\" data-testid=\"product-card\">\n      <div className=\"relative aspect-[4/3] overflow-hidden\">\n        <img src={item.image} alt={item.title} className=\"h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]\" loading=\"lazy\"/>\n        {item.discount && (<Badge className=\"absolute left-2 top-2\">-{item.discount}%</Badge>)}\n        {item.verified && (<ShieldCheck className=\"absolute right-2 top-2 text-emerald-500\" aria-label=\"Verified seller\" />)}\n      </div>\n      <CardHeader className=\"p-3\">\n        <div className=\"text-sm font-medium line-clamp-2\" title={item.title}>{item.title}</div>\n      </CardHeader>\n      <CardContent className=\"px-3 pb-2\">\n        <div className=\"flex items-center justify-between\">\n          <div className=\"text-base font-semibold\">${'{'}item.price{'}'}</div>\n          <div className=\"flex items-center gap-1 text-amber-500\" aria-label=\"rating\">\n            <Star size={14} fill=\"currentColor\"/><span className=\"text-xs text-foreground/70\">{item.rating}</span>\n          </div>\n        </div>\n      </CardContent>\n      <CardFooter className=\"px-3 pb-3 flex items-center gap-2\">\n        <Button size=\"md\" className=\"flex-1\" data-testid=\"add-to-cart-button\">Add to cart</Button>\n        <Tooltip>\n          <TooltipTrigger asChild>\n            <Button variant=\"ghost\" aria-label=\"Add to wishlist\" onClick={onWishlist} data-testid=\"wishlist-icon-button\"><Heart size={18}/></Button>\n          </TooltipTrigger>\n          <TooltipContent>Add to wishlist</TooltipContent>\n        </Tooltip>\n      </CardFooter>\n    </Card>\n  );\n};",
    "filters_sheet_js": "import React from 'react';\nimport { Sheet, SheetTrigger, SheetContent } from './components/ui/sheet';\nimport { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './components/ui/accordion';\nimport { Checkbox } from './components/ui/checkbox';\nimport { Slider } from './components/ui/slider';\nimport { Button } from './components/ui/button';\n\nexport const MobileFilters = ({brands=[], onApply}) => {\n  const [price,setPrice]=React.useState([10,500]);\n  const [checked,setChecked]=React.useState({});\n  return (\n    <Sheet>\n      <SheetTrigger asChild>\n        <Button variant=\"secondary\" data-testid=\"open-filter-button\">Filters</Button>\n      </SheetTrigger>\n      <SheetContent className=\"w-[85vw] sm:w-[420px] overflow-y-auto\">\n        <h3 className=\"text-lg font-semibold mb-4\">Filters</h3>\n        <Accordion type=\"multiple\">\n          <AccordionItem value=\"price\">\n            <AccordionTrigger>Price</AccordionTrigger>\n            <AccordionContent>\n              <div className=\"px-2\">\n                <Slider value={price} onValueChange={setPrice} min={0} max={2000} step={5} data-testid=\"price-range-slider\"/>\n                <div className=\"mt-2 text-sm\">${'{'}price[0]{'}'} - ${'{'}price[1]{'}'}</div>\n              </div>\n            </AccordionContent>\n          </AccordionItem>\n          <AccordionItem value=\"brands\">\n            <AccordionTrigger>Brands</AccordionTrigger>\n            <AccordionContent>\n              <div className=\"space-y-2\">\n                {brands.map(b=> (\n                  <label key={b} className=\"flex items-center gap-2\">\n                    <Checkbox checked={!!checked[b]} onCheckedChange={(v)=>setChecked(s=>({...s,[b]:v}))} data-testid=\"brand-checkbox\"/>\n                    <span className=\"text-sm\">{b}</span>\n                  </label>\n                ))}\n              </div>\n            </AccordionContent>\n          </AccordionItem>\n        </Accordion>\n        <div className=\"mt-6 flex gap-2\">\n          <Button className=\"flex-1\" onClick={()=>onApply({price,checked})} data-testid=\"apply-filters-button\">Apply</Button>\n          <Button variant=\"ghost\" className=\"flex-1\" data-testid=\"clear-filters-button\">Clear</Button>\n        </div>\n      </SheetContent>\n    </Sheet>\n  );\n};",
    "chat_window_js": "import React,{useRef,useEffect,useState} from 'react';\nimport { ScrollArea } from './components/ui/scroll-area';\nimport { Input } from './components/ui/input';\nimport { Button } from './components/ui/button';\nimport { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar';\n\nexport default function ChatWindow({thread}){\n  const [text,setText]=useState('');\n  const endRef=useRef(null);\n  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[thread]);\n  return (\n    <div className=\"flex flex-col h-full border rounded-lg\">\n      <div className=\"px-3 py-2 border-b text-sm\" data-testid=\"chat-header\">Chat with {thread.sellerName}</div>\n      <ScrollArea className=\"flex-1 p-3 space-y-3\" data-testid=\"chat-scroll-area\">\n        {thread.messages.map(m=> (\n          <div key={m.id} className=\"flex gap-2 items-start\">\n            <Avatar className=\"h-6 w-6\"><AvatarImage src={m.avatar}/><AvatarFallback>{m.from[0]}</AvatarFallback></Avatar>\n            <div className=\"rounded-lg px-3 py-2 bg-[hsl(var(--brand-elevated))] dark:bg-neutral-800 max-w-[75%]\">\n              <div className=\"text-xs text-foreground/60\">{m.from}</div>\n              <div className=\"text-sm\">{m.text}</div>\n            </div>\n          </div>\n        ))}\n        <div ref={endRef} />\n      </ScrollArea>\n      <form className=\"p-2 flex gap-2 border-t\" onSubmit={(e)=>{e.preventDefault();/* send */}} data-testid=\"chat-composer\">\n        <Input value={text} onChange={e=>setText(e.target.value)} placeholder=\"Type a message\" data-testid=\"chat-input\"/>\n        <Button type=\"submit\" data-testid=\"chat-send-button\">Send</Button>\n      </form>\n    </div>\n  );\n}",
    "seller_dashboard_recharts_js": "import React from 'react';\nimport { Card, CardHeader, CardContent } from './components/ui/card';\nimport { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';\n\nconst data=[{d:'Mon', s:1200, v:4600},{d:'Tue', s:980, v:5200},{d:'Wed', s:1400, v:6100},{d:'Thu', s:900, v:4300},{d:'Fri', s:1700, v:7200}];\n\nexport default function SellerKpi(){\n  return (\n    <Card className=\"rounded-xl\">\n      <CardHeader className=\"text-sm font-medium\">Sales & Views</CardHeader>\n      <CardContent className=\"h-[260px]\">\n        <ResponsiveContainer width=\"100%\" height=\"100%\">\n          <AreaChart data={data} margin={{left:6,right:6}}>\n            <defs>\n              <linearGradient id=\"p\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">\n                <stop offset=\"5%\" stopColor=\"hsl(202 84% 38%)\" stopOpacity={0.35}/>{/* small gradient area */}\n                <stop offset=\"95%\" stopColor=\"hsl(202 84% 38%)\" stopOpacity={0}/>{/* fade */}\n              </linearGradient>\n            </defs>\n            <CartesianGrid strokeDasharray=\"3 3\" opacity={0.2}/>\n            <XAxis dataKey=\"d\" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip/>\n            <Area type=\"monotone\" dataKey=\"s\" stroke=\"hsl(202 84% 38%)\" fillOpacity={1} fill=\"url(#p)\"/>\n          </AreaChart>\n        </ResponsiveContainer>\n      </CardContent>\n    </Card>\n  );\n}"
  },
  "testing_data_testid_convention": {
    "rule": "All interactive and key informational elements MUST include data-testid using kebab-case describing role.",
    "examples": [
      "global-search-input",
      "add-to-cart-button",
      "wishlist-icon-button",
      "login-form-submit-button",
      "order-status-badge"
    ]
  },
  "flows": {
    "buyer_success": ["Discover via search/filters", "Compare quickly with consistent cards", "Chat for clarifications", "Confident checkout"],
    "seller_success": ["Fast listing form", "Clear analytics & order management", "Responsive chat", "Ratings that build trust"]
  },
  "component_path": [
    "./components/ui/button.jsx",
    "./components/ui/card.jsx",
    "./components/ui/command.jsx",
    "./components/ui/navigation-menu.jsx",
    "./components/ui/sheet.jsx",
    "./components/ui/accordion.jsx",
    "./components/ui/checkbox.jsx",
    "./components/ui/slider.jsx",
    "./components/ui/select.jsx",
    "./components/ui/badge.jsx",
    "./components/ui/tooltip.jsx",
    "./components/ui/carousel.jsx",
    "./components/ui/aspect-ratio.jsx",
    "./components/ui/dialog.jsx",
    "./components/ui/textarea.jsx",
    "./components/ui/radio-group.jsx",
    "./components/ui/form.jsx",
    "./components/ui/scroll-area.jsx",
    "./components/ui/input.jsx",
    "./components/ui/avatar.jsx",
    "./components/ui/separator.jsx",
    "./components/ui/table.jsx",
    "./components/ui/tabs.jsx",
    "./components/ui/pagination.jsx",
    "./components/ui/sonner.jsx"
  ],
  "image_urls": [
    {"url": "https://images.unsplash.com/photo-1745370059301-f72023994de9?crop=entropy&cs=srgb&fm=jpg&q=85", "category": "hero-accent", "description": "Minimal interior lighting scene to add calm, premium mood in hero background card."},
    {"url": "https://images.unsplash.com/photo-1721742124499-442507ae4c62?crop=entropy&cs=srgb&fm=jpg&q=85", "category": "services-banner", "description": "Warm environment image to contextualize home services category."},
    {"url": "https://images.unsplash.com/photo-1640231026037-ffef7d41a14e?crop=entropy&cs=srgb&fm=jpg&q=85", "category": "empty-state", "description": "Clean frame still-life for tasteful empty states or onboarding cards."},
    {"url": "https://images.unsplash.com/photo-1736191550786-46a46aa47394?crop=entropy&cs=srgb&fm=jpg&q=85", "category": "product-placeholder-tech", "description": "Phone mock product shot for electronics category tiles."},
    {"url": "https://images.unsplash.com/photo-1621581667749-6f2e075232cd?crop=entropy&cs=srgb&fm=jpg&q=85", "category": "ui-decoration", "description": "Monochrome detail to break sections subtly without clutter."},
    {"url": "https://images.pexels.com/photos/5554667/pexels-photo-5554667.jpeg", "category": "workspace-bento", "description": "Flat-lay workspace for marketplace education/tutorial tiles."},
    {"url": "https://images.pexels.com/photos/8534244/pexels-photo-8534244.jpeg", "category": "device-showcase", "description": "Device lineup for app promo blocks or seller tools highlights."}
  ],
  "instructions_to_main_agent": [
    "Add Google Fonts link tag to index.html and apply fonts via Tailwind utilities.",
    "Extend /src/index.css with brand CSS variables under :root and .dark (do not replace existing tokens).",
    "Build Navbar using provided navbar code. Integrate Command search with API later.",
    "Implement MobileFilters on listing page; static sidebar on md+ mirrors controls.",
    "Use ProductCard for both products and services (swap schedule CTA for services).",
    "Mount Sonner Toaster at app root; show toasts on wishlist, add-to-cart, message send.",
    "Use Recharts SellerKpi on seller dashboard with accessible tooltips and labels.",
    "Ensure every interactive element has a unique data-testid per convention.",
    "Respect gradient rules: only approved background gradients and never over text-heavy blocks.",
    "Honor prefers-reduced-motion for all motion and disable parallax when set.",
    "Use shadcn components from ./components/ui exclusively for dropdowns, selects, calendars, toasts, etc."
  ],
  "references_and_inspirations": [
    {"title": "Dribbble product cards", "url": "https://dribbble.com/tags/product-card"},
    {"title": "Dribbble search filters", "url": "https://dribbble.com/tags/search-filters"},
    {"title": "Behance marketplace UI", "url": "https://www.behance.net/search/projects/marketplace%20ui?locale=en_US"},
    {"title": "Marketplace UX patterns (Baymard)", "url": "https://baymard.com/ux-benchmark/collections/marketplace"}
  ]
}

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
