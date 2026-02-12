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

Some technical stuff (Troubleshooting):
Video Player: Had a massive headache with the HTML5 player not clearing the buffer when switching files. Fixed it by using key={selectedFile.path} to force React to remount the player node every time.
API/CORS: To avoid CORS hell with local file protocols, I'm proxying all TPDB requests through Electron's native net module in the main process.

How to run it:
If you want to build it yourself:
npm install
npm run dev (for dev mode)
npm run build (to compile the .exe)

Pricing (Robin Hood Policy):
This is Pay What You Want on Gumroad. 
If you are broke, a student, or struggling: Enter $0. Seriously. Buy a beer for a friend or spend it on your family. 
Only tip me if you have some spare cash and want to support my late-night tinkering.
