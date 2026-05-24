
# TechXera Campus Portal

A modern, high-performance campus management ecosystem designed for TechXera students and administrators.

## Deployment to GitHub

To push this project to your repository, run the following commands in your terminal:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/mmywebsitescom-byte/TECHXERAEDUCATION.git
git push -u origin main
```

## Deployment to Vercel

1. Push your code to your GitHub repository.
2. Connect the repository to Vercel.
3. In the Vercel project settings, add the following Environment Variables under **Settings → Environment Variables**:
   - `GEMINI_API_KEY`: `AIzaSyB3pajL682m1oUDcA3d-yYwQMYYRLG1bdw`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: (Your Project ID)
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: (Your App ID)
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: (Your Firebase API Key)
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: (Your Auth Domain)
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: (Your Sender ID)
   - `EMAIL_USER`: `rraghabbarik@gmail.com` (or your sending Gmail address)
   - `EMAIL_PASS`: `qwxbpvcmewdujzty` (or your 16-character Gmail App Password)
   - `EMAIL_FROM_NAME`: `TechXera Campus`
4. Deploy!

## Deployment to Firebase App Hosting / Google Cloud

If you are using Firebase App Hosting, environment variables must be configured either via the Firebase Console or by using Cloud Secret Manager.

### Option A: Firebase Console (Recommended for non-sensitive configurations)
1. Go to your **Firebase Console** and select your project.
2. Navigate to **App Hosting** and select your dashboard/backend.
3. Go to settings/environment variables.
4. Add `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM_NAME` with their respective values.

### Option B: Cloud Secret Manager (Best practice for sensitive keys)
Since `EMAIL_PASS` is sensitive:
1. Store `EMAIL_USER` and `EMAIL_PASS` in **Google Cloud Secret Manager** under your project as secrets (e.g. `email-user` and `email-pass`).
2. Add a `secrets` block to your `apphosting.yaml` to expose them:
   ```yaml
   secrets:
     - variableName: EMAIL_USER
       secret: email-user
     - variableName: EMAIL_PASS
       secret: email-pass
   ```


## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Architecture**: Tailwind CSS + ShadCN UI
- **Animations**: GSAP + Framer Motion
- **Database/Auth**: Firebase Firestore & Firebase Auth
- **AI Core**: Genkit with Gemini 2.5 Flash
