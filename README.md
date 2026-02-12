KINGDOM.CUM Renamer
Visual Batch Organizer for local collections using ThePornDB API.

I built this because I hate automated scripts that just rename files in the background without me seeing what's happening. 
I wanted a split-view where I can see the video on one side and the API results on the other before clicking "Confirm".

Note: I'm not a pro dev. 
I spend way too much time on CSS (neon glows, glassmorphism) and not enough on "perfect" code. 
It works for me, it's secure, and it's free.

Quick Features:
Visual Split-View: Video preview vs. Metadata results.
No auto-renaming: You verify every match manually.
Local only: Your API key stays on your PC.

Built with Electron, React, Vite.

Dev Notes & Transparency
I am primarily a designer and "vibe-coder." I built the core logic and the UI myself, but I used AI assistance to handle the heavy lifting for the following parts:
Multilingual Support: The UI is available in EN, DE, FR, ES, and JP. AI was used to ensure accurate translations and localization across the entire interface.
Troubleshooting (Electron/React): I hit a wall with the HTML5 video player not clearing its buffer when switching files. The solution — using a key={selectedFile.path} to force React to remount the player — was developed with AI support.

API Proxying: To bypass CORS issues with local file protocols, I implemented a proxy for TPDB requests using Electron's native net module in the main process, guided by AI best practices.

How to run it
npm install
npm run dev
npm run build (to package the app)

Pricing (Robin Hood Policy):
This is Pay What You Want on Gumroad. 
If you are broke, a student, or struggling: Enter $0. Seriously. Buy a beer for a friend or spend it on your family. 
Only tip me if you have some spare cash and want to support my late-night tinkering.
