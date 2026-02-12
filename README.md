# KINGDOM.CUM Renamer

Visual Batch Organizer for local collections using ThePornDB API.

![Renamer1](https://github.com/user-attachments/assets/c7d6a426-56b5-4d66-97ff-454635d2a1d0)
![Renamer2](https://github.com/user-attachments/assets/bd7f5e8b-47e0-4f00-86a9-cde282724e35)

I developed this tool to solve the problem of "black-box" automated scripts that rename files without user oversight. This application provides a side-by-side view to visually verify every metadata match before any changes are made to the local file system.

> **Note on Development:** I am primarily a designer. I focus heavily on UI/CSS details like glassmorphism and neon aesthetics. While the code is secure and functional, it is built from a "design-first" perspective rather than pure backend optimization.

---

### Features
- **Visual Split-View:** Video preview on the left, API search results on the right.
- **Manual Confirmation:** No automatic renaming; every change requires user approval.
- **Privacy:** All operations are local. Your API token is stored only on your machine.
- **Multilingual Support:** Interface available in EN, DE, FR, ES, and JP.

---

### Developer Notes & Transparency
This project was built using Electron, React, TypeScript, and Vite. I used AI assistance for specific technical hurdles and localization:

- **Localization:** AI was used to translate the UI into five languages and handle the implementation logic.
- **Video Player Reset:** Solved a buffer clearing issue in the HTML5 player by using a `key={selectedFile.path}` strategy to force a DOM remount.
- **API Proxying:** Implemented a native proxy via Electron’s `net` module to bypass CORS restrictions for local file protocols.

---

### Pricing (Robin Hood Policy)
This software is **Pay What You Want** on Gumroad.

> **Important:** If you are a student or facing financial difficulties, please enter **$0**. 
Use that money for your family or buy a beer for a friend. 
Only contribute if you have disposable income and wish to support my design and development sessions.

---
### How to run
```bash
npm install
npm run dev
npm run build

