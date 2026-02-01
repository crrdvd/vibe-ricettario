/**
 * Recipe Book - Main Application JavaScript
 * Handles all UI interactions, API calls, and state management
 */

// ============================================
// State Management
// ============================================

const state = {
    recipes: [],
    categories: [],
    units: [],
    settings: {},
    currentRecipeId: null,
    isEditing: false,
    editingRecipeId: null
};

// ============================================
// DOM Elements
// ============================================

const elements = {
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    openSidebar: document.getElementById('openSidebar'),
    closeSidebar: document.getElementById('closeSidebar'),
    searchInput: document.getElementById('searchInput'),
    categoryFilter: document.getElementById('categoryFilter'),
    recipeList: document.getElementById('recipeList'),
    addRecipeBtn: document.getElementById('addRecipeBtn'),
    
    // Main Content
    mainContent: document.getElementById('mainContent'),
    mobileTitle: document.getElementById('mobileTitle'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    welcomeAddBtn: document.getElementById('welcomeAddBtn'),
    
    // Recipe View
    recipeView: document.getElementById('recipeView'),
    recipePhoto: document.getElementById('recipePhoto'),
    recipePhotoPlaceholder: document.getElementById('recipePhotoPlaceholder'),
    recipeCategory: document.getElementById('recipeCategory'),
    recipeTitle: document.getElementById('recipeTitle'),
    recipeDescription: document.getElementById('recipeDescription'),
    recipeDate: document.getElementById('recipeDate'),
    recipeTime: document.getElementById('recipeTime'),
    ingredientsList: document.getElementById('ingredientsList'),
    preparationSteps: document.getElementById('preparationSteps'),
    editRecipeBtn: document.getElementById('editRecipeBtn'),
    deleteRecipeBtn: document.getElementById('deleteRecipeBtn'),
    
    // Recipe Edit
    recipeEdit: document.getElementById('recipeEdit'),
    recipeForm: document.getElementById('recipeForm'),
    formTitle: document.getElementById('formTitle'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    recipeName: document.getElementById('recipeName'),
    recipeDesc: document.getElementById('recipeDesc'),
    recipeCategorySelect: document.getElementById('recipeCategorySelect'),
    recipeCreationDate: document.getElementById('recipeCreationDate'),
    recipePrepTime: document.getElementById('recipePrepTime'),
    photoUpload: document.getElementById('photoUpload'),
    photoInput: document.getElementById('photoInput'),
    photoPreview: document.getElementById('photoPreview'),
    photoPreviewImg: document.getElementById('photoPreviewImg'),
    photoPlaceholder: document.getElementById('photoPlaceholder'),
    removePhotoBtn: document.getElementById('removePhotoBtn'),
    photoUrl: document.getElementById('photoUrl'),
    subsectionsContainer: document.getElementById('subsectionsContainer'),
    addSubsectionBtn: document.getElementById('addSubsectionBtn'),
    stepsContainer: document.getElementById('stepsContainer'),
    addStepBtn: document.getElementById('addStepBtn'),
    
    // Modal
    deleteModal: document.getElementById('deleteModal'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    applySettings();
    await loadCategories();
    await loadUnits();
    await loadRecipes();
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
    state.settings = await apiCall('/api/settings');
}

async function loadCategories() {
    state.categories = await apiCall('/api/categories');
    renderCategoryFilter();
    renderCategorySelect();
}

async function loadUnits() {
    state.units = await apiCall('/api/units');
}

async function loadRecipes() {
    state.recipes = await apiCall('/api/recipes');
    renderRecipeList();
}

async function loadRecipe(id) {
    return await apiCall(`/api/recipes/${id}`);
}

async function saveRecipe(data) {
    if (state.editingRecipeId) {
        return await apiCall(`/api/recipes/${state.editingRecipeId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    } else {
        return await apiCall('/api/recipes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

async function deleteRecipe(id) {
    return await apiCall(`/api/recipes/${id}`, {
        method: 'DELETE'
    });
}

async function updateQuantities(recipeId, ingredients) {
    return await apiCall(`/api/recipes/${recipeId}/quantities`, {
        method: 'PUT',
        body: JSON.stringify({ ingredients })
    });
}

async function uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    return await response.json();
}

// ============================================
// Settings
// ============================================

function applySettings() {
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'light');
    document.documentElement.setAttribute('data-font', state.settings.font || 'sans-serif');
    document.documentElement.setAttribute('data-spacing', state.settings.spacing || 'comfortable');
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    // Sidebar toggle (mobile)
    elements.openSidebar.addEventListener('click', () => {
        elements.sidebar.classList.add('open');
    });
    
    elements.closeSidebar.addEventListener('click', () => {
        elements.sidebar.classList.remove('open');
    });
    
    // Search and filter
    elements.searchInput.addEventListener('input', renderRecipeList);
    elements.categoryFilter.addEventListener('change', renderRecipeList);
    
    // Add recipe buttons
    elements.addRecipeBtn.addEventListener('click', showNewRecipeForm);
    elements.welcomeAddBtn.addEventListener('click', showNewRecipeForm);
    
    // Edit/Delete buttons
    elements.editRecipeBtn.addEventListener('click', () => {
        if (state.currentRecipeId) {
            showEditRecipeForm(state.currentRecipeId);
        }
    });
    
    elements.deleteRecipeBtn.addEventListener('click', () => {
        elements.deleteModal.classList.remove('hidden');
    });
    
    // Form events
    elements.recipeForm.addEventListener('submit', handleFormSubmit);
    elements.cancelEditBtn.addEventListener('click', cancelEdit);
    
    // Photo upload
    elements.photoUpload.addEventListener('click', () => {
        elements.photoInput.click();
    });
    
    elements.photoInput.addEventListener('change', handlePhotoUpload);
    
    elements.removePhotoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removePhoto();
    });
    
    // Subsections and steps
    elements.addSubsectionBtn.addEventListener('click', addSubsection);
    elements.addStepBtn.addEventListener('click', addStep);
    
    // Delete modal
    elements.cancelDeleteBtn.addEventListener('click', () => {
        elements.deleteModal.classList.add('hidden');
    });
    
    elements.confirmDeleteBtn.addEventListener('click', handleDeleteRecipe);
    
    // Close modal on backdrop click
    elements.deleteModal.querySelector('.modal-backdrop').addEventListener('click', () => {
        elements.deleteModal.classList.add('hidden');
    });
}

// ============================================
// Rendering Functions
// ============================================

function renderCategoryFilter() {
    elements.categoryFilter.innerHTML = '<option value="">Tutte le categorie</option>';
    state.categories.forEach(cat => {
        elements.categoryFilter.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

function renderCategorySelect() {
    elements.recipeCategorySelect.innerHTML = '<option value="">Nessuna categoria</option>';
    state.categories.forEach(cat => {
        elements.recipeCategorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

function renderRecipeList() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const categoryId = elements.categoryFilter.value;
    
    const filtered = state.recipes.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(searchTerm) ||
                            (recipe.description && recipe.description.toLowerCase().includes(searchTerm));
        const matchesCategory = !categoryId || recipe.category_id == categoryId;
        return matchesSearch && matchesCategory;
    });
    
    if (filtered.length === 0) {
        elements.recipeList.innerHTML = `
            <div class="recipe-list-empty" style="padding: 2rem; text-align: center; color: var(--text-tertiary);">
                <p>Nessuna ricetta trovata</p>
            </div>
        `;
        return;
    }
    
    elements.recipeList.innerHTML = filtered.map(recipe => `
        <div class="recipe-list-item ${recipe.id === state.currentRecipeId ? 'active' : ''}" 
             data-id="${recipe.id}">
            ${recipe.photo_url 
                ? `<img src="${recipe.photo_url}" alt="" class="recipe-list-thumb">`
                : `<div class="recipe-list-thumb-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                   </div>`
            }
            <div class="recipe-list-info">
                <div class="recipe-list-name">${escapeHtml(recipe.name)}</div>
                <div class="recipe-list-category">${recipe.category_name || 'Senza categoria'}</div>
            </div>
        </div>
    `).join('');
    
    // Add click listeners
    elements.recipeList.querySelectorAll('.recipe-list-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            showRecipe(id);
            elements.sidebar.classList.remove('open');
        });
    });
}

async function showRecipe(id) {
    state.currentRecipeId = id;
    state.isEditing = false;
    
    const recipe = await loadRecipe(id);
    if (!recipe) return;
    
    // Update mobile title
    elements.mobileTitle.textContent = recipe.name;
    
    // Show recipe view
    elements.welcomeScreen.classList.add('hidden');
    elements.recipeEdit.classList.add('hidden');
    elements.recipeView.classList.remove('hidden');
    
    // Photo
    if (recipe.photo_url) {
        elements.recipePhoto.src = recipe.photo_url;
        elements.recipePhoto.classList.remove('hidden');
        elements.recipePhotoPlaceholder.classList.add('hidden');
    } else {
        elements.recipePhoto.classList.add('hidden');
        elements.recipePhotoPlaceholder.classList.remove('hidden');
    }
    
    // Category
    if (recipe.category_name) {
        elements.recipeCategory.textContent = recipe.category_name;
        elements.recipeCategory.classList.remove('hidden');
    } else {
        elements.recipeCategory.classList.add('hidden');
    }
    
    // Basic info
    elements.recipeTitle.textContent = recipe.name;
    elements.recipeDescription.textContent = recipe.description || '';
    
    // Meta
    elements.recipeDate.querySelector('span').textContent = formatDate(recipe.creation_date);
    if (recipe.preparation_time) {
        elements.recipeTime.querySelector('span').textContent = `${recipe.preparation_time} min`;
        elements.recipeTime.classList.remove('hidden');
    } else {
        elements.recipeTime.classList.add('hidden');
    }
    
    // Ingredients
    renderIngredients(recipe);
    
    // Steps
    renderSteps(recipe.steps);
    
    // Update sidebar
    renderRecipeList();
}

function renderIngredients(recipe) {
    elements.ingredientsList.innerHTML = recipe.subsections.map(subsection => `
        <div class="ingredient-subsection">
            <h3 class="subsection-title">${escapeHtml(subsection.name)}</h3>
            <div class="ingredient-list">
                ${subsection.ingredients.map(ing => `
                    <div class="ingredient-item" data-id="${ing.id}" data-original="${ing.original_quantity}">
                        <div class="ingredient-quantity">
                            <input type="number" 
                                   value="${ing.current_quantity || ''}" 
                                   step="any"
                                   min="0"
                                   data-ingredient-id="${ing.id}"
                                   class="ingredient-qty-input">
                            <span class="ingredient-unit">${escapeHtml(ing.unit || '')}</span>
                        </div>
                        <span class="ingredient-name">${escapeHtml(ing.name)}</span>
                        ${ing.current_quantity != ing.original_quantity && ing.original_quantity 
                            ? `<span class="ingredient-original">(originale: ${ing.original_quantity} ${escapeHtml(ing.unit || '')})</span>`
                            : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    // Add quantity change listeners
    elements.ingredientsList.querySelectorAll('.ingredient-qty-input').forEach(input => {
        input.addEventListener('change', handleQuantityChange);
    });
}

function renderSteps(steps) {
    elements.preparationSteps.innerHTML = steps.map((step, index) => `
        <li class="preparation-step">
            <span class="step-number">${index + 1}</span>
            <p class="step-content">${escapeHtml(step.description)}</p>
        </li>
    `).join('');
}

// ============================================
// Quantity Scaling
// ============================================

async function handleQuantityChange(e) {
    const input = e.target;
    const ingredientId = parseInt(input.dataset.ingredientId);
    const newQuantity = parseFloat(input.value) || 0;
    const item = input.closest('.ingredient-item');
    const originalQuantity = parseFloat(item.dataset.original);
    
    if (!originalQuantity || newQuantity === 0) {
        // Just update this one ingredient
        await saveQuantityChange(ingredientId, newQuantity);
        return;
    }
    
    // Calculate scale factor
    const scaleFactor = newQuantity / originalQuantity;
    
    // Update all ingredients proportionally
    const allInputs = elements.ingredientsList.querySelectorAll('.ingredient-qty-input');
    const updates = [];
    
    allInputs.forEach(inp => {
        const ingItem = inp.closest('.ingredient-item');
        const origQty = parseFloat(ingItem.dataset.original);
        if (origQty) {
            const newQty = Math.round(origQty * scaleFactor * 100) / 100;
            inp.value = newQty;
            updates.push({
                id: parseInt(inp.dataset.ingredientId),
                current_quantity: newQty
            });
            
            // Update "original" display
            const originalSpan = ingItem.querySelector('.ingredient-original');
            if (newQty != origQty) {
                if (originalSpan) {
                    const unit = ingItem.querySelector('.ingredient-unit').textContent;
                    originalSpan.textContent = `(originale: ${origQty} ${unit})`;
                } else {
                    const unit = ingItem.querySelector('.ingredient-unit').textContent;
                    ingItem.innerHTML += `<span class="ingredient-original">(originale: ${origQty} ${unit})</span>`;
                }
            } else if (originalSpan) {
                originalSpan.remove();
            }
        }
    });
    
    // Save to database
    if (updates.length > 0) {
        await updateQuantities(state.currentRecipeId, updates);
    }
}

async function saveQuantityChange(ingredientId, quantity) {
    await updateQuantities(state.currentRecipeId, [
        { id: ingredientId, current_quantity: quantity }
    ]);
}

// ============================================
// Form Handling
// ============================================

function showNewRecipeForm() {
    state.isEditing = true;
    state.editingRecipeId = null;
    
    elements.formTitle.textContent = 'Nuova Ricetta';
    elements.recipeForm.reset();
    
    // Set default date to today
    elements.recipeCreationDate.value = new Date().toISOString().split('T')[0];
    
    // Clear photo
    removePhoto();
    
    // Clear subsections and steps
    elements.subsectionsContainer.innerHTML = '';
    elements.stepsContainer.innerHTML = '';
    
    // Add initial subsection and step
    addSubsection();
    addStep();
    
    // Show form
    elements.welcomeScreen.classList.add('hidden');
    elements.recipeView.classList.add('hidden');
    elements.recipeEdit.classList.remove('hidden');
    
    elements.mobileTitle.textContent = 'Nuova Ricetta';
    elements.sidebar.classList.remove('open');
}

async function showEditRecipeForm(id) {
    state.isEditing = true;
    state.editingRecipeId = id;
    
    const recipe = await loadRecipe(id);
    if (!recipe) return;
    
    elements.formTitle.textContent = 'Modifica Ricetta';
    
    // Fill form
    elements.recipeName.value = recipe.name || '';
    elements.recipeDesc.value = recipe.description || '';
    elements.recipeCategorySelect.value = recipe.category_id || '';
    elements.recipeCreationDate.value = recipe.creation_date || '';
    elements.recipePrepTime.value = recipe.preparation_time || '';
    
    // Photo
    if (recipe.photo_url) {
        elements.photoUrl.value = recipe.photo_url;
        elements.photoPreviewImg.src = recipe.photo_url;
        elements.photoPreview.classList.remove('hidden');
        elements.photoPlaceholder.classList.add('hidden');
    } else {
        removePhoto();
    }
    
    // Subsections
    elements.subsectionsContainer.innerHTML = '';
    recipe.subsections.forEach(sub => {
        addSubsection(sub.name, sub.ingredients.map(ing => ({
            name: ing.name,
            quantity: ing.original_quantity,
            unit: ing.unit
        })));
    });
    
    // Steps
    elements.stepsContainer.innerHTML = '';
    recipe.steps.forEach(step => {
        addStep(step.description);
    });
    
    // Show form
    elements.welcomeScreen.classList.add('hidden');
    elements.recipeView.classList.add('hidden');
    elements.recipeEdit.classList.remove('hidden');
    
    elements.mobileTitle.textContent = 'Modifica Ricetta';
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Gather form data
    const data = {
        name: elements.recipeName.value.trim(),
        description: elements.recipeDesc.value.trim(),
        category_id: elements.recipeCategorySelect.value || null,
        creation_date: elements.recipeCreationDate.value,
        preparation_time: elements.recipePrepTime.value ? parseInt(elements.recipePrepTime.value) : null,
        photo_url: elements.photoUrl.value || null,
        subsections: [],
        steps: []
    };
    
    // Gather subsections
    elements.subsectionsContainer.querySelectorAll('.subsection-card').forEach(card => {
        const subsection = {
            name: card.querySelector('.subsection-name-input').value.trim(),
            ingredients: []
        };
        
        card.querySelectorAll('.ingredient-edit-row').forEach(row => {
            const name = row.querySelector('.ingredient-name-input').value.trim();
            if (name) {
                subsection.ingredients.push({
                    name: name,
                    quantity: parseFloat(row.querySelector('.ingredient-qty-edit').value) || null,
                    unit: row.querySelector('.ingredient-unit-select').value
                });
            }
        });
        
        if (subsection.name || subsection.ingredients.length > 0) {
            data.subsections.push(subsection);
        }
    });
    
    // Gather steps
    elements.stepsContainer.querySelectorAll('.step-edit-row textarea').forEach(textarea => {
        const description = textarea.value.trim();
        if (description) {
            data.steps.push({ description });
        }
    });
    
    // Validate
    if (!data.name) {
        showToast('Inserisci il nome della ricetta', 'error');
        return;
    }
    
    // Save
    try {
        const result = await saveRecipe(data);
        showToast(state.editingRecipeId ? 'Ricetta aggiornata' : 'Ricetta creata', 'success');
        
        await loadRecipes();
        
        const recipeId = state.editingRecipeId || result.id;
        await showRecipe(recipeId);
    } catch (error) {
        showToast('Errore durante il salvataggio', 'error');
    }
}

function cancelEdit() {
    if (state.currentRecipeId) {
        showRecipe(state.currentRecipeId);
    } else {
        elements.recipeEdit.classList.add('hidden');
        elements.welcomeScreen.classList.remove('hidden');
        elements.mobileTitle.textContent = 'Ricettario';
    }
}

async function handleDeleteRecipe() {
    if (!state.currentRecipeId) return;
    
    try {
        await deleteRecipe(state.currentRecipeId);
        showToast('Ricetta eliminata', 'success');
        
        state.currentRecipeId = null;
        elements.deleteModal.classList.add('hidden');
        
        await loadRecipes();
        
        elements.recipeView.classList.add('hidden');
        elements.welcomeScreen.classList.remove('hidden');
        elements.mobileTitle.textContent = 'Ricettario';
    } catch (error) {
        showToast('Errore durante l\'eliminazione', 'error');
    }
}

// ============================================
// Photo Handling
// ============================================

async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const result = await uploadPhoto(file);
        elements.photoUrl.value = result.url;
        elements.photoPreviewImg.src = result.url;
        elements.photoPreview.classList.remove('hidden');
        elements.photoPlaceholder.classList.add('hidden');
    } catch (error) {
        showToast('Errore durante il caricamento della foto', 'error');
    }
}

function removePhoto() {
    elements.photoUrl.value = '';
    elements.photoPreviewImg.src = '';
    elements.photoPreview.classList.add('hidden');
    elements.photoPlaceholder.classList.remove('hidden');
    elements.photoInput.value = '';
}

// ============================================
// Dynamic Form Elements
// ============================================

function addSubsection(name = '', ingredients = []) {
    const index = elements.subsectionsContainer.children.length;
    const subsectionHtml = `
        <div class="subsection-card">
            <div class="subsection-header">
                <input type="text" 
                       class="subsection-name-input" 
                       placeholder="Nome sezione (es. Per la pasta, Per il condimento...)"
                       value="${escapeHtml(name)}">
                <button type="button" class="btn-remove" onclick="removeSubsection(this)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="ingredients-edit-list">
                ${ingredients.length > 0 
                    ? ingredients.map(ing => createIngredientRow(ing)).join('')
                    : createIngredientRow()}
            </div>
            <button type="button" class="add-ingredient-btn" onclick="addIngredient(this)">
                + Aggiungi ingrediente
            </button>
        </div>
    `;
    
    elements.subsectionsContainer.insertAdjacentHTML('beforeend', subsectionHtml);
}

function removeSubsection(btn) {
    const card = btn.closest('.subsection-card');
    if (elements.subsectionsContainer.children.length > 1) {
        card.remove();
    } else {
        showToast('Devi avere almeno una sezione ingredienti', 'error');
    }
}

function createIngredientRow(ingredient = {}) {
    const unitOptions = state.units.map(u => 
        `<option value="${escapeHtml(u.abbreviation)}" ${ingredient.unit === u.abbreviation ? 'selected' : ''}>
            ${escapeHtml(u.abbreviation)}
        </option>`
    ).join('');
    
    return `
        <div class="ingredient-edit-row">
            <input type="text" 
                   class="ingredient-name-input" 
                   placeholder="Nome ingrediente"
                   value="${escapeHtml(ingredient.name || '')}">
            <input type="number" 
                   class="ingredient-qty-edit" 
                   placeholder="Qtà"
                   step="any"
                   min="0"
                   value="${ingredient.quantity || ''}">
            <select class="ingredient-unit-select">
                <option value="">Unità</option>
                ${unitOptions}
            </select>
            <button type="button" class="btn-remove" onclick="removeIngredient(this)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
}

function addIngredient(btn) {
    const list = btn.previousElementSibling;
    list.insertAdjacentHTML('beforeend', createIngredientRow());
}

function removeIngredient(btn) {
    const row = btn.closest('.ingredient-edit-row');
    const list = row.parentElement;
    if (list.children.length > 1) {
        row.remove();
    }
}

function addStep(description = '') {
    const index = elements.stepsContainer.children.length + 1;
    const stepHtml = `
        <div class="step-edit-row">
            <span class="step-edit-number">${index}</span>
            <textarea placeholder="Descrivi questo passaggio..." rows="3">${escapeHtml(description)}</textarea>
            <button type="button" class="btn-remove" onclick="removeStep(this)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
    
    elements.stepsContainer.insertAdjacentHTML('beforeend', stepHtml);
}

function removeStep(btn) {
    const row = btn.closest('.step-edit-row');
    if (elements.stepsContainer.children.length > 1) {
        row.remove();
        // Renumber steps
        elements.stepsContainer.querySelectorAll('.step-edit-number').forEach((num, i) => {
            num.textContent = i + 1;
        });
    } else {
        showToast('Devi avere almeno un passaggio', 'error');
    }
}

// ============================================
// Utility Functions
// ============================================

function formatDate(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const format = state.settings.date_format || 'DD/MM/YYYY';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    switch (format) {
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        default:
            return `${day}/${month}/${year}`;
    }
}

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

// Make functions available globally for onclick handlers
window.removeSubsection = removeSubsection;
window.addIngredient = addIngredient;
window.removeIngredient = removeIngredient;
window.removeStep = removeStep;
