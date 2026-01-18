# 🛠️ TrueVail Deployment Troubleshooting

If you are seeing "No Response" or "API Error" on your live site, follow this checklist.

## 🚨 1. Check Render Backend (Most Critical)

The #1 reason for "No Response" is the Python server crashing on start.

1.  Go to your [Render Dashboard](https://dashboard.render.com/).
2.  Click on your **TrueVail Backend** service.
3.  Click **Logs** (left sidebar).
4.  **Wait for the logs to load** and look for errors:
    *   ❌ `ModuleNotFoundError` → Missing dependency in `requirements.txt`.
    *   ❌ `SyntaxError` → Code typo (e.g., duplicated functions).
    *   ❌ `KeyError: GEMINI_API_KEY` → You forgot to add Environment Variables in Render.
    *   ✅ `Listening at: http://0.0.0.0:10000` → Means backend is **HEALTHY**.

**Verification:**
Open your Backend URL in a new browser tab:
`https://truevail-ff2a.onrender.com/`
*   **Result:** You MUST see `{"message":"Backend is running","status":"ok"}`.
*   If you see "502 Bad Gateway" or "Site can't be reached", **your backend is dead**. Check logs.

---

## 🌐 2. Check Vercel Frontend

If the backend is healthy (Step 1 passed), check the frontend.

1.  Go to your Vercel Project > **Settings** > **Environment Variables**.
2.  Ensure `NEXT_PUBLIC_BACKEND_URL` is exactly:
    `https://truevail-ff2a.onrender.com`
    *(No trailing slash `/` at the end)*
3.  **Redeploy:** If you changed the variable, go to **Deployments** and click "Redeploy".

---

## 🔑 3. API Key Check

*   **NewsAPI:**
    *   On **Render**, the Free Tier of NewsAPI is BLOCKED.
    *   **Solution:** We added a fallback to Google News. Check Render logs for `"⚠️ Switching to Google News RSS Fallback..."`. This confirms it's working.
*   **Gemini API:**
    *   Ensure `GEMINI_API_KEY` is added in Render Environment Variables.

---

## 🩺 Quick Diagnostic (Console)

1.  Open your Vercel website.
2.  Right-click anywhere > **Inspect** > **Network** tab.
3.  Click the "Analyze" button on your dashboard.
4.  Look for the red request (e.g., `analyze` or `trending`).
5.  Click it and look at the **Response** tab.
    *   It will tell you EXACTLY why it failed (e.g., "Internal Server Error", "CORS policy", "404").

---

### Still stuck?
Copy the **latest error lines** from your **Render Logs** and paste them here. I will fix it instantly.
