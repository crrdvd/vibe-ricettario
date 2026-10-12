# 🍳 Vibe Ricettario

Un'applicazione web per gestire le tue ricette preferite, ottimizzata per Raspberry Pi.

> **🎵 Vibe Coding Project**  
> Questo progetto è stato interamente realizzato con **vibe coding** - programmazione assistita da AI attraverso conversazione naturale con Claude (Anthropic). Nessuna riga di codice è stata scritta manualmente: tutto è nato da descrizioni, richieste e feedback in linguaggio naturale.

## Caratteristiche

- ✅ Gestione completa ricette (CRUD)
- ✅ Ingredienti organizzati in sezioni
- ✅ **Scaling proporzionale**: modifica una quantità e tutte si aggiornano automaticamente
- ✅ **Peso Totale** per ricette "Pane e Lievitati": modifica il peso totale e tutti gli ingredienti si scalano proporzionalmente
- ✅ Salvataggio automatico delle ultime quantità usate
- ✅ Visualizzazione quantità originali
- ✅ Passaggi di preparazione numerati
- ✅ Foto ricette (opzionale, ridimensionate automaticamente a 1600px)
- ✅ Categorie/tag per organizzare le ricette
- ✅ Filtro e ricerca
- ✅ Modalità visualizzazione/modifica
- ✅ Tema chiaro/scuro
- ✅ 3 font disponibili (sans-serif, serif, monospace)
- ✅ Spaziatura compatta/comoda
- ✅ Formato data personalizzabile
- ✅ Gestione unità di misura
- ✅ Import/Export backup JSON
- ✅ Backup automatico giornaliero di database e foto
- ✅ Design responsive (mobile + tablet landscape)
- ✅ Interfaccia in italiano

## Requisiti

- Raspberry Pi 4B (o qualsiasi sistema Linux)
- Python 3.8+
- pip

## Installazione su Raspberry Pi

### 1. Clona la repository

```bash
cd /home/davide/GIT
git clone <url-repository> vibe-ricettario
cd vibe-ricettario
```

### 2. Installa le dipendenze

Su Raspberry Pi OS / Debian conviene usare i pacchetti di sistema:

```bash
sudo apt install python3-flask python3-pil python3-waitress sqlite3 rsync
```

In alternativa, con pip:

```bash
pip3 install -r requirements.txt
```

### 3. Crea la cartella per il database e le foto

Il database e le foto vengono salvati **fuori dalla repository** per evitare sovrascritture accidentali con git pull.

```bash
# Crea la cartella data
mkdir -p /home/davide/data/uploads

# Se hai un database esistente nella repo, spostalo
mv /home/davide/GIT/vibe-ricettario/recipe_book.db /home/davide/data/

# Se hai foto esistenti nella repo, spostale
mv /home/davide/GIT/vibe-ricettario/uploads/* /home/davide/data/uploads/
```

### 4. Test manuale

```bash
# Imposta le variabili d'ambiente per il test
export DATABASE_PATH=/home/davide/data/recipe_book.db
export UPLOAD_FOLDER=/home/davide/data/uploads
python3 app.py
```

Apri un browser e vai a `http://<IP-RASPBERRY>:5000`

### 5. Configura il servizio systemd (avvio automatico)

