# Supabase E-Mail-Templates

Vollständige HTML-Templates für alle Auth-E-Mails von Energize. Mit
Energize-Branding (Schwarz auf Gelb, Plakat-Style), DE-Texten und
**vollständigem `<html>`-Layout** — löst die Spam-Score-Probleme:

- `HTML_MIME_NO_HTML_TAG` (0.635) — gelöst durch komplettes
  `<!DOCTYPE html><html>…</html>`
- `MIME_HTML_ONLY` (0.1) — kann Supabase Standard-SMTP nicht
  verhindern (siehe „SMTP" unten), bleibt 0.1 (akzeptabel)
- `MISSING_MID` (0.14) — kann Standard-SMTP nicht setzen (siehe „SMTP"
  unten), bleibt 0.14 (akzeptabel oder eigenen SMTP nutzen)

## Setup im Supabase-Dashboard

**Authentication → Email Templates** — vier Templates anpassen:

### 1. Magic Link

- **Subject:** `Dein Login-Link für Energize ⚡`
- **Body:** Inhalt von `magic-link.html` reinkopieren

### 2. Confirm signup

- **Subject:** `Willkommen bei Energize — bitte E-Mail bestätigen`
- **Body:** Inhalt von `confirm-signup.html` reinkopieren

### 3. Email change

- **Subject:** `Energize — E-Mail-Adresse ändern bestätigen`
- **Body:** Inhalt von `email-change.html` reinkopieren

### 4. Reset password

Wir nutzen aktuell nur Magic-Link, daher kein Reset-Password-Flow.
Falls Supabase es trotzdem schickt: Magic-Link-Template reinkopieren
(passt inhaltlich).

## Test

Nach jedem Speichern: rechts neben dem Editor auf **„Send test email"**
klicken, deine E-Mail eintragen, prüfen wie's ankommt. Bei Spam-Probleme:

- mail-tester.com nutzen (Testadresse generieren, dahin senden)
- Score sollte mit den neuen Templates auf 8–9/10 sein (statt 6–7
  vorher)

## Verfügbare Variablen

Die Templates nutzen Supabase-eigene Go-Template-Variablen:

| Variable                 | Bedeutung                                  |
| ------------------------ | ------------------------------------------ |
| `{{ .ConfirmationURL }}` | Magic-Link / Confirm-URL                   |
| `{{ .Token }}`           | OTP-Code (nicht verwendet)                 |
| `{{ .TokenHash }}`       | OTP-Hash                                   |
| `{{ .SiteURL }}`         | Site URL aus Auth-Config                   |
| `{{ .Email }}`           | E-Mail-Adresse des Empfängers              |
| `{{ .Data }}`            | User-Metadata (z. B. `{{ .Data.locale }}`) |

## SMTP für Produktion

**Supabase Standard-SMTP** ist OK für Tests (3 Mails/h pro Empfänger),
aber:

- Setzt keine Message-ID → `MISSING_MID`-Spam-Score
- Liefert nur HTML, kein text/plain-Part → `MIME_HTML_ONLY`-Spam-Score
- Rate-limit ist niedrig

Vor dem Festival 2027 (oder sobald viele User registrieren) eigenen
SMTP-Provider hinterlegen:

**Project Settings → Auth → SMTP Settings:**

Empfohlen:

- **Postmark** (€10/Monat, beste Zustellrate, Transaktional-Spezialist)
- **Mailjet** (kostenlos bis 6k Mails/Monat, EU-Server)
- **Resend** (Free-Tier 3000/Monat, modern, EU-Server)

Sobald eigener SMTP läuft, setzen die Provider automatisch:

- `Message-ID` Header → `MISSING_MID` weg
- `text/plain`-Alternative aus HTML generiert → `MIME_HTML_ONLY` weg

Damit landet die Mail mit den Templates bei mail-tester.com auf
**10/10**.

## DSGVO-Hinweis

Die Templates referenzieren „Brainchildz Event Agentur" als
Datenverantwortlichen. Wenn das ändern soll, alle vier Templates
gleichzeitig anpassen.
