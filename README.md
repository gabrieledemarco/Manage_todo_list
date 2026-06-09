# TaskFlow - Web App per la Gestione di Progetti

TaskFlow è una web app self-hosted per la gestione di progetti, attività e task con calendario per le scadenze e dashboard KPI.

## Stack Tecnologico

- **Frontend**: Next.js 16, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (facile da migrare a PostgreSQL)
- **UI Components**: Lucide Icons, Recharts, FullCalendar

## Struttura Gerarchica

```
Progetto → Categoria → Attività → Task
```

- **Progetti**: Contenitori principali per raggruppare il lavoro
- **Categorie**: Sottogruppi all'interno dei progetti (es. Design, Sviluppo, Testing)
- **Attività**: Insiemi di task correlati
- **Task**: Unità di lavoro atomiche con scadenza e priorità

## Funzionalità Principali

### Dashboard Home
- Panoramica dei progetti e statistiche rapide
- Task recenti e scadenze imminenti
- Quick actions per creare nuovi elementi

### Gestione Progetti
- Creazione, modifica ed eliminazione progetti
- Assegnazione colori per identificazione visiva
- Visualizzazione gerarchica categoria → attività → task

### Calendario
- Vista mensile e settimanale
- Visualizzazione scadenze con codice colori per priorità
- Navigazione rapida tra date

### Dashboard KPI
- Tasso di completamento generale
- Distribuzione task per stato (da fare, in corso, completato)
- Performance settimanali con grafici
- Tabella riepilogativa per progetto

## Installazione

```bash
# Clona il repository o copia i file in una cartella

# Installa le dipendenze
npm install

# Esegui le migrazioni del database
npx prisma migrate dev

# Avvia il server di sviluppo
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`

## Deploy Self-Hosted

### Opzione 1: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npx prisma migrate deploy
EXPOSE 3000
CMD ["npm", "start"]
```

### Opzione 2: PM2

```bash
npm install -g pm2
npm run build
pm2 start npm --name "taskflow" -- start
pm2 save
pm2 startup
```

### Opzione 3: VPS (Linux)

```bash
# Installa Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clona e configura
git clone <repository> taskflow
cd taskflow
npm install
npx prisma migrate deploy
npm run build
npm install -g pm2
pm2 start npm --name "taskflow" -- start
pm2 save
```

## Configurazione Database

Il database SQLite è configurato di default. Per usare PostgreSQL:

1. Aggiorna `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Imposta la variabile d'ambiente:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/taskflow"
```

3. Riesegui le migrazioni:
```bash
npx prisma migrate deploy
```

## Variabili d'Ambiente

Crea un file `.env` nella root:

```env
DATABASE_URL="file:./dev.db"
NODE_ENV="production"
```

## API Endpoints

### Progetti
- `GET /api/projects` - Lista progetti
- `POST /api/projects` - Crea progetto
- `GET /api/projects/[id]` - Dettaglio progetto
- `PUT /api/projects/[id]` - Aggiorna progetto
- `DELETE /api/projects/[id]` - Elimina progetto

### Categorie
- `GET /api/categories` - Lista categorie
- `POST /api/categories` - Crea categoria
- `PUT /api/categories/[id]` - Aggiorna categoria
- `DELETE /api/categories/[id]` - Elimina categoria

### Attività
- `GET /api/activities` - Lista attività
- `POST /api/activities` - Crea attività
- `PUT /api/activities/[id]` - Aggiorna attività
- `DELETE /api/activities/[id]` - Elimina attività

### Task
- `GET /api/tasks` - Lista task
- `POST /api/tasks` - Crea task
- `PUT /api/tasks/[id]` - Aggiorna task
- `DELETE /api/tasks/[id]` - Elimina task

### Statistiche
- `GET /api/stats` - Statistiche generali

## Comandi Utili

```bash
npm run dev      # Server di sviluppo
npm run build    # Build per produzione
npm run start    # Avvia server produzione
npx prisma studio # GUI per database
npx prisma migrate dev # Crea migrazioni
```

## Struttura File

```
taskflow/
├── prisma/
│   └── schema.prisma      # Schema database
├── src/
│   ├── app/
│   │   ├── page.tsx       # Dashboard home
│   │   ├── projects/      # Pagine progetti
│   │   ├── calendar/      # Pagina calendario
│   │   ├── dashboard/    # Pagina statistiche
│   │   └── api/           # API routes
│   ├── components/        # Componenti React
│   └── lib/               # Utility e types
├── .env                   # Variabili ambiente
└── package.json
```

## Screenshot

L'interfaccia presenta:
- Design moderno con tema scuro (Slate)
- Palette colori Indigo/Cyan
- Animazioni fluide e transizioni
- Responsive per desktop e tablet

---

Sviluppato con Next.js 16 e Prisma
