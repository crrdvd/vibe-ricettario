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

### 1. Clona la repository

```bash
cd /home/davide/GIT
git clone <url-repository> vibe-ricettario
cd vibe-ricettario
```

### 2. Installa le dipendenze

```bash
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
sudo mkdir -p /var/log/vibe-ricettario
sudo chown davide:davide /var/log/vibe-ricettario

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
vibe-ricettario/
├── app.py                    # Applicazione Flask principale
├── database.py               # Modulo database SQLite
├── requirements.txt          # Dipendenze Python
├── vibe-ricettario.service   # File systemd per auto-start
├── recipe_book.db            # Database SQLite (creato automaticamente)
├── uploads/                  # Foto ricette
├── static/
│   ├── css/
│   │   └── style.css         # Stili (temi, responsive)
│   └── js/
│       ├── app.js            # JavaScript principale
│       └── settings.js       # JavaScript pagina impostazioni
└── templates/
    ├── index.html            # Pagina principale
    └── settings.html         # Pagina impostazioni
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

# Backup manuale del database
cp /home/davide/GIT/vibe-ricettario/recipe_book.db ~/recipe_book_backup.db
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
cp /home/davide/GIT/vibe-ricettario/recipe_book.db ~/recipe_book_backup_$(date +%Y%m%d).db

# Ripristino
cp ~/recipe_book_backup_YYYYMMDD.db /home/davide/GIT/vibe-ricettario/recipe_book.db
sudo systemctl restart vibe-ricettario
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
journalctl -u vibe-ricettario -f

# Verifica le dipendenze
pip3 install -r requirements.txt

# Prova ad avviare manualmente
cd /home/davide/GIT/vibe-ricettario
python3 app.py
```

### Database corrotto
```bash
# Elimina e ricrea (perderai i dati!)
rm /home/davide/GIT/vibe-ricettario/recipe_book.db
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
