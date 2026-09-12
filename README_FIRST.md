# TimeLine GitHub CDN Pack

Dieses Paket ist fuer dein oeffentliches GitHub-Repository `timeline` vorbereitet.

## Direkt hochladen
Der Inhalt dieses READY-Pakets enthaelt die zentralen Orbitron-Fonts und Web-/Media-Assets aus deinen TimeLine-Ressourcen. Lua, SQL, CFG, Servercode, WaveShield/Security, Tokens, Webhooks und andere sensible Dateien wurden nicht aufgenommen.

## Empfohlene Basis-URL
`https://cdn.jsdelivr.net/gh/<GITHUB_USER>/timeline@main/`

Ersetze `<GITHUB_USER>` durch deinen GitHub-Benutzernamen.

Beispiele:
- Globales CSS: `https://cdn.jsdelivr.net/gh/<GITHUB_USER>/timeline@main/timeline-global.css`
- Orbitron CSS: `https://cdn.jsdelivr.net/gh/<GITHUB_USER>/timeline@main/fonts/orbitron/fonts.css`
- Bold Font: `https://cdn.jsdelivr.net/gh/<GITHUB_USER>/timeline@main/fonts/orbitron/Orbitron-Bold.ttf`

## So benutzt du das Paket
1. ZIP direkt in deinen lokalen GitHub-Ordner `timeline` entpacken.
2. In GitHub Desktop alle Dateien committen und pushen.
3. Repository muss fuer jsDelivr oeffentlich sein.
4. Danach die lokalen Asset-Pfade deiner FiveM-UIs Schritt fuer Schritt durch die jsDelivr-URLs ersetzen.
5. `index.html`/NUI-Seiten und FiveM Lua-Code weiterhin lokal lassen; dieses Paket externalisiert vor allem statische Assets sowie CSS/JS-Kandidaten deiner eigenen TimeLine-UIs.

## Drittanbieter-Pakete
Die weiteren `REVIEW`-ZIPs enthalten nur statische Dateien aus uebernommenen/fremden Ressourcen. Lade diese NICHT automatisch oeffentlich hoch. Erst Lizenz/Tebex-/Escrow-Bedingungen pruefen. Nach Freigabe kannst du die gewuenschten Dateien aus `_REVIEW_THIRD_PARTY` in eine normale Repo-Struktur verschieben.

## Nicht fuer dieses GitHub-CDN aufgenommen
- `.lua`, `.sql`, `.cfg` und Server-Konfigurationen
- WaveShield/Security-Dateien
- FiveM Stream-Dateien wie `.ytd`, `.ydr`, `.yft`, `.ymap`
- Source Maps und Node-Module
- sonstige Dateien, bei denen eine oeffentliche Bereitstellung keinen sinnvollen CDN-Vorteil bringt

Die komplette Zuordnung steht unter `_MANIFEST/CDN_READY_MANIFEST.csv`.
