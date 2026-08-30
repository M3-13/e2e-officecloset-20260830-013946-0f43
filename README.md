# Glamouröser Kleiderschrank-Manager

Ein eleganter Kleiderschrank-Manager im Hollywood-Red-Carpet-Stil: Nutzer registrieren sich und verwalten ihre Garderobe (Kleidungsstücke mit Bild-Upload und Kategorien), durchstöbern sie und kombinieren Einzelteile im Outfit-Creator zu gespeicherten Outfits.

## Tech Stack

- **Backend**: Python 3.13, FastAPI, SQLAlchemy, SQLite
- **Auth**: JWT (HS256)
- **Frontend**: React, Vite, Tailwind CSS

## Installation

```bash
# Backend (aus dem Repository-Root)
cd backend
py -m pip install -r requirements.txt
# Umgebungsvariablen einrichten (siehe .env.example)
Copy-Item .env.example .env
```

Für das Frontend (separates Ticket) gilt analog `npm install` im Verzeichnis `frontend/`.

## Entwicklung starten

**Backend** (Port 8000):

```bash
cd backend
py -m uvicorn app.main:app --port 8000
```

**Frontend** (Port 5173, separates Ticket):

```bash
cd frontend
npm run dev
```

## Umgebungsvariablen

| Variable          | Bedeutung                                          | Default                     |
| ----------------- | -------------------------------------------------- | --------------------------- |
| `SECRET_KEY`      | JWT-Signaturschlüssel (HS256), **zwingend** setzen | –                           |
| `DATABASE_URL`    | SQLAlchemy-Datenbank-URL                           | `sqlite:///./wardrobe.db`   |
| `UPLOAD_DIR`      | Verzeichnis für hochgeladene Bilder                | `./uploads`                 |
| `FRONTEND_ORIGIN` | Erlaubte CORS-Origin (Frontend)                    | `http://localhost:5173`     |
| `VITE_API_BASE_URL` | API-Basis-URL des Frontends                      | `http://localhost:8000`     |

`SECRET_KEY` wird in `RUN.json` pro Lauf automatisch generiert (Hex, 32 Bytes). Für lokale Entwicklung ohne den Runner kopieren Sie `backend/.env.example` nach `backend/.env` und tragen dort einen selbst erzeugten Schlüssel ein:

```bash
cd backend
Copy-Item .env.example .env
# dann in .env den SECRET_KEY setzen, z. B.:
py -c "import secrets; print(secrets.token_hex(32))"
```

## API

Alle Endpunkte antworten mit JSON; Fehler haben stets die Form `{"detail": "<nachricht>"}`. Geschützte Routen erwarten `Authorization: Bearer <JWT>` (außer `health`, `register` und `login`).

| Methode | Pfad                                   | Beschreibung                              |
| ------- | -------------------------------------- | ----------------------------------------- |
| GET     | `/api/health`                          | Health-Check → `{"status":"ok"}`          |
| POST    | `/api/auth/register`                   | Registrierung (`{email, password}`)       |
| POST    | `/api/auth/login`                      | Anmeldung (`{email, password}`)           |
| DELETE  | `/api/account`                         | Account samt Daten löschen                |
| POST    | `/api/wardrobe/items`                  | Kleidungsstück anlegen (multipart)        |
| GET     | `/api/wardrobe/items`                  | Garderobe auflisten (`?category=` Filter) |
| PATCH   | `/api/wardrobe/items/{id}`             | Kleidungsstück bearbeiten                 |
| DELETE  | `/api/wardrobe/items/{id}`             | Kleidungsstück löschen                    |
| GET     | `/api/uploads/{filename}`              | Bild ausliefern                           |
| POST    | `/api/outfits`                         | Outfit anlegen                            |
| GET     | `/api/outfits`                         | Outfits auflisten                         |
| GET     | `/api/outfits/{id}`                    | Einzelnes Outfit                          |
| PATCH   | `/api/outfits/{id}`                    | Outfit umbenennen                         |
| DELETE  | `/api/outfits/{id}`                    | Outfit löschen                            |
| POST    | `/api/outfits/{id}/items`              | Stück zu Outfit hinzufügen                |
| DELETE  | `/api/outfits/{id}/items/{item_id}`    | Stück aus Outfit entfernen                |
| PUT     | `/api/outfits/{id}/items/{item_id}`    | Stück im Outfit ersetzen                  |

**Kategorien**: `oberteil`, `hose`, `kleid`, `schuhe`, `accessoire`.

## Features

- Registrierung & Login mit JWT
- Garderobe mit Bild-Upload (EXIF wird entfernt, 5-MB-Limit) und Kategorie-Filter
- Outfit-Creator (Stücke kombinieren, umbenennen, ersetzen, löschen)
- Account-Löschung mit allen zugehörigen Daten
- Elegante Red-Carpet-Optik (dunkle Glamour-Farbgebung, Serifentypografie)

## Tests

```bash
cd backend
py -m pytest
```
