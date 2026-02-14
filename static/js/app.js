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
    recipePortions: document.getElementById('recipePortions'),
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

async function updatePortions(recipeId, currentPortions) {
    return await apiCall(`/api/recipes/${recipeId}/portions`, {
        method: 'PUT',
        body: JSON.stringify({ current_portions: currentPortions })
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
    // Check if this is a "Pane e Lievitati" recipe
    const isBreadRecipe = recipe.category_name === 'Pane e Lievitati';
    
    // Get portions data from database
    const originalPortions = parseFloat(recipe.original_portions) || 1;
    
    // Calculate current portions based on ingredient scaling
    // If ingredients have been scaled, portions should reflect that
    let scaleFactor = 1;
    let hasValidIngredient = false;
    
    recipe.subsections.forEach(sub => {
        sub.ingredients.forEach(ing => {
            const origQty = parseFloat(ing.original_quantity) || 0;
            const currQty = parseFloat(ing.current_quantity) || 0;
            if (origQty > 0 && currQty > 0 && !hasValidIngredient) {
                scaleFactor = currQty / origQty;
                hasValidIngredient = true;
            }
        });
    });
    
    const currentPortions = Math.round(originalPortions * scaleFactor * 100) / 100;
    
    // Calculate total weight (sum of ALL ingredient quantities, regardless of unit)
    let totalWeight = 0;
    let originalTotalWeight = 0;
    recipe.subsections.forEach(sub => {
        sub.ingredients.forEach(ing => {
            const qty = parseFloat(ing.current_quantity) || 0;
            const origQty = parseFloat(ing.original_quantity) || 0;
            totalWeight += qty;
            originalTotalWeight += origQty;
        });
    });
    
    // Round to 2 decimal places
    totalWeight = Math.round(totalWeight * 100) / 100;
    originalTotalWeight = Math.round(originalTotalWeight * 100) / 100;
    
    const totalWeightChanged = Math.abs(totalWeight - originalTotalWeight) > 0.001;
    
    // Build portions HTML (always visible, no original reference)
    const portionsHtml = `
        <div class="portions-container">
            <div class="portions-item">
                <div class="portions-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Porzioni
                </div>
                <div class="portions-value">
                    <button type="button" class="portions-btn portions-minus" id="portionsMinus">−</button>
                    <input type="number" 
                           value="${currentPortions}" 
                           step="any"
                           min="0.1"
                           data-original-portions="${originalPortions}"
                           class="portions-input"
                           id="portionsInput">
                    <button type="button" class="portions-btn portions-plus" id="portionsPlus">+</button>
                </div>
            </div>
        </div>
    `;
    
    // Build total weight HTML if it's a bread recipe
    const totalWeightHtml = isBreadRecipe ? `
        <div class="total-weight-container">
            <div class="total-weight-item">
                <div class="total-weight-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                        <line x1="16" y1="8" x2="2" y2="22"></line>
                        <line x1="17.5" y1="15" x2="9" y2="15"></line>
                    </svg>
                    Peso Totale
                </div>
                <div class="total-weight-value">
                    <input type="number" 
                           value="${totalWeight}" 
                           step="any"
                           min="0"
                           data-original-total="${originalTotalWeight}"
                           class="total-weight-input"
                           id="totalWeightInput">
                    <span class="ingredient-unit">g</span>
                    <span class="ingredient-original total-weight-original" style="${totalWeightChanged ? '' : 'display:none'}">(originale: ${originalTotalWeight} g)</span>
                </div>
            </div>
        </div>
    ` : '';
    
    elements.ingredientsList.innerHTML = portionsHtml + totalWeightHtml + recipe.subsections.map(subsection => `
        <div class="ingredient-subsection">
            <h3 class="subsection-title">${escapeHtml(subsection.name)}</h3>
            <div class="ingredient-list">
                ${subsection.ingredients.map(ing => {
                    const hasChanged = ing.current_quantity != ing.original_quantity && ing.original_quantity;
                    return `
                    <div class="ingredient-item" data-id="${ing.id}" data-original="${ing.original_quantity || 0}">
                        <div class="ingredient-quantity">
                            <input type="number" 
                                   value="${ing.current_quantity !== null ? ing.current_quantity : ''}" 
                                   step="any"
                                   min="0"
                                   data-ingredient-id="${ing.id}"
                                   data-original-qty="${ing.original_quantity || 0}"
                                   data-unit="${ing.unit || ''}"
                                   class="ingredient-qty-input">
                            <span class="ingredient-unit">${escapeHtml(ing.unit || '')}</span>
                        </div>
                        <span class="ingredient-name">${escapeHtml(ing.name)}</span>
                        <span class="ingredient-original" style="${hasChanged ? '' : 'display:none'}">(originale: ${ing.original_quantity || 0} ${escapeHtml(ing.unit || '')})</span>
                    </div>
                `}).join('')}
            </div>
        </div>
    `).join('');
    
    // Add quantity change listeners - use 'input' for real-time updates
    elements.ingredientsList.querySelectorAll('.ingredient-qty-input').forEach(input => {
        input.addEventListener('input', debounce(handleQuantityChange, 300));
        input.addEventListener('change', handleQuantityChange);
    });
    
    // Add portions change listeners
    const portionsInput = document.getElementById('portionsInput');
    const portionsMinus = document.getElementById('portionsMinus');
    const portionsPlus = document.getElementById('portionsPlus');
    
    if (portionsInput) {
        portionsInput.addEventListener('input', debounce(handlePortionsChange, 300));
        portionsInput.addEventListener('change', handlePortionsChange);
        
        portionsMinus.addEventListener('click', () => {
            const currentVal = parseFloat(portionsInput.value) || 1;
            if (currentVal > 1) {
                portionsInput.value = currentVal - 1;
                portionsInput.dispatchEvent(new Event('change'));
            }
        });
        
        portionsPlus.addEventListener('click', () => {
            const currentVal = parseFloat(portionsInput.value) || 1;
            portionsInput.value = currentVal + 1;
            portionsInput.dispatchEvent(new Event('change'));
        });
    }
    
    // Add total weight change listener if present
    const totalWeightInput = document.getElementById('totalWeightInput');
    if (totalWeightInput) {
        totalWeightInput.addEventListener('input', debounce(handleTotalWeightChange, 300));
        totalWeightInput.addEventListener('change', handleTotalWeightChange);
    }
}

// Handle portions change - scale all ingredients proportionally
async function handlePortionsChange(e) {
    const input = e.target;
    const newPortions = parseFloat(input.value);
    const originalPortions = parseFloat(input.dataset.originalPortions);
    
    if (isNaN(newPortions) || newPortions <= 0) {
        return;
    }
    
    // Calculate scale factor: we need to scale based on the ORIGINAL portions
    // newQty = originalQty * (newPortions / originalPortions)
    const scaleFactor = newPortions / originalPortions;
    
    console.log(`Portions scaling: ${originalPortions} -> ${newPortions}, factor: ${scaleFactor}`);
    
    // Update all ingredients proportionally based on original quantities
    const allInputs = elements.ingredientsList.querySelectorAll('.ingredient-qty-input');
    const updates = [];
    
    allInputs.forEach(inp => {
        const origQty = parseFloat(inp.dataset.originalQty);
        
        if (origQty && origQty > 0) {
            const newQty = Math.round(origQty * scaleFactor * 100) / 100;
            inp.value = newQty;
            
            updates.push({
                id: parseInt(inp.dataset.ingredientId),
                current_quantity: newQty
            });
            
            // Update "original" display
            const ingItem = inp.closest('.ingredient-item');
            const originalSpan = ingItem.querySelector('.ingredient-original');
            
            if (Math.abs(newQty - origQty) > 0.001) {
                originalSpan.style.display = '';
            } else if (originalSpan) {
                originalSpan.style.display = 'none';
            }
        }
    });
    
    // Update total weight display if present
    updateTotalWeightDisplay();
    
    // Save to database
    if (updates.length > 0) {
        await updateQuantities(state.currentRecipeId, updates);
    }
    await updatePortions(state.currentRecipeId, newPortions);
}

// Handle total weight change - scale all ingredients proportionally
async function handleTotalWeightChange(e) {
    const input = e.target;
    const newTotalWeight = parseFloat(input.value);
    const originalTotalWeight = parseFloat(input.dataset.originalTotal);
    
    if (isNaN(newTotalWeight) || newTotalWeight === 0) {
        return;
    }
    
    // Calculate CURRENT total weight (sum of all current ingredient values)
    let currentTotalWeight = 0;
    const allInputs = elements.ingredientsList.querySelectorAll('.ingredient-qty-input');
    allInputs.forEach(inp => {
        const qty = parseFloat(inp.value) || 0;
        currentTotalWeight += qty;
    });
    
    if (currentTotalWeight === 0) {
        return;
    }
    
    // Calculate scale factor based on current total weight vs new desired total
    const scaleFactor = newTotalWeight / currentTotalWeight;
    
    console.log(`Total weight scaling: ${currentTotalWeight} -> ${newTotalWeight}, factor: ${scaleFactor}`);
    
    // Update all ingredients proportionally
    const updates = [];
    
    allInputs.forEach(inp => {
        const currentQty = parseFloat(inp.value) || 0;
        const origQty = parseFloat(inp.dataset.originalQty) || 0;
        
        if (currentQty > 0) {
            const newQty = Math.round(currentQty * scaleFactor * 100) / 100;
            inp.value = newQty;
            
            updates.push({
                id: parseInt(inp.dataset.ingredientId),
                current_quantity: newQty
            });
            
            // Update "original" display
            const ingItem = inp.closest('.ingredient-item');
            const originalSpan = ingItem.querySelector('.ingredient-original');
            
            if (origQty && Math.abs(newQty - origQty) > 0.001) {
                originalSpan.style.display = '';
            } else if (originalSpan) {
                originalSpan.style.display = 'none';
            }
        }
    });
    
    // Update total weight original display
    const totalWeightOriginal = document.querySelector('.total-weight-original');
    if (totalWeightOriginal && originalTotalWeight) {
        if (Math.abs(newTotalWeight - originalTotalWeight) > 0.001) {
            totalWeightOriginal.style.display = '';
        } else {
            totalWeightOriginal.style.display = 'none';
        }
    }
    
    // Save to database
    if (updates.length > 0) {
        await updateQuantities(state.currentRecipeId, updates);
    }
    
    // Update portions display
    updatePortionsDisplay();
    
    // Save updated portions
    const portionsInput = document.getElementById('portionsInput');
    if (portionsInput) {
        await updatePortions(state.currentRecipeId, parseFloat(portionsInput.value));
    }
}

// Debounce helper to prevent too many API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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
    const newQuantity = parseFloat(input.value);
    const originalQuantity = parseFloat(input.dataset.originalQty);
    
    // If input is empty or zero, or no original quantity, don't scale others
    if (isNaN(newQuantity) || newQuantity === 0 || !originalQuantity || originalQuantity === 0) {
        if (!isNaN(newQuantity)) {
            await saveQuantityChange(ingredientId, newQuantity);
        }
        return;
    }
    
    // Calculate scale factor based on original quantity
    const scaleFactor = newQuantity / originalQuantity;
    
    console.log(`Scaling: ${originalQuantity} -> ${newQuantity}, factor: ${scaleFactor}`);
    
    // Update all ingredients proportionally
    const allInputs = elements.ingredientsList.querySelectorAll('.ingredient-qty-input');
    const updates = [];
    
    allInputs.forEach(inp => {
        const origQty = parseFloat(inp.dataset.originalQty);
        
        if (origQty && origQty > 0) {
            const newQty = Math.round(origQty * scaleFactor * 100) / 100;
            inp.value = newQty;
            
            updates.push({
                id: parseInt(inp.dataset.ingredientId),
                current_quantity: newQty
            });
            
            // Update "original" display
            const ingItem = inp.closest('.ingredient-item');
            const originalSpan = ingItem.querySelector('.ingredient-original');
            
            if (Math.abs(newQty - origQty) > 0.001) {
                // Values are different - show original
                originalSpan.style.display = '';
            } else {
                // Values are same - hide original
                originalSpan.style.display = 'none';
            }
        }
    });
    
    // Update total weight display if present
    updateTotalWeightDisplay();
    
    // Update portions display
    updatePortionsDisplay();
    
    // Save to database
    if (updates.length > 0) {
        await updateQuantities(state.currentRecipeId, updates);
    }
    
    // Save updated portions
    const portionsInput = document.getElementById('portionsInput');
    if (portionsInput) {
        await updatePortions(state.currentRecipeId, parseFloat(portionsInput.value));
    }
}

// Update portions display after ingredient changes
function updatePortionsDisplay() {
    const portionsInput = document.getElementById('portionsInput');
    if (!portionsInput) return;
    
    const originalPortions = parseFloat(portionsInput.dataset.originalPortions) || 1;
    
    // Calculate scale factor from first valid ingredient ratio
    let scaleFactor = 1;
    const allInputs = elements.ingredientsList.querySelectorAll('.ingredient-qty-input');
    
    for (const inp of allInputs) {
        const origQty = parseFloat(inp.dataset.originalQty) || 0;
        const currQty = parseFloat(inp.value) || 0;
        if (origQty > 0 && currQty > 0) {
            scaleFactor = currQty / origQty;
            break;
        }
    }
    
    const newPortions = Math.round(originalPortions * scaleFactor * 100) / 100;
    portionsInput.value = newPortions;
}

// Update total weight display after ingredient changes
function updateTotalWeightDisplay() {
    const totalWeightInput = document.getElementById('totalWeightInput');
    if (!totalWeightInput) return;
    
    // Recalculate total weight - sum ALL quantities regardless of unit
    let totalWeight = 0;
    const allInputs = elements.ingredientsList.querySelectorAll('.ingredient-qty-input');
    
    allInputs.forEach(inp => {
        const qty = parseFloat(inp.value) || 0;
        totalWeight += qty;
    });
    
    totalWeight = Math.round(totalWeight * 100) / 100;
    totalWeightInput.value = totalWeight;
    
    // Update original display
    const originalTotal = parseFloat(totalWeightInput.dataset.originalTotal);
    const totalWeightOriginal = document.querySelector('.total-weight-original');
    if (totalWeightOriginal) {
        if (Math.abs(totalWeight - originalTotal) > 0.001) {
            totalWeightOriginal.style.display = '';
        } else {
            totalWeightOriginal.style.display = 'none';
        }
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
    elements.recipePortions.value = recipe.original_portions || 1;
    
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
        portions: elements.recipePortions.value ? parseFloat(elements.recipePortions.value) : 1,
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

function addSubsection(nameOrEvent = '', ingredients = []) {
    // Handle case when called from button click (event passed as first arg)
    const name = (typeof nameOrEvent === 'string') ? nameOrEvent : '';
    const ings = (typeof nameOrEvent === 'string') ? ingredients : [];
    
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
                ${ings.length > 0 
                    ? ings.map(ing => createIngredientRow(ing)).join('')
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

function addStep(descriptionOrEvent = '') {
    // Handle case when called from button click (event passed as first arg)
    const description = (typeof descriptionOrEvent === 'string') ? descriptionOrEvent : '';
    
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