Il servizio usa [waitress](https://docs.pylonsproject.org/projects/waitress/) come server WSGI di produzione
(`python3 app.py` avvia invece il server di sviluppo di Flask, adatto solo ai test).

```bash
# Crea la cartella per i log
sudo mkdir -p /var/log/vibe-ricettario
sudo chown davide:davide /var/log/vibe-ricettario

# Crea la cartella per database e uploads (se non esiste)
mkdir -p /home/davide/data/uploads

# Copia il file di servizio
sudo cp vibe-ricettario.service /etc/systemd/system/

# Ricarica systemd
sudo systemctl daemon-reload

# Abilita il servizio all'avvio
sudo systemctl enable vibe-ricettario

# Avvia il servizio
sudo systemctl start vibe-ricettario

# Verifica lo stato
sudo systemctl status vibe-ricettario

# Backup automatico giornaliero (alle 03:30)
sudo cp vibe-ricettario-backup.service vibe-ricettario-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vibe-ricettario-backup.timer
```

### 6. Accedi all'applicazione

Apri un browser su qualsiasi dispositivo nella stessa rete e vai a:
```
http://<IP-RASPBERRY>:5000
```

Per trovare l'IP del Raspberry Pi:
```bash
hostname -I
```

## Aggiornamento da Git

Quando vuoi aggiornare il Raspberry Pi con le ultime modifiche:

```bash
cd /home/davide/GIT/vibe-ricettario

# Scarica le ultime modifiche
git pull

# Se hai modificato i file di servizio, ricopiali
sudo cp vibe-ricettario.service vibe-ricettario-backup.service vibe-ricettario-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload

# Riavvia il servizio
sudo systemctl restart vibe-ricettario
```

**Nota:** Il database in `/home/davide/data/recipe_book.db` NON viene toccato dal git pull, quindi i tuoi dati sono al sicuro.

## Struttura del Progetto

```
vibe-ricettario/
├── app.py                    # Applicazione Flask principale
├── database.py               # Modulo database SQLite
├── requirements.txt          # Dipendenze Python
├── vibe-ricettario.service   # File systemd per auto-start
├── backup.sh                 # Backup di database e foto
├── vibe-ricettario-backup.service  # File systemd del backup
├── vibe-ricettario-backup.timer    # Esegue il backup ogni notte
├── static/
│   ├── css/
│   │   └── style.css         # Stili (temi, responsive)
│   ├── icons/                # Favicon e icona per la schermata Home
│   └── js/
│       ├── app.js            # JavaScript principale
│       └── settings.js       # JavaScript pagina impostazioni
└── templates/
    ├── index.html            # Pagina principale
    └── settings.html         # Pagina impostazioni

/home/davide/data/
├── recipe_book.db            # Database SQLite (FUORI dalla repo)
├── uploads/                  # Foto ricette (FUORI dalla repo)
└── backups/                  # Backup giornalieri (YYYY-MM-DD/)
```

## Comandi Utili

```bash
# Riavvia il servizio
sudo systemctl restart vibe-ricettario

# Ferma il servizio
sudo systemctl stop vibe-ricettario

# Visualizza i log
tail -f /var/log/vibe-ricettario/app.log
tail -f /var/log/vibe-ricettario/error.log

# Visualizza log systemd
journalctl -u vibe-ricettario -f

# Backup manuale (database e foto)
/home/davide/GIT/vibe-ricettario/backup.sh

# Stato del backup automatico
systemctl list-timers vibe-ricettario-backup.timer
journalctl -u vibe-ricettario-backup
```

## Backup e Ripristino

### Esporta (dalla UI)
1. Vai in Impostazioni
2. Clicca "Esporta"
3. Salva il file JSON

### Importa (dalla UI)
1. Vai in Impostazioni
2. Clicca "Importa"
3. Seleziona il file JSON di backup

### Backup automatico
Ogni notte alle 03:30 `vibe-ricettario-backup.timer` esegue `backup.sh`, che salva in
`/home/davide/data/backups/YYYY-MM-DD/` una copia consistente del database (`sqlite3 .backup`, verificata
con `integrity_check`) e delle foto. Le foto non modificate sono hard link al backup precedente, quindi
non occupano spazio in più. Vengono tenuti gli ultimi 30 backup (variabile `KEEP`).

I backup restano sulla stessa scheda SD: per proteggerti da un guasto della scheda copiali ogni tanto
su un altro computer, ad esempio:

```bash
rsync -a davide@<IP-RASPBERRY>:data/backups/ ~/backup-ricettario/
```

### Ripristino
```bash
sudo systemctl stop vibe-ricettario
cp /home/davide/data/backups/YYYY-MM-DD/recipe_book.db /home/davide/data/recipe_book.db
rsync -a /home/davide/data/backups/YYYY-MM-DD/uploads/ /home/davide/data/uploads/
sudo systemctl start vibe-ricettario
```

## Personalizzazione

### Cambiare porta
Modifica `--listen=0.0.0.0:5000` nella riga `ExecStart` di `vibe-ricettario.service`, poi ricopia il file
in `/etc/systemd/system/` e riavvia il servizio. Per il server di sviluppo la porta è nell'ultima riga di `app.py`.

### Aggiungere HTTPS (opzionale)
Per produzione con HTTPS, considera di usare Nginx come reverse proxy.

## Risoluzione Problemi

### L'app non si avvia
```bash
# Controlla i log
journalctl -u vibe-ricettario -f

# Verifica le dipendenze
pip3 install -r requirements.txt

# Prova ad avviare manualmente
cd /home/davide/GIT/vibe-ricettario
python3 app.py
```

### Database corrotto
Ripristina l'ultimo backup (vedi [Ripristino](#ripristino)). In mancanza di backup:
```bash
# Elimina e ricrea (perderai i dati!)
rm /home/davide/data/recipe_book.db
sudo systemctl restart vibe-ricettario
```

### Permessi file
```bash
chown -R davide:davide /home/davide/GIT/vibe-ricettario
chmod 755 /home/davide/GIT/vibe-ricettario
```

## Funzionalità Speciali

### Scaling Ingredienti
Quando visualizzi una ricetta, puoi modificare la quantità di qualsiasi ingrediente. Tutti gli altri ingredienti si aggiorneranno proporzionalmente mantenendo le proporzioni originali della ricetta.

### Peso Totale (solo per "Pane e Lievitati")
Per le ricette nella categoria "Pane e Lievitati" appare un campo speciale "Peso Totale" che mostra la somma di tutte le quantità. Modificando questo valore, tutti gli ingredienti si scalano proporzionalmente - utile quando vuoi fare un impasto di un peso specifico.

---

## Licenza

Uso personale. Creato con ❤️ e **vibe coding** per la tua cucina.

---

*Progetto realizzato interamente tramite vibe coding con Claude AI*
