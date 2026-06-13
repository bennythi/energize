<script lang="ts">
  import { Container, Heading } from '@energize/ui';
</script>

<svelte:head>
  <title>Datenschutz · ENERGIZE</title>
</svelte:head>

<Container size="md">
  <section class="py-16 md:py-24">
    <Heading level={1} display>Datenschutz</Heading>

    <p class="mt-4 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
      Stand: 13.06.2026 · Demo-Version, finale Prüfung durch Datenschutzbeauftragten ausstehend
    </p>

    <div class="mt-8 space-y-10 text-sm leading-relaxed text-fg-muted md:text-base">
      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          1. Verantwortlicher
        </h2>
        <p class="mt-3">
          Brainchildz Event Agentur<br />
          [Anschrift wird ergänzt]<br />
          [PLZ Ort]
        </p>
        <p class="mt-2">
          Kontakt: <a href="mailto:benjamin.thiel@outlook.com" class="text-accent hover:underline"
            >benjamin.thiel@outlook.com</a
          >
        </p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          2. Welche Daten erheben wir?
        </h2>

        <h3 class="mt-4 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          a) Beim Besuch der Website
        </h3>
        <p class="mt-2">
          Der Apache-Webserver (gehostet auf einem deutschen Server bei ANPA Networks) loggt
          technisch unvermeidbar IP-Adresse, Zeitstempel, aufgerufene URL, Browser-Typ und Referer.
          Diese Logs werden 14 Tage zur Fehlerdiagnose vorgehalten und danach automatisch gelöscht.
          Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an stabiler
          Bereitstellung).
        </p>

        <h3 class="mt-4 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          b) Beim Account-Anlegen (Login)
        </h3>
        <p class="mt-2">
          Pflicht: E-Mail-Adresse. Sie wird verschlüsselt bei Supabase (EU-Region Frankfurt)
          gespeichert. Beim Login schicken wir dir einen einmaligen Magic-Link an diese Adresse.
          Passwörter speichern wir keine.
        </p>
        <p class="mt-2">
          Freiwillig: Anzeigename, Handle, Telefonnummer, Geburtsdatum, Postleitzahl, Land, besuchte
          Festival-Editionen. Diese Angaben sind komplett freiwillig. Telefon, Geburtsdatum und PLZ
          sehen nur Energize-Mitarbeiter (Admins). Anzeigename und Handle sind in deinem
          öffentlichen Profil unter /u/[id] sichtbar.
        </p>
        <p class="mt-2">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertrag).</p>

        <h3 class="mt-4 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          c) Bei Nutzung der Foto-Wall
        </h3>
        <p class="mt-2">
          Wenn du ein Foto hochlädst, landet es in unserem Supabase-Storage (EU-Frankfurt) und wird
          vor der Veröffentlichung manuell durch einen Energize-Admin geprüft. Wir entfernen
          EXIF-Metadaten (auch Geo-Tags) im Browser, bevor das Bild hochgeladen wird. Freigegebene
          Bilder sind unter ihrer öffentlichen URL für alle Besucher sichtbar.
        </p>

        <h3 class="mt-4 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          d) Bei Feedback-Abgabe
        </h3>
        <p class="mt-2">
          Bewertung und Freitext-Antworten verknüpfen wir mit deinem Account, damit wir Duplikate
          verhindern und du dein Feedback nachträglich ändern kannst. Wir nutzen die Daten
          ausschließlich zur Verbesserung der nächsten Edition und für die Goodie-Verlosung.
        </p>

        <h3 class="mt-4 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          e) Anonyme Standort-Karte
        </h3>
        <p class="mt-2">
          Auf der /community-Seite zeigen wir eine Karte mit aggregierten User-Zahlen je PLZ-Bereich
          (erste Ziffer) und Land. Es werden nur Summen abgefragt, keine User-IDs. Du kannst
          niemanden auf der Karte einzeln identifizieren.
        </p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          3. Externe Dienste
        </h2>
        <dl class="mt-4 space-y-4">
          <div>
            <dt class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
              Supabase Inc. (Auth, Datenbank, Storage)
            </dt>
            <dd class="mt-1">
              Server-Region Frankfurt am Main. AVV (Auftragsverarbeitungsvertrag) mit Brainchildz
              besteht. Datenschutzerklärung des Anbieters:
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener"
                class="text-accent hover:underline">supabase.com/privacy</a
              >
            </dd>
          </div>
          <div>
            <dt class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
              Sanity (Content-Management für Lineup, FAQ)
            </dt>
            <dd class="mt-1">
              Liefert ausschließlich Inhalte, verarbeitet keine User-Daten. Server-Region EU.
              Datenschutzerklärung:
              <a
                href="https://www.sanity.io/legal/privacy"
                target="_blank"
                rel="noopener"
                class="text-accent hover:underline">sanity.io/legal/privacy</a
              >
            </dd>
          </div>
          <div>
            <dt class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
              tickee GmbH (Ticketshop)
            </dt>
            <dd class="mt-1">
              Eigenverantwortlich. Wenn du Tickets kaufst, wechselst du auf shop.tickee.de. Was dort
              passiert, regelt tickee mit dir direkt. Wir bekommen nur den Ist-Stand verkaufter
              Tickets, keine personenbezogenen Daten.
            </dd>
          </div>
          <div>
            <dt class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
              YouTube (eingebettete Videos auf /media)
            </dt>
            <dd class="mt-1">
              Wir verlinken nur. Der Klick führt zu youtube.com, dort gelten deren Regeln. Wir
              betten keine YouTube-Player ein, die im Hintergrund Cookies setzen.
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          4. Cookies und Tracking
        </h2>
        <p class="mt-3">
          Wir setzen keine Tracking-Cookies. Im Browser speichern wir genau zwei Sachen lokal: deine
          Sprach-Auswahl (DE oder EN) und dein Auth-Token (Supabase-Session, damit du nach Reload
          eingeloggt bleibst). Beides ist technisch erforderlich und braucht keine Einwilligung.
        </p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          5. Deine Rechte
        </h2>
        <p class="mt-3">Du hast nach DSGVO:</p>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>Auskunftsrecht (Art. 15): was haben wir über dich gespeichert</li>
          <li>Berichtigungsrecht (Art. 16): falsche Daten korrigieren lassen</li>
          <li>Löschungsrecht (Art. 17): Account komplett weg</li>
          <li>Einschränkung der Verarbeitung (Art. 18)</li>
          <li>Datenübertragbarkeit (Art. 20)</li>
          <li>Widerspruchsrecht (Art. 21)</li>
          <li>
            Beschwerderecht bei der zuständigen Aufsichtsbehörde (in Schleswig-Holstein: ULD Kiel)
          </li>
        </ul>
        <p class="mt-3">
          Anfragen an
          <a href="mailto:benjamin.thiel@outlook.com" class="text-accent hover:underline"
            >benjamin.thiel@outlook.com</a
          >. Account-Löschung im Account-Bereich auch selbst möglich (Funktion folgt zur
          Festival-Edition 2027).
        </p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          6. Speicherdauer
        </h2>
        <ul class="mt-3 list-disc space-y-1 pl-5">
          <li>Account-Daten: solange der Account aktiv ist</li>
          <li>Foto-Wall-Posts: bis sie vom Autor oder Admin gelöscht werden</li>
          <li>Feedback-Antworten: bis 6 Monate nach der jeweiligen Edition</li>
          <li>Server-Logs (Apache): 14 Tage rolling</li>
        </ul>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          7. Sicherheit
        </h2>
        <p class="mt-3">
          Verbindung verschlüsselt per TLS (Let's Encrypt). Auth-Token werden lokal im
          Browser-Storage gehalten, niemals im Server-Log. Passwörter speichern wir keine
          (Magic-Link-only). Postgres-Row-Level-Security setzt die Zugriffsregeln in der Datenbank
          um, nicht erst im JavaScript.
        </p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          8. Änderungen
        </h2>
        <p class="mt-3">
          Bei Funktionserweiterungen passen wir diese Erklärung an. Die jeweils aktuelle Version
          steht hier mit Datum oben.
        </p>
      </section>
    </div>
  </section>
</Container>
