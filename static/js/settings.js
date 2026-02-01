/**
 * Recipe Book - Settings Page JavaScript
 * Handles settings UI and data management
 */

// ============================================
// State
// ============================================

let settings = {};
let units = [];
let categories = [];

// ============================================
// DOM Elements
// ============================================

const elements = {
    themeToggle: document.getElementById('themeToggle'),
    fontSelect: document.getElementById('fontSelect'),
    spacingSelect: document.getElementById('spacingSelect'),
    dateFormatSelect: document.getElementById('dateFormatSelect'),
    unitsList: document.getElementById('unitsList'),
    newUnitName: document.getElementById('newUnitName'),
    newUnitAbbr: document.getElementById('newUnitAbbr'),
    addUnitBtn: document.getElementById('addUnitBtn'),
    categoriesList: document.getElementById('categoriesList'),
    newCategoryName: document.getElementById('newCategoryName'),
    addCategoryBtn: document.getElementById('addCategoryBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importInput: document.getElementById('importInput'),
    toastContainer: document.getElementById('toastContainer')
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadUnits();
    await loadCategories();
    applySettings();
    renderUI();
    setupEventListeners();
});

// ============================================
// API Functions
// ============================================

async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showToast('Errore di connessione', 'error');
        throw error;
    }
}

async function loadSettings() {
    settings = await apiCall('/api/settings');
}

async function saveSettings() {
    await apiCall('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
    });
}

async function loadUnits() {
    units = await apiCall('/api/units');
}

async function loadCategories() {
    categories = await apiCall('/api/categories');
}

// ============================================
// Settings Application
// ============================================

function applySettings() {
    document.documentElement.setAttribute('data-theme', settings.theme || 'light');
    document.documentElement.setAttribute('data-font', settings.font || 'sans-serif');
    document.documentElement.setAttribute('data-spacing', settings.spacing || 'comfortable');
}

// ============================================
// UI Rendering
// ============================================

function renderUI() {
    // Theme toggle
    elements.themeToggle.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === settings.theme);
    });
    
    // Selects
    elements.fontSelect.value = settings.font || 'sans-serif';
    elements.spacingSelect.value = settings.spacing || 'comfortable';
    elements.dateFormatSelect.value = settings.date_format || 'DD/MM/YYYY';
    
    // Units
    renderUnits();
    
    // Categories
    renderCategories();
}

function renderUnits() {
    elements.unitsList.innerHTML = units.map(unit => `
        <span class="unit-tag">
            ${escapeHtml(unit.name)} (${escapeHtml(unit.abbreviation)})
            <button onclick="deleteUnit(${unit.id})" aria-label="Elimina">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </span>
    `).join('');
}

function renderCategories() {
    elements.categoriesList.innerHTML = categories.map(cat => `
        <span class="category-tag">
            ${escapeHtml(cat.name)}
            <button onclick="deleteCategory(${cat.id})" aria-label="Elimina">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </span>
    `).join('');
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            settings.theme = btn.dataset.theme;
            applySettings();
            renderUI();
            await saveSettings();
            showToast('Tema aggiornato', 'success');
        });
    });
    
    // Font select
    elements.fontSelect.addEventListener('change', async () => {
        settings.font = elements.fontSelect.value;
        applySettings();
        await saveSettings();
        showToast('Font aggiornato', 'success');
    });
    
    // Spacing select
    elements.spacingSelect.addEventListener('change', async () => {
        settings.spacing = elements.spacingSelect.value;
        applySettings();
        await saveSettings();
        showToast('Spaziatura aggiornata', 'success');
    });
    
    // Date format select
    elements.dateFormatSelect.addEventListener('change', async () => {
        settings.date_format = elements.dateFormatSelect.value;
        await saveSettings();
        showToast('Formato data aggiornato', 'success');
    });
    
    // Add unit
    elements.addUnitBtn.addEventListener('click', addUnit);
    elements.newUnitAbbr.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addUnit();
    });
    
    // Add category
    elements.addCategoryBtn.addEventListener('click', addCategory);
    elements.newCategoryName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCategory();
    });
    
    // Export
    elements.exportBtn.addEventListener('click', exportData);
    
    // Import
    elements.importBtn.addEventListener('click', () => {
        elements.importInput.click();
    });
    elements.importInput.addEventListener('change', importData);
}

// ============================================
// Units Management
// ============================================

async function addUnit() {
    const name = elements.newUnitName.value.trim();
    const abbreviation = elements.newUnitAbbr.value.trim();
    
    if (!name || !abbreviation) {
        showToast('Inserisci nome e abbreviazione', 'error');
        return;
    }
    
    try {
        const result = await apiCall('/api/units', {
            method: 'POST',
            body: JSON.stringify({ name, abbreviation })
        });
        
        if (result.id) {
            units.push({ id: result.id, name, abbreviation });
            renderUnits();
            elements.newUnitName.value = '';
            elements.newUnitAbbr.value = '';
            showToast('Unità aggiunta', 'success');
        } else {
            showToast(result.error || 'Errore', 'error');
        }
    } catch (error) {
        showToast('Errore durante l\'aggiunta', 'error');
    }
}

async function deleteUnit(id) {
    try {
        await apiCall(`/api/units/${id}`, { method: 'DELETE' });
        units = units.filter(u => u.id !== id);
        renderUnits();
        showToast('Unità eliminata', 'success');
    } catch (error) {
        showToast('Errore durante l\'eliminazione', 'error');
    }
}

// ============================================
// Categories Management
// ============================================

async function addCategory() {
    const name = elements.newCategoryName.value.trim();
    
    if (!name) {
        showToast('Inserisci il nome della categoria', 'error');
        return;
    }
    
    try {
        const result = await apiCall('/api/categories', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        
        if (result.id) {
            categories.push({ id: result.id, name });
            renderCategories();
            elements.newCategoryName.value = '';
            showToast('Categoria aggiunta', 'success');
        } else {
            showToast(result.error || 'Errore', 'error');
        }
    } catch (error) {
        showToast('Errore durante l\'aggiunta', 'error');
    }
}

async function deleteCategory(id) {
    try {
        await apiCall(`/api/categories/${id}`, { method: 'DELETE' });
        categories = categories.filter(c => c.id !== id);
        renderCategories();
        showToast('Categoria eliminata', 'success');
    } catch (error) {
        showToast('Errore durante l\'eliminazione', 'error');
    }
}

// ============================================
// Import/Export
// ============================================

async function exportData() {
    try {
        const data = await apiCall('/api/export');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ricettario_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Esportazione completata', 'success');
    } catch (error) {
        showToast('Errore durante l\'esportazione', 'error');
    }
}

async function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        const result = await apiCall('/api/import', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (result.message) {
            // Reload data
            await loadSettings();
            await loadUnits();
            await loadCategories();
            applySettings();
            renderUI();
            showToast('Importazione completata', 'success');
        } else {
            showToast(result.error || 'Errore durante l\'importazione', 'error');
        }
    } catch (error) {
        showToast('File non valido', 'error');
    }
    
    // Reset input
    e.target.value = '';
}

// ============================================
// Utility Functions
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make functions available globally
window.deleteUnit = deleteUnit;
window.deleteCategory = deleteCategory;
