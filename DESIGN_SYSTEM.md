# FlowBoard Design System

This document describes the look and feel of FlowBoard as designed in Figma, in plain language. It was read from the Figma file "FlowBoard Designs (Copy)" (five screens: Log-in Form, Homepage, Create Project Board, Create Card Modal, and Card Created Homepage).

**How to read it:** sizes are in pixels, colors are given as hex codes so a designer or developer can match them exactly, and "muted" means the soft gray used for secondary text.

**What this document covers and doesn't:** it only describes what is actually drawn in the Figma file. Anything the file doesn't show (hover states, error states, dark mode, mobile layouts, priority colors) is listed at the end under "Not in the design" rather than guessed.

---

## 1. The overall feel

Clean, calm and spacious. Mostly white and very light gray surfaces, thin faint borders instead of heavy outlines, generously rounded corners, and one confident blue for the main actions. The typeface is Inter throughout, in just two weights, so the interface feels consistent and quiet.

---

## 2. Colors

### Brand and action colors
| Role | Color | Where it's used |
| --- | --- | --- |
| Primary blue | #0369a1 | The logo tile, the main buttons ("Save", "Sign in"), and text links such as "Forgot password?" |
| Purple | #8a38f5 | The "New Board" button on the dashboard only |
| Indigo | #6366f1 | The round user avatar in the top bar |
| Danger red | #d4183d | Destructive text, such as "Delete card" |

Note: the purple "New Board" button is the only purple in the design, while every other main button is blue. It's worth deciding whether that's intentional or should become blue.

### Neutrals
| Role | Color | Where it's used |
| --- | --- | --- |
| Main text | #0a0a0a | Titles, labels, card text, button text on light backgrounds (a very dark near-black) |
| Muted text | #717182 | Placeholders, secondary text, dates, column counts, "Add card", inactive tabs |
| Page background | #f9fafb | The dashboard page behind everything |
| Column and tab-track gray | #f3f4f6 | Board columns and the track behind the sign-in tabs |
| Surface white | #ffffff | Cards, modals, inputs, the top bar, empty-column drop zone, count badges |
| Border | Black at 10% strength | Every outline: inputs, cards, the top bar's bottom edge, dividers |
| Modal backdrop | Black at 50% strength | The dimmed layer behind pop-up windows |

