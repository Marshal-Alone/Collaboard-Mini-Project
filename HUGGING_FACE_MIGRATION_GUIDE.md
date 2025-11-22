# Hugging Face Spaces Migration Guide (The "One-Shot" Protocol)

Use this guide to instruct the AI (me) to convert any Render/Vercel/Heroku project to Hugging Face Spaces in a single attempt.

## 1. What You Need to Provide (The Input Data)

Before asking me to migrate, gather these 3 things:

1.  **Project Root Path**: Where is the code located?
2.  **Environment Variables**: List all keys (e.g., `MONGODB_URI`, `JWT_SECRET`). *You don't need to give me the actual secrets, just the keys so I can set up the code to read them.*
3.  **Port Number**: What port does your backend listen on? (e.g., `5050`, `3000`).

---

## 2. The "Golden Prompt"

Copy and paste this prompt to me. It contains all the instructions I need to avoid the errors we faced today (CORS, hardcoded URLs, missing config).

```markdown
I want to deploy this existing web application to **Hugging Face Spaces** using **Docker**. 

**Project Details:**
- **Location:** [INSERT PATH TO PROJECT]
- **Stack:** [e.g., Node.js + Express + Socket.io + Vanilla JS Frontend]
- **Port:** [INSERT PORT, e.g., 5050]
- **Env Vars Required:** [LIST KEYS, e.g., MONGODB_URI, JWT_SECRET]

**Please execute the following "One-Shot" Migration Plan:**

1.  **Dockerize**:
    - Create a `Dockerfile` (Node 18-alpine recommended).
    - Create a `.dockerignore` (exclude node_modules, .git, .env).
    - Ensure the Dockerfile exposes the correct port and runs the start command.

2.  **Hugging Face Configuration**:
    - Create a `README.md` in the root with the required YAML frontmatter:
      ```yaml
      ---
      title: [App Name]
      emoji: 🚀
      colorFrom: blue
      colorTo: purple
      sdk: docker
      app_port: [YOUR_PORT]
      pinned: false
      ---
      ```

3.  **CRITICAL: Sanitize Hardcoded URLs (The "Render Killer")**:
    - **Scan the entire `frontend` folder** (JS, HTML files).
    - Identify ANY hardcoded URLs like `http://localhost:5050` or `https://*.onrender.com`.
    - **Replace them ALL** with dynamic origin detection:
      ```javascript
      const API_URL = window.location.hostname === 'localhost' 
          ? 'http://localhost:[YOUR_PORT]' 
          : window.location.origin;
      ```
    - This is vital for CORS and WebSockets to work on Hugging Face.

4.  **Backend CORS Update**:
    - Ensure the backend `cors` configuration allows the Hugging Face domain (or just set origin to `*` for the demo).

5.  **Final Output**:
    - Tell me exactly which files to upload to the Hugging Face "Files" tab.
```

---

## 3. Why This Works (The "Memory")

This prompt addresses the specific failure points we discovered:

*   **The "Missing Configuration" Error**: Solved by step 2 (creating the YAML `README.md`).
*   **The "CORS / Connection Refused" Error**: Solved by step 3. The app failed previously because it was hardcoded to look for `onrender.com`. By forcing a scan and replace of these URLs *before* deployment, we ensure the app talks to itself on the new Hugging Face URL (`hf.space`).
*   **The "Build Failed" Error**: Solved by step 1 (proper Docker setup).
