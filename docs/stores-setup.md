# App Store Konten — Apple Developer + Google Play Console

**Ziel:** Beide Konten auf **Brainchildz Event Agentur** anlegen, sodass Bundle-ID `de.energize-festival.app` reservierbar ist und wir in Phase 4 TestFlight + Internal-Testing aufsetzen können.

**Aufwand:** ~30 Minuten Klick-Arbeit + 1–2 Tage Apple-Verifikation + ~24 h Google-Identity-Check.

## Voraussetzungen

- Brainchildz **D-U-N-S-Nummer** (laut deiner Info schon vorhanden — bitte griffbereit halten).
- Brainchildz-Bankdaten (für jährliche Apple-Gebühr).
- Personalausweis-Foto (für Google Play Identity-Verification).
- Eine **Brainchildz-E-Mail-Adresse** als Apple-ID (z. B. `apple@brainchildz.de`) — **nicht** deine persönliche!

## Apple Developer Program ($99/Jahr)

### 1. Apple-ID auf Brainchildz-Adresse anlegen

1. **https://appleid.apple.com** → „Apple-ID erstellen".
2. E-Mail: `apple@brainchildz.de` (oder ähnlich).
3. Zwei-Faktor-Authentifizierung aktivieren (Pflicht für Developer-Konten).

### 2. Enrollment als Organization

1. **https://developer.apple.com/programs/enroll/** öffnen.
2. Mit der frisch erstellten Apple-ID anmelden.
3. „Enroll as an Organization" wählen.
4. Daten eingeben:
   - **Legal Entity Name**: muss exakt mit dem im DUNS hinterlegten Brainchildz-Namen übereinstimmen!
   - **D-U-N-S Number**: eingeben
   - **Headquarters Address**: Brainchildz-Adresse
   - **Website**: `https://www.energize-festival.de` (oder Brainchildz-Domain)
5. Telefonnummer für Verifikations-Rückruf eingeben.
6. **$99 USD** Zahlung mit Kreditkarte.

**Apple ruft an** (manchmal innerhalb von Stunden, manchmal 1–2 Tage) um die Organisation zu verifizieren. Person am Telefon muss bestätigen können, dass Brainchildz das Konto wirklich beantragt hat.

### 3. Bundle-ID reservieren (nach Enrollment-Bestätigung)

1. **https://developer.apple.com/account/resources/identifiers/list** öffnen.
2. „Identifiers" → „+" → „App IDs" → „App".
3. Description: `ENERGIZE Festival`
4. Bundle ID: **Explicit** → `de.energize-festival.app`
5. Capabilities (jetzt schon einschalten, was wir später brauchen):
   - ✅ Push Notifications
   - ✅ Sign in with Apple → **nein**, brauchen wir laut Plan nicht
   - ✅ Associated Domains (für Magic-Link-Deep-Linking in Phase 5)
6. Speichern.

### 4. App Store Connect (für TestFlight + Submission)

1. **https://appstoreconnect.apple.com** öffnen.
2. „My Apps" → „+" → „New App".
3. Daten:
   - Platform: iOS
   - Name: **ENERGIZE**
   - Primary Language: German
   - Bundle ID: `de.energize-festival.app`
   - SKU: `energize-app` (egal)
4. Speichern. App-Listing kommt in Phase 10.

### 5. Team-Member einladen (falls du nicht alleine entwickelst)

1. App Store Connect → „Users and Access" → „+".
2. Rolle: **Developer** für Entwickler, **App Manager** für dich, **Marketing** für PR-Person.
3. Einladung per E-Mail.

---

## Google Play Console (einmalig $25)

### 1. Google-Account auf Brainchildz-Adresse

1. **https://accounts.google.com/signup** → Account mit `play@brainchildz.de` anlegen.
2. 2-Faktor-Authentifizierung aktivieren.

### 2. Console-Registrierung

1. **https://play.google.com/console/signup** öffnen.
2. Mit dem Brainchildz-Google-Account anmelden.
3. „Organization" als Account-Typ wählen.
4. Daten:
   - **Organization name**: Brainchildz Event Agentur (exakt!)
   - **Address**: Brainchildz-Adresse
   - **Website**: `https://www.energize-festival.de`
   - **D-U-N-S Number**: eingeben (Google nutzt sie auch zur Verifikation)
   - **Tax / Business ID**: deutsche Steuer-ID oder USt-IdNr.
5. **$25 USD** einmalig zahlen.
6. **Identity Verification**: Personalausweis-Foto hochladen (das einer vertretungsberechtigten Person bei Brainchildz). Google prüft in ~24–48 h.

### 3. App-Eintrag (kommt in Phase 4)

Wenn die App-Eintrag in Phase 4 ansteht:

1. „Create app" → Name: `ENERGIZE`, Default language: German, App or game: App, Free or paid: Free.
2. Package name (= Android Application ID): `de.energize-festival.app` — muss exakt zum Capacitor-Setup passen.
3. Listing-Inhalte (Beschreibung, Screenshots, Icon) kommen in Phase 10.

---

## Status-Check für mich (Claude)

Sobald beide Konten aktiv sind, sag mir Bescheid mit:

- ✅ Apple-Konto Brainchildz aktiv (Bundle-ID reserviert: ja/nein)
- ✅ Google Play Console Brainchildz aktiv

Dann starte ich in Phase 4 mit dem nativen Capacitor-Build und der App-Konfiguration.
