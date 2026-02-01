# 🍳 Ricettario - Recipe Book

Un'applicazione web per gestire le tue ricette preferite, ottimizzata per Raspberry Pi.

## Caratteristiche

- ✅ Gestione completa ricette (CRUD)
- ✅ Ingredienti organizzati in sezioni
- ✅ **Scaling proporzionale**: modifica una quantità e tutte si aggiornano automaticamente
- ✅ Salvataggio automatico delle ultime quantità usate
- ✅ Visualizzazione quantità originali
- ✅ Passaggi di preparazione numerati
- ✅ Foto ricette (opzionale)
- ✅ Categorie/tag per organizzare le ricette
- ✅ Filtro e ricerca
- ✅ Modalità visualizzazione/modifica
- ✅ Tema chiaro/scuro
- ✅ 3 font disponibili (sans-serif, serif, monospace)
- ✅ Spaziatura compatta/comoda
- ✅ Formato data personalizzabile
- ✅ Gestione unità di misura
- ✅ Import/Export backup JSON
- ✅ Design responsive (mobile + tablet landscape)
- ✅ Interfaccia in italiano

## Requisiti

- Raspberry Pi 4B (o qualsiasi sistema Linux)
- Python 3.8+
- pip

## Installazione su Raspberry Pi

### 1. Trasferisci i file

```bash
# Crea la cartella
mkdir -p /home/pi/recipe-book

# Copia tutti i file del progetto nella cartella
# Puoi usare scp, SFTP, o una chiavetta USB
```

### 2. Installa le dipendenze

```bash
cd /home/pi/recipe-book
pip3 install -r requirements.txt
```

### 3. Test manuale

```bash
python3 app.py
```

Apri un browser e vai a `http://<IP-RASPBERRY>:5000`

### 4. Configura il servizio systemd (avvio automatico)

```bash
# Crea la cartella per i log
sudo mkdir -p /var/log/recipe-book
sudo chown pi:pi /var/log/recipe-book

# Copia il file di servizio
sudo cp recipe-book.service /etc/systemd/system/

# Ricarica systemd
sudo systemctl daemon-reload

# Abilita il servizio all'avvio
sudo systemctl enable recipe-book

# Avvia il servizio
sudo systemctl start recipe-book

# Verifica lo stato
sudo systemctl status recipe-book
```

### 5. Accedi all'applicazione

Apri un browser su qualsiasi dispositivo nella stessa rete e vai a:
```
http://<IP-RASPBERRY>:5000
```

Per trovare l'IP del Raspberry Pi:
```bash
hostname -I
```

## Struttura del Progetto

```
recipe-book/
├── app.py                 # Applicazione Flask principale
├── database.py            # Modulo database SQLite
├── requirements.txt       # Dipendenze Python
├── recipe-book.service    # File systemd per auto-start
├── recipe_book.db         # Database SQLite (creato automaticamente)
├── uploads/               # Foto ricette
├── static/
│   ├── css/
│   │   └── style.css      # Stili (temi, responsive)
│   └── js/
│       ├── app.js         # JavaScript principale
│       └── settings.js    # JavaScript pagina impostazioni
└── templates/
    ├── index.html         # Pagina principale
    └── settings.html      # Pagina impostazioni
```

## Comandi Utili

```bash
# Riavvia il servizio
sudo systemctl restart recipe-book

# Ferma il servizio
sudo systemctl stop recipe-book

# Visualizza i log
tail -f /var/log/recipe-book/app.log
tail -f /var/log/recipe-book/error.log

# Backup manuale del database
cp /home/pi/recipe-book/recipe_book.db /home/pi/recipe_book_backup.db
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

### Backup manuale database
```bash
# Backup
cp recipe_book.db recipe_book_backup_$(date +%Y%m%d).db

# Ripristino
cp recipe_book_backup_YYYYMMDD.db recipe_book.db
sudo systemctl restart recipe-book
```

## Personalizzazione

### Cambiare porta
Modifica `app.py`, ultima riga:
```python
app.run(host='0.0.0.0', port=8080, debug=False)
```

### Aggiungere HTTPS (opzionale)
Per produzione con HTTPS, considera di usare Nginx come reverse proxy.

## Risoluzione Problemi

### L'app non si avvia
```bash
# Controlla i log
journalctl -u recipe-book -f

# Verifica le dipendenze
pip3 install -r requirements.txt

# Prova ad avviare manualmente
python3 app.py
```

### Database corrotto
```bash
# Elimina e ricrea (perderai i dati!)
rm recipe_book.db
sudo systemctl restart recipe-book
```

### Permessi file
```bash
chown -R pi:pi /home/pi/recipe-book
chmod 755 /home/pi/recipe-book
```

## Licenza

Uso personale. Creato con ❤️ per la tua cucina.
