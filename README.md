# 🎓 Student Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Obsidian](https://img.shields.io/badge/Obsidian-483699?logo=obsidian&logoColor=white)](https://obsidian.md/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=progressive-web-apps&logoColor=white)](https://web.dev/explore/progressive-web-apps)

A privacy-respecting, zero-database, local-first academic command center built for students. It mounts your local **Obsidian vault** directly in your browser using the modern Chromium **File System Access API**, merging local documents and notes with live university calendars, internship pipelines, and markdown/LaTeX note-taking.

*Local-First. Edge-Deployable. Zero Database Server.*

---

## 📖 Table of Contents
1. [Key Features](#-key-features)
2. [Architecture & Tech Stack](#%EF%B8%8F-architecture--tech-stack)
3. [Vault Directory Structure](#-vault-directory-structure)
4. [Getting Started](#%EF%B8%8F-getting-started)
5. [Deployment](#-deployment)
6. [Privacy & Permissions](#-privacy--permissions)

---

## 🚀 Key Features

* **📂 Local-First Vault Mounting**  
  Mount your local study vault directly in the dashboard. The application reads, scans, and parses files completely client-side. No database is required, keeping your documents and notes private.
* **📅 Unified Timetable & Agenda**  
  Combines your live university calendar feed (proxied via a lightweight Next.js route `/api/calendar` using a custom, high-speed ICS text parser) with your local internship application deadlines and start dates. Bypasses typical past-event filters to keep historical data visible.
* **💼 Internship Pipeline Tracker**  
  A Kanban-style workspace to manage your career search (Queued, Applied, Interviewing, Accepted, Rejected), featuring fields for application dates, durations, and status notes. All information writes back directly to `internships.json` inside your local vault.
* **📜 "Codex Mathematica" PDF Exporter**  
  Compile mathematical notes into printable PDF grimoires. Aggregates note categories, applies beautiful off-white parchment styling, applies customized headers/subtitles using `Oswald` typography via `@react-pdf/renderer`, and outputs a final "Mastery Summary".
* **📱 Hybrid PDF Viewer**  
  Automatically bypasses mobile iframe constraints. On desktop, documents load instantly in native high-speed frames; on touch/mobile platforms, the viewer intercepts the PDF file buffer and performs a canvas-based client-side render using `pdf.js` page-by-page.
* **🧮 Math & LaTeX Rendering**  
  Full support for parsing and rendering mathematical formulas (both inline `$x^2$` and block `$$f(x)$$` equations) using `remark-math` and `rehype-katex`.
* **✨ Progressive Web App (PWA)**  
  Configured with Web App Manifest guidelines and theme color overlays to install as a standalone desktop app, removing browser borders for a native feel.
* **🌗 Dark & Light Themes**  
  Clean high-visibility dark theme paired with an optimized light-mode layout to match your study preferences throughout the day and night.

---

## 🛠️ Architecture & Tech Stack

This project is built around a serverless, database-free model so that it can be hosted globally on edge networks:

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **File System Access**: Browser-native [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) & [IndexedDB Keyval](https://github.com/jakearchibald/idb-keyval)
* **PDF Exporter**: [@react-pdf/renderer](https://react-pdf.org/)
* **PDF Fallback Viewer**: [PDF.js (pdfjs-dist)](https://mozilla.github.io/pdf.js/)
* **Markdown & LaTeX Parser**: [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-math](https://github.com/remarkjs/remark-math) + [rehype-katex](https://github.com/remarkjs/rehype-katex)
* **Icons**: [Lucide React](https://lucide.dev/)

---

## 📁 Vault Directory Structure

To scan and list modules and resources, the app expects your selected Obsidian vault directory to have the following structure:

```text
Obsidian Vault/
├── Modules/
│   └── MTH1001/                        # Your module folder (e.g. course code)
│       ├── Lecture Notes/              # PDFs of lectures
│       ├── Problem Sheets/             # PDFs of sheets
│       ├── Past Papers/                # PDFs of past exams
│       ├── Textbooks/                  # PDF textbooks
│       ├── Analysis.md                 # Markdown note with LaTeX equations
│       └── Algebra.md                  # Markdown note with LaTeX equations
├── internships.json                    # Autogenerated - stores job pipeline info
└── dashboard.json                      # Autogenerated - stores module grouping configurations
```

* **Note Parsing**: The application splits markdown files in the module directory (e.g., `Analysis.md`) by standard separators (`---` or `\n\n---\n\n`) to create individual cards that can be edited, completed, and updated directly from the web app UI.
* **File Types**: Files inside subdirectories (`Lecture Notes`, `Problem Sheets`, etc.) should be PDF files to be loaded into the reader.

---

## ⚙️ Getting Started

### 📋 Prerequisites
* A **Chromium-based browser** (Google Chrome, Microsoft Edge, Brave, Opera, etc.). The File System Access API is not currently supported in Firefox or Safari due to browser-specific security policies.

### 💻 Local Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/SamuelSmthSmth/Student-Dashboard.git
   cd Student-Dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.
5. Click **"Select Obsidian Academics Vault"** to choose your vault folder, authorize permissions when prompted, and start studying!

---

## 🌐 Deployment

Because the backend proxy `/api/calendar` is completely stateless and all other interactions happen client-side, you can host the dashboard on any modern hosting platform (such as **Vercel**):

1. Commit your codebase and push to GitHub.
2. Connect your repository to Vercel.
3. Deploy with standard Next.js default settings.
4. Your application runs serverless; vault permission requests and file modifications remain local to each device.

---

## 🔒 Privacy & Permissions

* **Zero Remote Syncing**: No text, document, file name, or internship data is ever transmitted to a database. All file operations (read/write/delete) are performed locally on your physical disk by the browser engine.
* **Access Permissions**: Your browser will ask for read and write permissions when mounting your vault. This is required for listing folders and modifying files (e.g. updating internship cards or compiling notes).
* **Handle Persistence**: The directory handle token is securely stored in IndexedDB via `idb-keyval` so you do not need to reselect the directory picker on page refresh or browser restart.
