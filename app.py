"""
Recipe Book - A personal recipe management web application
Flask application with SQLite database
"""

import os
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for
from werkzeug.utils import secure_filename
from database import Database

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

db = Database()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ============== PAGE ROUTES ==============

@app.route('/')
def index():
    """Main page - recipe book interface"""
    return render_template('index.html')


@app.route('/settings')
def settings_page():
    """Settings page"""
    return render_template('settings.html')


# ============== API ROUTES - RECIPES ==============

@app.route('/api/recipes', methods=['GET'])
def get_recipes():
    """Get all recipes (summary for sidebar)"""
    recipes = db.get_all_recipes()
    return jsonify(recipes)


@app.route('/api/recipes/<int:recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    """Get full recipe details"""
    recipe = db.get_recipe(recipe_id)
    if recipe:
        return jsonify(recipe)
    return jsonify({'error': 'Ricetta non trovata'}), 404


@app.route('/api/recipes', methods=['POST'])
def create_recipe():
    """Create a new recipe"""
    data = request.json
    recipe_id = db.create_recipe(data)
    return jsonify({'id': recipe_id, 'message': 'Ricetta creata con successo'})


@app.route('/api/recipes/<int:recipe_id>', methods=['PUT'])
def update_recipe(recipe_id):
    """Update an existing recipe"""
    data = request.json
    success = db.update_recipe(recipe_id, data)
    if success:
        return jsonify({'message': 'Ricetta aggiornata con successo'})
    return jsonify({'error': 'Ricetta non trovata'}), 404


@app.route('/api/recipes/<int:recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    """Delete a recipe"""
    success = db.delete_recipe(recipe_id)
    if success:
        return jsonify({'message': 'Ricetta eliminata con successo'})
    return jsonify({'error': 'Ricetta non trovata'}), 404


@app.route('/api/recipes/<int:recipe_id>/quantities', methods=['PUT'])
def update_quantities(recipe_id):
    """Update last-used quantities for a recipe"""
    data = request.json
    success = db.update_ingredient_quantities(recipe_id, data.get('ingredients', []))
    if success:
        return jsonify({'message': 'Quantità aggiornate'})
    return jsonify({'error': 'Errore durante l\'aggiornamento'}), 400


# ============== API ROUTES - PHOTO UPLOAD ==============

@app.route('/api/upload', methods=['POST'])
def upload_photo():
    """Upload a recipe photo"""
    if 'photo' not in request.files:
        return jsonify({'error': 'Nessun file caricato'}), 400
    
    file = request.files['photo']
    if file.filename == '':
        return jsonify({'error': 'Nessun file selezionato'}), 400
    
    if file and allowed_file(file.filename):
        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{secure_filename(file.filename)}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return jsonify({'filename': filename, 'url': f'/uploads/{filename}'})
    
    return jsonify({'error': 'Tipo di file non consentito'}), 400


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# ============== API ROUTES - CATEGORIES ==============

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    categories = db.get_all_categories()
    return jsonify(categories)


@app.route('/api/categories', methods=['POST'])
def create_category():
    """Create a new category"""
    data = request.json
    category_id = db.create_category(data.get('name', ''))
    if category_id:
        return jsonify({'id': category_id, 'message': 'Categoria creata'})
    return jsonify({'error': 'Errore durante la creazione'}), 400


@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    """Delete a category"""
    success = db.delete_category(category_id)
    if success:
        return jsonify({'message': 'Categoria eliminata'})
    return jsonify({'error': 'Categoria non trovata'}), 404


# ============== API ROUTES - UNITS ==============

@app.route('/api/units', methods=['GET'])
def get_units():
    """Get all units"""
    units = db.get_all_units()
    return jsonify(units)


@app.route('/api/units', methods=['POST'])
def create_unit():
    """Create a new unit"""
    data = request.json
    unit_id = db.create_unit(data.get('name', ''), data.get('abbreviation', ''))
    if unit_id:
        return jsonify({'id': unit_id, 'message': 'Unità creata'})
    return jsonify({'error': 'Errore durante la creazione'}), 400


@app.route('/api/units/<int:unit_id>', methods=['DELETE'])
def delete_unit(unit_id):
    """Delete a unit"""
    success = db.delete_unit(unit_id)
    if success:
        return jsonify({'message': 'Unità eliminata'})
    return jsonify({'error': 'Unità non trovata'}), 404


# ============== API ROUTES - SETTINGS ==============

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get application settings"""
    settings = db.get_settings()
    return jsonify(settings)


@app.route('/api/settings', methods=['PUT'])
def update_settings():
    """Update application settings"""
    data = request.json
    success = db.update_settings(data)
    if success:
        return jsonify({'message': 'Impostazioni salvate'})
    return jsonify({'error': 'Errore durante il salvataggio'}), 400


# ============== API ROUTES - IMPORT/EXPORT ==============

@app.route('/api/export', methods=['GET'])
def export_recipes():
    """Export all recipes as JSON"""
    data = db.export_all_data()
    return jsonify(data)


@app.route('/api/import', methods=['POST'])
def import_recipes():
    """Import recipes from JSON"""
    if 'file' in request.files:
        file = request.files['file']
        if file.filename.endswith('.json'):
            data = json.load(file)
            success = db.import_data(data)
            if success:
                return jsonify({'message': 'Importazione completata'})
            return jsonify({'error': 'Errore durante l\'importazione'}), 400
    elif request.json:
        success = db.import_data(request.json)
        if success:
            return jsonify({'message': 'Importazione completata'})
        return jsonify({'error': 'Errore durante l\'importazione'}), 400
    
    return jsonify({'error': 'Nessun dato da importare'}), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
