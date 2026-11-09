# iOS-Widget per Kurzbefehl

Eine PWA kann auf iOS kein eigenes Widget haben. Mit der Kurzbefehle-App geht es trotzdem:
ein Tipp auf den Kurzbefehl im Home-Screen-Widget schreibt direkt in die Datenbank.

## Einmalig
1. `setup.sql` im Supabase SQL Editor ausführen.
2. In CrimpLog: Profil (👤) → Einstellungen → "Token erzeugen" → Token kopieren.

## Kurzbefehl "+1 Rep"
Neuer Kurzbefehl mit **einer** Aktion "Inhalte von URL abrufen":
- URL: `https://fdgtzilbwjiuetrheoly.supabase.co/rest/v1/rpc/add_pullup`
- Methode: POST
- Header:
  - `apikey`: dein Supabase anon key (steht in script.js)
  - `Authorization`: `Bearer ` + derselbe anon key
  - `Content-Type`: `application/json`
- Anfragetext: JSON
  - `p_token` (Text): dein Token
  - `p_reps` (Zahl): 1 (oder mehr)
  - `p_weight_delta` (Zahl): 0

## Kurzbefehl "+ Gewicht"
Gleich, aber `p_reps` = 0 und `p_weight_delta` = 2.5.

## Widget
Home-Screen lange drücken → "+" → **Kurzbefehle** → Widget mit 2 Kurzbefehlen wählen
(Widget lange drücken → "Widget bearbeiten" → die beiden Kurzbefehle auswählen).
Alternativ: Kurzbefehl → Teilen → "Zum Home-Bildschirm" als eigenes Icon.

Hinweis: Ein echtes, gestaltbares Widget mit eigenen Plus-Buttons braucht eine native iOS-App (Xcode/WidgetKit).
