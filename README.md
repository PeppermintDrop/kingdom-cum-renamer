KINGDOM.CUM Renamer 👑
A Visual Batch Organizer for local adult video collections using ThePornDB API.
I built this tool because I got tired of "black-box" automated scripts renaming my rare files incorrectly. 
I wanted a way to visually verify matches before any changes are made to my local file system.
Note on Design: I am not a professional developer. 
I tend to get lost in the UI/CSS details (neon glows, glassmorphism) rather than perfecting the most efficient backend logic. 
But it works, it's secure, and it's built for people who like to stay organized.

✨ Features
Visual Split-View: Preview your local video on the left and see metadata search results on the right.
Visual Verification: Matches are only applied once you confirm them.
Privacy First: Runs entirely locally. Your API token stays on your machine.
TPDB Integration: Uses the official ThePornDB API for high-quality metadata.

🔧 Technical Architecture & Security
The app is built with Electron, React, TypeScript, and Vite. 
It follows the strict Electron security model:
Context Isolation: The Main process (Node.js) and Renderer process (UI) are strictly separated.
Safe IPC Bridge: Communication happens via a secure preload bridge to prevent unauthorized system access.
Native Networking: API calls are proxied through Electron's native net module in the backend to bypass CORS issues typical for local file protocols.

🛠️ Troubleshooting & Dev Notes
During development, I solved several specific technical hurdles that might be useful for others:
Video Player Buffer Issue: To ensure the HTML5 video player correctly clears its buffer and reloads when switching between files, I implemented a key-prop strategy (key={selectedFile.path}) to force React to remount the DOM node every time a new file is selected.
Atomic Renaming: The renaming logic checks paths and creates subfolders recursively (fs.promises.mkdir) before moving files to prevent data loss.

🚀 Installation for Developers
If you want to build the project from source:
Clone the repo: git clone https://github.com/PeppermintDrop/kingdom-cum-renamer.git
Install dependencies: npm install
Run in dev mode: npm run dev
Build the app: npm run build

❤️ Pricing & "Robin Hood" Philosophy
This tool is Pay What You Want on Gumroad.
If you are a student, struggling financially, or just tight on cash: Please enter $0. Do not give me your money. Use it to buy a beer for a friend or invest it in your family.
Only contribute if you have disposable income and want to support my late-night coding and design sessions.

📜 License & Open Source
The source code is provided for transparency. 
The project utilizes several open-source libraries under various licenses:
MIT: 68 dependencies
ISC: 7 dependencies
BSD: 5 dependencies
Apache 2.0 / 0BSD: 2 dependencies