### Interaction color
| State | Look |
| --- | --- |
| Input in focus | The field fills with a pale indigo (#e0e7ff) and its outline disappears. Unfocused inputs are white with the faint border. |

---

## 3. Typography

**Typeface:** Inter, in two weights only: Regular and Medium. There is no bold.

| Style | Size | Line height | Weight | Used for |
| --- | --- | --- | --- | --- |
| Page title | 24 | 32 (36 in the board header) | Medium | "My Boards" and the board name |
| Section / modal title | 18 | 28 | Medium | Pop-up titles such as "Create board" and "Card"; board titles on dashboard tiles |
| Body and buttons | 16 | 24 | Regular, or Medium for buttons | Top bar text, input text, button labels, "Sign out" |
| Small text | 14 | 20 | Regular, or Medium for labels and column titles | Field labels, column titles, card text, dates, helper links, "Add card" |
| Tiny label | 12 | 16 | Medium, in capital letters with slightly wider letter spacing | Secondary field labels: DESCRIPTION, PRIORITY, DUE DATE |
| Tiny text | 12 | 16 | Regular | The number badge on each column, the avatar initial |

Letter spacing: body and small text are set very slightly tight, page titles very slightly open, and the tiny capital labels noticeably open. Match these when building, since they give the type its polished look.

---

## 4. Spacing, sizing and shape

### The spacing rhythm
Spacing follows a 4-pixel grid. The values the design actually uses are 4, 8, 12, 16, 24 and 32.

- **8** between a label and its input, and between an icon and its text.
- **12** between side-by-side buttons, and inside input fields (left and right).
- **16** between columns, between cards in a grid, between form fields, and inside a column.
- **24** inside pop-ups, between a pop-up's title and its form, and in the top bar's side margins.
- **32** around the board area's edges, and between the page title row and content.

### Corner roundness
| Where | Roundness |
| --- | --- |
| Buttons, inputs, cards, columns, tiles, the logo tile | 10 |
| Pop-ups and the sign-in panel | 16 |
| Selected tab in the sign-in switcher | 8 |
| Count badges and the avatar | Fully round |

### Heights and widths
- **Top bar:** 65 tall, white, with a faint line underneath. A second, slimmer bar (69 tall) sits under it on the board screen and holds the breadcrumb.
- **Buttons:** 44 tall, 16 of padding on each side.
- **Text inputs:** about 46 tall; the description box is taller (about 80).
- **Dashboard content:** centered in a column up to 1280 wide.
- **Pop-up widths:** 512 for the card pop-up, 448 for create-board and sign-in.
- **Board columns:** about 320 wide each, 16 apart.

### Depth (shadows)
| Where | Shadow |
| --- | --- |
| Card pop-up | Large, soft, low-contrast |
| Sign-in panel | Medium, soft |
| Selected sign-in tab | Very small |
| Everything else (cards, columns, tiles) | None. Faint borders do the work instead. |

---

## 5. Component patterns

### 5.1 Top bar
White, 65 tall, thin faint line below, 24 of side padding.
- **Left:** a 32-pixel rounded blue tile with a white board icon, then the word "FlowBoard", then a "Boards" link. All in 16 text.
- **Right:** a small round indigo avatar (24) holding the user's initial in white, then "Sign out" in medium weight.

### 5.2 Board header (breadcrumb bar)
Sits under the top bar on the board screen. Muted "Boards", a slash, then the board name as a 24 page title, then a small muted "3 columns" count beside it. Side padding is 32.

### 5.3 Column
The heart of the app.
- **Container:** light gray (#f3f4f6), 10 roundness, 16 padding all around, 16 between its parts. About 320 wide.
- **Header row:** the column name on the left (14, Medium, dark), and a count badge on the right: a small white pill with the number in muted 12 text.
- **Card list:** cards stack from the top.
- **"Add card" button:** at the bottom, muted, with a small plus icon (16) and the words "Add card" (14, Medium). It's a quiet text-style button with no box.
- **Columns shown in the design:** To Do, In Progress, Done.
- **Empty column:** the card area becomes a white box with a 2-pixel dashed faint border, 10 roundness, a 24 upload-style icon centered above the muted line "Drop a card here or add one below" (14, centered), with generous padding (34) around.

### 5.4 Card (task card)
- White, 1-pixel faint border, 10 roundness, no shadow.
- About 46 tall with 13 of padding.
- Contains only the card's title in 14 regular, dark text.
- The design does not show any extra details on the card itself (no priority badge, assignee or due date).

### 5.5 Card pop-up (add / edit)
A 512-wide white panel with 16 roundness and a large soft shadow, centered over a 50% black backdrop. Padding is 24 with 24 between sections.
- **Header:** the title "Card" (18, Medium) on the left and a small close "X" icon (20) on the right.
- **Fields, top to bottom:**
  1. **Name:** a 14 Medium label above a text input. Placeholder "Enter card name…".
  2. **Description:** a tiny capital label above a multi-line box. Placeholder "Add a description…".
  3. **Priority and Due Date:** two equal-width fields side by side (each about 224 wide) with a 16 gap. Priority is a dropdown, Due Date is a date picker. Both use the tiny capital labels.
- **Footer:** separated from the form by a faint line.
  - **Left:** "Delete card" as red text, no button box.
  - **Right:** "Cancel" as plain dark text, and "Save" as a filled blue button (44 tall, white text). 12 between them.

### 5.6 Create-board pop-up
Same style as the card pop-up but narrower (448): title "Create board", one labeled input ("Board name", placeholder "e.g. Product Roadmap"), then Cancel and Create buttons aligned right.

### 5.7 Dashboard ("My Boards")
Page background #f9fafb. A title row with "My Boards" (24) on the left and a "New Board" button on the right (purple, 44 tall, a plus icon, white 16 text). Below it, board tiles in a row: white, faint border, 10 roundness, about 308 × 105, with the board name (18, Medium) above its creation date (14, muted).

### 5.8 Sign-in panel
A 448-wide white panel, 16 roundness, medium shadow, 32 padding.
- **Tab switcher at the top:** a light gray track (44 tall, 10 roundness) holding three options: Password, Magic link, Sign up. The active tab is a white raised pill with dark text; inactive tabs are muted text on the gray.
- **Fields:** "Email Address" and "Password", each a 14 label over an input. The focused input is pale indigo.
- **Helper link:** "Forgot password?" in blue, right-aligned.
- **Action:** a full-width blue "Sign in" button.
- **Above the panel:** the blue logo tile, the "FlowBoard" name, and the line "Sign in to manage your boards".

---

## 6. Not in the design

These aren't drawn in the Figma file, so this document makes no claims about them:
- Hover, pressed and disabled looks for buttons and cards.
- Error and success messages for forms.
- Priority colors, assignee display, and due-date styling on cards. The design's card shows a title only.
- An "In Review" column (the design has three columns).
- Dark mode, small-screen layouts, and keyboard focus rings.
- The icon set beyond the few icons in the screens (plus, close, upload, board).

---

## 7. How the current app differs from the design

This is for planning only. Nothing in the app has been changed.

| Area | Design | Current app |
| --- | --- | --- |
| Typeface | Inter | The system's default font |
| Main blue | #0369a1 | A brighter blue (#2563eb) |
| Text and muted colors | #0a0a0a and #717182 | #111827 and grays of a slightly different tone |
| Page and column background | #f9fafb page, #f3f4f6 columns | #f3f4f6 page, a darker gray for columns |
| Corner roundness | 10 for most things, 16 for pop-ups | 6 for buttons and inputs, 10 for columns |
| Button and input height | 44 / 46 | Noticeably shorter |
| Columns | To Do, In Progress, Done | Backlog, In Progress, In Review, Done |
| Card contents | Title only | Title, priority badge, assignee, due date, Edit, Move and Delete controls |
| Card pop-up fields | Name, Description, Priority, Due Date | Title, Assignee, Priority, Due date (no Description) |
| Empty column | Dashed box with an upload icon and "Drop a card here or add one below" | A dashed box with "Drop cards here" |
| Adding a card | An "Add card" button at the bottom of each column | One "+ Add card" button in the top bar |
| Boards | Many boards per user ("My Boards" dashboard, Create board) | One board per user |
| Sign-in | Tabs for Password, Magic link and Sign up, plus "Forgot password?" | A single form with a link to switch between Log in and Create account |
| Top bar | Logo tile, "Boards" link, avatar with initial and "Sign out" | Title, search and filters, theme toggle, Add card, Log out |
| Extras not in design | None | Search and filters, dark mode, Undo toast, card limit |
| Description field | Yes | Not yet |

A sensible order if you want the app to match: first the foundations (Inter, the exact colors, 10-pixel roundness, 44-pixel controls), then the column and empty-state look, then the card pop-up (add Description), and only after that the bigger structural changes (multiple boards, magic-link and password-reset sign-in, per-column "Add card").
