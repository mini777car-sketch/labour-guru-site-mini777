# Labour Guru — online marketplace starter

A mobile-friendly Next.js starter for Labour Guru, serving Mavelikara, Kerala. It includes a customer booking request form, worker application form, Firebase phone OTP sign-in, and Firestore persistence with baseline security rules.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and fill in the Firebase **web app** configuration values. These are client configuration values, not service-account secrets.
3. In Firebase Console, create a project and web app, enable **Authentication → Phone**, and create a **Cloud Firestore** database.
4. Add `localhost` and your deployed domain to Firebase Authentication's authorized domains. For phone auth, configure the reCAPTCHA flow and any required SMS regions/billing settings in Firebase.
5. Deploy the rules in `firestore.rules` using Firebase CLI (`firebase deploy --only firestore:rules`). Review them before launch.
6. Run `npm install` then `npm run dev`, and open http://localhost:3000.

## Deploy

Deploy the Next.js app to Vercel or another Node-compatible host. Add the same `NEXT_PUBLIC_FIREBASE_*` values in the host's environment settings. Deploy Firestore rules separately with Firebase CLI. Do not commit `.env.local`, Firebase service-account JSON, payment gateway secrets, or private credentials.

## Current scope and important limitations

- Phone OTP auth is wired to Firebase; the Firebase project and SMS configuration are yours to create and maintain.
- Booking requests and worker applications are stored in Firestore. They are requests, not confirmed assignments.
- Worker applications remain pending. Admin review/status changes require a trusted admin workflow; do not grant admin access by setting a client-side field. Rules require a Firebase Auth custom claim named `admin` for privileged access.
- No payment is collected or processed. UPI is a preference only. Before enabling payments, implement a provider integration with server-side signature/webhook verification, refunds and ledger handling.
- No public worker directory, worker assignment/acceptance, booking status transitions, GPS tracking, review eligibility enforcement, refund operations, or admin UI is implemented yet.
- Configure Firebase App Check, abuse controls, backups, monitoring, privacy notices, support, and legal review before public launch. Do not collect identity documents or sensitive payment data in this starter.

## Firestore data

`bookings` and `workerApplications` are scoped to the signed-in user for reads and submissions. Administrative access is limited in rules to Firebase Auth tokens with the trusted `admin: true` custom claim. Set that claim only from a protected server environment using the Firebase Admin SDK.
