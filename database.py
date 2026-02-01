"""
Database module for Recipe Book
SQLite database with all CRUD operations
"""

import sqlite3
import json
import os
from datetime import datetime
from contextlib import contextmanager

DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'recipe_book.db')


class Database:
    def __init__(self):
        self.db_path = DATABASE_PATH
        self.init_database()
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def init_database(self):
        """Initialize database tables and default data"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Settings table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
            ''')
            
            # Categories table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE
                )
            ''')
            
            # Units table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS units (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    abbreviation TEXT NOT NULL UNIQUE
                )
            ''')
            
            # Recipes table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS recipes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    creation_date DATE,
                    preparation_time INTEGER,
                    photo_url TEXT,
                    category_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
                )
            ''')
            
            # Ingredient subsections table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS ingredient_subsections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    recipe_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    sort_order INTEGER DEFAULT 0,
                    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
                )
            ''')
            
            # Ingredients table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS ingredients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    subsection_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    original_quantity REAL,
                    current_quantity REAL,
                    unit TEXT,
                    sort_order INTEGER DEFAULT 0,
                    FOREIGN KEY (subsection_id) REFERENCES ingredient_subsections(id) ON DELETE CASCADE
                )
            ''')
            
            # Preparation steps table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS preparation_steps (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    recipe_id INTEGER NOT NULL,
                    step_number INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
                )
            ''')
            
            # Insert default settings if not exist
            default_settings = {
                'theme': 'light',
                'font': 'sans-serif',
                'date_format': 'DD/MM/YYYY',
                'spacing': 'comfortable',
                'language': 'it'
            }
            for key, value in default_settings.items():
                cursor.execute('''
                    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
                ''', (key, value))
            
            # Insert default categories
            default_categories = [
                'Antipasti', 'Primi Piatti', 'Secondi Piatti', 'Contorni',
                'Dolci', 'Bevande', 'Colazione', 'Snack', 'Salse', 'Pane e Lievitati'
            ]
            for cat in default_categories:
                cursor.execute('INSERT OR IGNORE INTO categories (name) VALUES (?)', (cat,))
            
            # Insert default units
            default_units = [
                ('grammi', 'g'),
                ('chilogrammi', 'kg'),
                ('millilitri', 'ml'),
                ('litri', 'L'),
                ('cucchiaino', 'cucchiaino'),
                ('cucchiaio', 'cucchiaio'),
                ('tazza', 'tazza'),
                ('pezzi', 'pz'),
                ('fette', 'fette'),
                ('spicchi', 'spicchi'),
                ('pizzico', 'pizzico'),
                ('q.b.', 'q.b.'),
                ('unità', 'unità'),
                ('mazzetto', 'mazzetto'),
                ('foglie', 'foglie'),
                ('rametti', 'rametti')
            ]
            for name, abbr in default_units:
                cursor.execute('INSERT OR IGNORE INTO units (name, abbreviation) VALUES (?, ?)', (name, abbr))
    
    # ============== RECIPES ==============
    
    def get_all_recipes(self):
        """Get all recipes summary for sidebar"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT r.id, r.name, r.description, r.creation_date, r.preparation_time,
                       r.photo_url, r.category_id, c.name as category_name
                FROM recipes r
                LEFT JOIN categories c ON r.category_id = c.id
                ORDER BY r.name
            ''')
            recipes = []
            for row in cursor.fetchall():
                recipes.append(dict(row))
            return recipes
    
    def get_recipe(self, recipe_id):
        """Get full recipe details"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get recipe
            cursor.execute('''
                SELECT r.*, c.name as category_name
                FROM recipes r
                LEFT JOIN categories c ON r.category_id = c.id
                WHERE r.id = ?
            ''', (recipe_id,))
            row = cursor.fetchone()
            if not row:
                return None
            
            recipe = dict(row)
            
            # Get ingredient subsections with ingredients
            cursor.execute('''
                SELECT * FROM ingredient_subsections
                WHERE recipe_id = ?
                ORDER BY sort_order
            ''', (recipe_id,))
            subsections = []
            for sub_row in cursor.fetchall():
                subsection = dict(sub_row)
                cursor.execute('''
                    SELECT * FROM ingredients
                    WHERE subsection_id = ?
                    ORDER BY sort_order
                ''', (subsection['id'],))
                subsection['ingredients'] = [dict(ing) for ing in cursor.fetchall()]
                subsections.append(subsection)
            recipe['subsections'] = subsections
            
            # Get preparation steps
            cursor.execute('''
                SELECT * FROM preparation_steps
                WHERE recipe_id = ?
                ORDER BY step_number
            ''', (recipe_id,))
            recipe['steps'] = [dict(step) for step in cursor.fetchall()]
            
            return recipe
    
    def create_recipe(self, data):
        """Create a new recipe"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Insert recipe
            creation_date = data.get('creation_date', datetime.now().strftime('%Y-%m-%d'))
            cursor.execute('''
                INSERT INTO recipes (name, description, creation_date, preparation_time, photo_url, category_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                data.get('name', ''),
                data.get('description', ''),
                creation_date,
                data.get('preparation_time'),
                data.get('photo_url'),
                data.get('category_id')
            ))
            recipe_id = cursor.lastrowid
            
            # Insert subsections and ingredients
            for idx, subsection in enumerate(data.get('subsections', [])):
                cursor.execute('''
                    INSERT INTO ingredient_subsections (recipe_id, name, sort_order)
                    VALUES (?, ?, ?)
                ''', (recipe_id, subsection.get('name', ''), idx))
                subsection_id = cursor.lastrowid
                
                for ing_idx, ingredient in enumerate(subsection.get('ingredients', [])):
                    quantity = ingredient.get('quantity')
                    cursor.execute('''
                        INSERT INTO ingredients (subsection_id, name, original_quantity, current_quantity, unit, sort_order)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (
                        subsection_id,
                        ingredient.get('name', ''),
                        quantity,
                        quantity,
                        ingredient.get('unit', ''),
                        ing_idx
                    ))
            
            # Insert preparation steps
            for idx, step in enumerate(data.get('steps', [])):
                cursor.execute('''
                    INSERT INTO preparation_steps (recipe_id, step_number, description)
                    VALUES (?, ?, ?)
                ''', (recipe_id, idx + 1, step.get('description', '')))
            
            return recipe_id
    
    def update_recipe(self, recipe_id, data):
        """Update an existing recipe"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if recipe exists
            cursor.execute('SELECT id FROM recipes WHERE id = ?', (recipe_id,))
            if not cursor.fetchone():
                return False
            
            # Update recipe
            cursor.execute('''
                UPDATE recipes
                SET name = ?, description = ?, creation_date = ?, preparation_time = ?,
                    photo_url = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (
                data.get('name', ''),
                data.get('description', ''),
                data.get('creation_date'),
                data.get('preparation_time'),
                data.get('photo_url'),
                data.get('category_id'),
                recipe_id
            ))
            
            # Delete existing subsections and ingredients (cascade)
            cursor.execute('DELETE FROM ingredient_subsections WHERE recipe_id = ?', (recipe_id,))
            
            # Insert new subsections and ingredients
            for idx, subsection in enumerate(data.get('subsections', [])):
                cursor.execute('''
                    INSERT INTO ingredient_subsections (recipe_id, name, sort_order)
                    VALUES (?, ?, ?)
                ''', (recipe_id, subsection.get('name', ''), idx))
                subsection_id = cursor.lastrowid
                
                for ing_idx, ingredient in enumerate(subsection.get('ingredients', [])):
                    original_qty = ingredient.get('original_quantity', ingredient.get('quantity'))
                    current_qty = ingredient.get('current_quantity', ingredient.get('quantity'))
                    cursor.execute('''
                        INSERT INTO ingredients (subsection_id, name, original_quantity, current_quantity, unit, sort_order)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (
                        subsection_id,
                        ingredient.get('name', ''),
                        original_qty,
                        current_qty,
                        ingredient.get('unit', ''),
                        ing_idx
                    ))
            
            # Delete existing steps
            cursor.execute('DELETE FROM preparation_steps WHERE recipe_id = ?', (recipe_id,))
            
            # Insert new steps
            for idx, step in enumerate(data.get('steps', [])):
                cursor.execute('''
                    INSERT INTO preparation_steps (recipe_id, step_number, description)
                    VALUES (?, ?, ?)
                ''', (recipe_id, idx + 1, step.get('description', '')))
            
            return True
    
    def delete_recipe(self, recipe_id):
        """Delete a recipe"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM recipes WHERE id = ?', (recipe_id,))
            return cursor.rowcount > 0
    
    def update_ingredient_quantities(self, recipe_id, ingredients_data):
        """Update current quantities for ingredients"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            for ing in ingredients_data:
                cursor.execute('''
                    UPDATE ingredients
                    SET current_quantity = ?
                    WHERE id = ?
                ''', (ing.get('current_quantity'), ing.get('id')))
            return True
    
    # ============== CATEGORIES ==============
    
    def get_all_categories(self):
        """Get all categories"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM categories ORDER BY name')
            return [dict(row) for row in cursor.fetchall()]
    
    def create_category(self, name):
        """Create a new category"""
        if not name:
            return None
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute('INSERT INTO categories (name) VALUES (?)', (name,))
                return cursor.lastrowid
            except sqlite3.IntegrityError:
                return None
    
    def delete_category(self, category_id):
        """Delete a category"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM categories WHERE id = ?', (category_id,))
            return cursor.rowcount > 0
    
    # ============== UNITS ==============
    
    def get_all_units(self):
        """Get all units"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM units ORDER BY name')
            return [dict(row) for row in cursor.fetchall()]
    
    def create_unit(self, name, abbreviation):
        """Create a new unit"""
        if not name or not abbreviation:
            return None
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute('INSERT INTO units (name, abbreviation) VALUES (?, ?)', (name, abbreviation))
                return cursor.lastrowid
            except sqlite3.IntegrityError:
                return None
    
    def delete_unit(self, unit_id):
        """Delete a unit"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM units WHERE id = ?', (unit_id,))
            return cursor.rowcount > 0
    
    # ============== SETTINGS ==============
    
    def get_settings(self):
        """Get all settings"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM settings')
            settings = {}
            for row in cursor.fetchall():
                settings[row['key']] = row['value']
            return settings
    
    def update_settings(self, settings_dict):
        """Update settings"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            for key, value in settings_dict.items():
                cursor.execute('''
                    INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
                ''', (key, value))
            return True
    
    # ============== IMPORT/EXPORT ==============
    
    def export_all_data(self):
        """Export all data for backup"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Export recipes with full details
            recipes = []
            cursor.execute('SELECT * FROM recipes')
            for recipe_row in cursor.fetchall():
                recipe = dict(recipe_row)
                recipe_id = recipe['id']
                
                # Get subsections and ingredients
                cursor.execute('SELECT * FROM ingredient_subsections WHERE recipe_id = ? ORDER BY sort_order', (recipe_id,))
                subsections = []
                for sub_row in cursor.fetchall():
                    subsection = dict(sub_row)
                    cursor.execute('SELECT * FROM ingredients WHERE subsection_id = ? ORDER BY sort_order', (subsection['id'],))
                    subsection['ingredients'] = [dict(ing) for ing in cursor.fetchall()]
                    subsections.append(subsection)
                recipe['subsections'] = subsections
                
                # Get steps
                cursor.execute('SELECT * FROM preparation_steps WHERE recipe_id = ? ORDER BY step_number', (recipe_id,))
                recipe['steps'] = [dict(step) for step in cursor.fetchall()]
                
                recipes.append(recipe)
            
            # Export categories
            cursor.execute('SELECT * FROM categories')
            categories = [dict(row) for row in cursor.fetchall()]
            
            # Export units
            cursor.execute('SELECT * FROM units')
            units = [dict(row) for row in cursor.fetchall()]
            
            # Export settings
            settings = self.get_settings()
            
            return {
                'version': '1.0',
                'exported_at': datetime.now().isoformat(),
                'recipes': recipes,
                'categories': categories,
                'units': units,
                'settings': settings
            }
    
    def import_data(self, data):
        """Import data from backup"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Import categories
                for cat in data.get('categories', []):
                    cursor.execute('INSERT OR IGNORE INTO categories (name) VALUES (?)', (cat.get('name'),))
                
                # Import units
                for unit in data.get('units', []):
                    cursor.execute('INSERT OR IGNORE INTO units (name, abbreviation) VALUES (?, ?)',
                                   (unit.get('name'), unit.get('abbreviation')))
                
                # Import settings
                for key, value in data.get('settings', {}).items():
                    cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (key, value))
                
                # Import recipes
                for recipe in data.get('recipes', []):
                    # Check if recipe with same name exists
                    cursor.execute('SELECT id FROM recipes WHERE name = ?', (recipe.get('name'),))
                    existing = cursor.fetchone()
                    
                    if existing:
                        # Update existing recipe
                        recipe_id = existing['id']
                        cursor.execute('''
                            UPDATE recipes SET description = ?, creation_date = ?, preparation_time = ?,
                            photo_url = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                        ''', (
                            recipe.get('description'),
                            recipe.get('creation_date'),
                            recipe.get('preparation_time'),
                            recipe.get('photo_url'),
                            recipe.get('category_id'),
                            recipe_id
                        ))
                        cursor.execute('DELETE FROM ingredient_subsections WHERE recipe_id = ?', (recipe_id,))
                        cursor.execute('DELETE FROM preparation_steps WHERE recipe_id = ?', (recipe_id,))
                    else:
                        # Insert new recipe
                        cursor.execute('''
                            INSERT INTO recipes (name, description, creation_date, preparation_time, photo_url, category_id)
                            VALUES (?, ?, ?, ?, ?, ?)
                        ''', (
                            recipe.get('name'),
                            recipe.get('description'),
                            recipe.get('creation_date'),
                            recipe.get('preparation_time'),
                            recipe.get('photo_url'),
                            recipe.get('category_id')
                        ))
                        recipe_id = cursor.lastrowid
                    
                    # Insert subsections and ingredients
                    for idx, subsection in enumerate(recipe.get('subsections', [])):
                        cursor.execute('''
                            INSERT INTO ingredient_subsections (recipe_id, name, sort_order)
                            VALUES (?, ?, ?)
                        ''', (recipe_id, subsection.get('name', ''), idx))
                        subsection_id = cursor.lastrowid
                        
                        for ing_idx, ingredient in enumerate(subsection.get('ingredients', [])):
                            cursor.execute('''
                                INSERT INTO ingredients (subsection_id, name, original_quantity, current_quantity, unit, sort_order)
                                VALUES (?, ?, ?, ?, ?, ?)
                            ''', (
                                subsection_id,
                                ingredient.get('name', ''),
                                ingredient.get('original_quantity'),
                                ingredient.get('current_quantity', ingredient.get('original_quantity')),
                                ingredient.get('unit', ''),
                                ing_idx
                            ))
                    
                    # Insert steps
                    for idx, step in enumerate(recipe.get('steps', [])):
                        cursor.execute('''
                            INSERT INTO preparation_steps (recipe_id, step_number, description)
                            VALUES (?, ?, ?)
                        ''', (recipe_id, idx + 1, step.get('description', '')))
            
            return True
        except Exception as e:
            print(f"Import error: {e}")
            return False
