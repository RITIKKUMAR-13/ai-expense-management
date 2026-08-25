# MedoraCare — Hospital Portal Login Direction

## चुना गया design direction: Clinical Editorial Protocol

### Design Movement

यह direction **Clinical Editorial Systems** से प्रेरित है: hospital access को generic SaaS login की तरह नहीं, बल्कि a clear pre-shift briefing sheet की तरह present करना। The interface uses an asymmetric “care protocol” composition, numbered access steps, a system-status pulse, and large editorial typography so busy teams feel focused before their shift begins.

### Core Principles

1. **Protocol, not portal:** The interface should feel like a concise access briefing, using numbered sections and purposeful prompts.
2. **Role first:** Receptionist और Hospital Manager को distinctive operating contexts के साथ immediate selection मिलना चाहिए।
3. **Clinical calm:** Cool navy, clean white surfaces और measured spacing pressure को कम करें तथा clarity बढ़ाएँ।
4. **Fast access:** Login flow short, keyboard-friendly और mobile पर easily usable रहे।

### Color Philosophy

Deep hospital navy (`#102D3B`) is the structural anchor. A warmer clinical paper (`#F5F6F0`) makes the main access sheet feel considered rather than default-white. Glass teal (`#5FD0C0`) is reserved for the active care path and system status, while restrained coral only signals attention. Dark mode uses layered blue-charcoal surfaces and low-luminance teal to reduce glare on long shifts.

### Layout Paradigm

Desktop पर a wide **care-signal canvas** and a narrower **access sheet** sit side-by-side, separated by an inset spine rather than a generic two-column split. The care-signal canvas introduces the live access protocol, while the sheet has three numbered stages: identify role, authenticate, and enter workspace. Mobile पर the briefing condenses into a short protocol banner and the sheet becomes a single-column sequence.

### Signature Elements

1. **Pulse orbit:** A CSS-only circular care path and single pulse dot act as the brand’s spatial anchor.
2. **Protocol numerals:** Oversized 01/02/03 markers make the access flow feel authored and fast to scan.
3. **Care status rail:** Short, precise operational-status statements establish context without looking like dashboard clutter.

### Interaction Philosophy

Users can switch their role, reveal or conceal a password, submit login validation, request a password reset, and switch light/dark mode. Selected roles alter the access-context note. Dark mode is retained during the active browser session.

### Typography System

**Manrope** carries the editorial display moments and product wordmark. **DM Sans** supports labels, access details and operational descriptions. Numerals are compact, oversized and deliberately spaced, while form labels remain concise uppercase microcopy.

### Brand Essence

**MedoraCare is a focused hospital access portal for front-desk and operational leaders who need secure clarity at the beginning of every shift.**

Personality adjectives: **calm, dependable, precise**.
