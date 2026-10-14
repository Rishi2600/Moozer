import type { Metadata } from "next";

import { CONTACT_EMAIL, LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = { title: "Privacy · Moozer" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="14 October 2026">
      <p>
        Moozer lets a room pick its music together. This page explains, in plain words, what we keep about you, why, and how to
        remove it. Moozer is run by Moozer; you can reach us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>What we keep</h2>
      <ul>
        <li><strong>Your account:</strong> your name and email. If you sign up with a password, we keep a scrambled (hashed) version of it, never the password itself.</li>
        <li><strong>Google or GitHub sign-in:</strong> if you use them, the basic profile they share (name, email, picture link) and the sign-in tokens needed to sign you in.</li>
        <li><strong>Your sessions:</strong> for each device you sign in on, the browser type and IP address. This is how the Account page can show &ldquo;Chrome, macOS&rdquo;, and it helps keep your account safe.</li>
        <li><strong>Spaces:</strong> the spaces you start or join, when you joined, and when you last opened them.</li>
        <li><strong>Songs and votes:</strong> the YouTube songs you add (the video&apos;s id, title, channel, thumbnail and length) and the songs you vote for.</li>
      </ul>
      <p>Who&apos;s in a room right now is worked out live and kept in memory only; we don&apos;t store it.</p>

      <h2>What other people see</h2>
      <ul>
        <li>People in a space see your name next to songs you add and in &ldquo;In the room&rdquo; while you&apos;re there.</li>
        <li>Everyone sees each song&apos;s vote count, but not who voted for it.</li>
        <li>Anyone with a space&apos;s link can see its name, its host&apos;s name, what&apos;s playing and the top of the queue.</li>
      </ul>

      <h2>Cookies</h2>
      <p>We use one cookie to keep you signed in. No advertising, no analytics trackers, and we don&apos;t sell or rent your data to anyone.</p>

      <h2>YouTube</h2>
      <p>
        Moozer uses YouTube API Services to look up songs and play them. When a song plays, YouTube&apos;s player loads from YouTube, and
        Google&apos;s handling of that is covered by the <a href="https://policies.google.com/privacy">Google Privacy Policy</a>. By using Moozer
        you also agree to the <a href="https://www.youtube.com/t/terms">YouTube Terms of Service</a>.
      </p>

      <h2>Deleting your data</h2>
      <p>
        You can delete your account at any time from the Account page. That removes your account, the spaces you host, the songs you added
        and your votes, straight away. If you can&apos;t sign in, email us and we&apos;ll delete it for you.
      </p>

      <h2>Children</h2>
      <p>Moozer isn&apos;t meant for children under 13, and we don&apos;t knowingly keep their data.</p>

      <h2>Changes</h2>
      <p>If we change this page, we&apos;ll update the date at the top. Big changes will be announced in the app.</p>
    </LegalPage>
  );
}
