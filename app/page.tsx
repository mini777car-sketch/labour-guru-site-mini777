"use client";

import { FormEvent, useEffect, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, signOut, type ConfirmationResult, type User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db, firebaseReady } from "@/lib/firebase";

const CATEGORIES = ["Helper", "Mason", "Painter", "Plumber", "Electrician", "Carpenter", "Tile Worker", "Cleaner"];

type Notice = { kind: "ok" | "error"; text: string } | null;

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"booking" | "worker">("booking");

  useEffect(() => {
    if (!auth) return;
    return auth.onAuthStateChanged(setUser);
  }, []);

  async function sendOtp(event: FormEvent) {
    event.preventDefault();
    if (!auth) return setNotice({ kind: "error", text: "Add Firebase configuration before using OTP sign-in." });
    setBusy(true);
    try {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      const result = await signInWithPhoneNumber(auth, phone.trim(), verifier);
      setConfirmation(result);
      setNotice({ kind: "ok", text: "Verification code sent. Enter the SMS code below." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Could not send verification code." });
    } finally { setBusy(false); }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    if (!confirmation) return;
    setBusy(true);
    try {
      await confirmation.confirm(code.trim());
      setConfirmation(null);
      setCode("");
      setNotice({ kind: "ok", text: "Phone verified. You can now submit a request." });
    } catch {
      setNotice({ kind: "error", text: "That code was not accepted. Check it and try again." });
    } finally { setBusy(false); }
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !db) return setNotice({ kind: "error", text: "Sign in with phone OTP first." });
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) return setNotice({ kind: "error", text: "Enter a valid positive estimate." });
    setBusy(true);
    try {
      const ref = await addDoc(collection(db, "bookings"), {
        customerUid: user.uid,
        category: String(form.get("category")),
        bookingType: String(form.get("bookingType")),
        date: String(form.get("date")),
        address: String(form.get("address")).trim(),
        amount,
        paymentChoice: String(form.get("paymentChoice")),
        details: String(form.get("details")).trim(),
        status: "requested",
        createdAt: serverTimestamp()
      });
      event.currentTarget.reset();
      setNotice({ kind: "ok", text: `Request ${ref.id} saved. No payment has been collected.` });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Could not save your booking." });
    } finally { setBusy(false); }
  }

  async function submitWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !db) return setNotice({ kind: "error", text: "Sign in with phone OTP first." });
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const ref = await addDoc(collection(db, "workerApplications"), {
        uid: user.uid,
        name: String(form.get("name")).trim(),
        phone: user.phoneNumber ?? "",
        category: String(form.get("category")),
        rate: Number(form.get("rate")),
        experience: Number(form.get("experience")),
        area: String(form.get("area")).trim(),
        status: "pending",
        createdAt: serverTimestamp()
      });
      event.currentTarget.reset();
      setNotice({ kind: "ok", text: `Application ${ref.id} submitted for admin review.` });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Could not submit your application." });
    } finally { setBusy(false); }
  }

  return <main className="shell">
    <header className="topbar"><a className="brand" href="#home"><span className="brand-mark">LG</span><span>Labour Guru<small>Mavelikara, Kerala</small></span></a><span className="live-badge"><i /> Online booking</span></header>
    <section className="hero" id="home"><div className="hero-copy"><span className="eyebrow">LOCAL WORK. TRUSTED CONNECTIONS.</span><h1>Get the right help<br /><em>for the work ahead.</em></h1><p>Request skilled and reliable labour for your home or project in Mavelikara and nearby areas.</p><a className="button primary" href="#services">Request a worker <span>↗</span></a><div className="hero-note">Phone verification required · Booking requests are not payments</div></div><div className="hero-card"><div className="card-top"><span>YOUR LOCAL CREW</span><span className="spark">✳</span></div><div className="worker-illustration">👷🏽‍♂️</div><div className="card-bottom"><strong>Ready when you are.</strong><span>Skilled help, close to home.</span></div><div className="floating-tag">● &nbsp;Mavelikara service area</div></div></section>
    {!firebaseReady && <div className="setup-alert"><strong>Setup needed:</strong> Add Firebase web-app values to <code>.env.local</code>, enable Phone Authentication, and deploy the Firestore rules. See README.</div>}
    <section className="auth-strip"><div><span className="eyebrow">CUSTOMER & WORKER ACCESS</span><h2>{user ? "You’re signed in" : "Verify your phone to continue"}</h2><p>{user ? `Verified number: ${user.phoneNumber ?? "phone account"}` : "We use Firebase phone sign-in to protect booking submissions."}</p></div>{user ? <button className="button outline" onClick={() => signOut(auth!)}>Sign out</button> : <form className="auth-form" onSubmit={confirmation ? verifyOtp : sendOtp}>{confirmation ? <><input aria-label="SMS code" inputMode="numeric" autoComplete="one-time-code" placeholder="SMS verification code" value={code} onChange={e => setCode(e.target.value)} required /><button className="button dark" disabled={busy}>Verify code</button></> : <><input aria-label="Phone number" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required /><button className="button dark" disabled={busy}>Send OTP</button></>}<div id="recaptcha-container" /></form>}</section>
    {notice && <div className={`notice ${notice.kind}`} role="status">{notice.text}<button aria-label="Dismiss" onClick={() => setNotice(null)}>×</button></div>}
    <section className="services" id="services"><div className="section-heading"><div><span className="eyebrow">HOW CAN WE HELP?</span><h2>Make your next project easier.</h2></div><span className="section-aside">A simple request is the first step.<br />Our team will follow up to coordinate.</span></div><div className="service-grid">{[["01","General help","Helper"],["02","Build & repair","Mason"],["03","Electrical work","Electrician"],["04","Plumbing","Plumber"],["05","Woodwork","Carpenter"],["06","Painting & finish","Painter"],["07","Floor & tile","Tile Worker"],["08","Home care","Cleaner"]].map(([n,title,cat]) => <button key={n} className={`service-card ${tab === "booking" ? "" : "muted"}`} onClick={() => { setTab("booking"); document.getElementById("request-form")?.scrollIntoView({ behavior: "smooth" }); }}><span>{n}</span><strong>{title}</strong><small>{cat} <b>↗</b></small></button>)}</div></section>
    <section className="request-section" id="request-form"><div className="request-intro"><span className="eyebrow">GET STARTED</span><h2>Let’s get the<br /><em>work moving.</em></h2><p>Choose an option and tell us a little about what you need. A request is not a confirmed booking; our team will coordinate next steps.</p><div className="safe-note"><span>✳</span><p><strong>Your information matters.</strong><br />Only share details needed to coordinate the work. Don’t upload IDs or payment credentials.</p></div></div><div className="form-panel"><div className="tabs"><button className={tab === "booking" ? "active" : ""} onClick={() => setTab("booking")}>I need a worker</button><button className={tab === "worker" ? "active" : ""} onClick={() => setTab("worker")}>I’m a worker</button></div>{tab === "booking" ? <form onSubmit={submitBooking} className="fields"><div className="field"><label>What kind of work?</label><select name="category" required>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div><div className="field"><label>Booking type</label><select name="bookingType"><option>Per day</option><option>Per hour</option></select></div><div className="field"><label>Preferred date</label><input name="date" type="date" required /></div><div className="field"><label>Estimated budget (₹)</label><input name="amount" type="number" min="1" step="1" placeholder="e.g. 800" required /></div><div className="field full"><label>Work address / area</label><input name="address" placeholder="Mavelikara, Kerala" required maxLength={300} /></div><div className="field"><label>Payment preference</label><select name="paymentChoice"><option>Cash (not collected online)</option><option>UPI (not processed yet)</option></select></div><div className="field"><label>Work details (optional)</label><input name="details" maxLength={500} placeholder="A short description" /></div><button className="button primary submit" disabled={busy || !user}>{busy ? "Saving…" : "Send booking request"}<span>↗</span></button>{!user && <small className="form-hint">Verify your phone above to submit.</small>}</form> : <form onSubmit={submitWorker} className="fields"><div className="field full"><label>Full name</label><input name="name" required maxLength={100} placeholder="Your name" /></div><div className="field"><label>Work category</label><select name="category">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div><div className="field"><label>Rate per day (₹)</label><input name="rate" type="number" min="0" required /></div><div className="field"><label>Experience (years)</label><input name="experience" type="number" min="0" max="70" required /></div><div className="field"><label>Service area</label><input name="area" defaultValue="Mavelikara, Kerala" required maxLength={200} /></div><button className="button primary submit" disabled={busy || !user}>{busy ? "Sending…" : "Submit worker application"}<span>↗</span></button>{!user && <small className="form-hint">Verify your phone above to submit.</small>}<small className="form-hint full">Worker applications remain pending until an administrator reviews them.</small></form>}</div></section>
    <footer><a className="brand" href="#home"><span className="brand-mark">LG</span><span>Labour Guru<small>Mavelikara, Kerala</small></span></a><span>Connecting local skills to local needs.</span><span>Starter service · Online payments not enabled</span></footer>
  </main>;
}
