# UnoWeb

Universal web-based development platform for embedded systems (Arduino, ESP32, STM32, RP2040, and beyond). Not an Arduino-only IDE — the architecture is platform-agnostic from day one.

## Status

- Phase 1: Architecture, shared types — DONE
- Phase 2: Authentication (Google + GitHub via Supabase Auth) — DONE (code), needs OAuth provider credentials configured in Supabase dashboard
- Phase 3: Project System (cloud persistence, autosave, version recovery, crash recovery) — DONE
- Phase 4+: Code editor, Board/Toolchain Manager, Build System, Device/USB, Serial, Git, Debugger, CI/CD, Collaboration — NOT YET IMPLEMENTED

## Setup

1. `cd frontend && npm install`
2. Copy `.env.example` to `.env`, fill in your Supabase project URL and anon key
3. In Supabase Dashboard -> Authentication -> Providers, enable Google and GitHub, and set their Client ID/Secret
4. `npm run dev`

## Database

Schema lives in `supabase/migrations/`. Tables: `profiles`, `projects`, `project_members`, `project_files`, `project_versions`. Row Level Security is enabled on every table, scoped by project membership and role (owner/editor/viewer).
