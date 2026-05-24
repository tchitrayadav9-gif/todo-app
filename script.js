/**
 * JavaScript Logic & State Management – Smart To-Do List App
 * 
 * Centralized state management with localStorage persistence, complete CRUD,
 * dashboard metrics, custom toast notifications, multi-criteria filtering,
 * live search, form validations, and native HTML5 drag-and-drop reordering.
 */

// ==========================================================================
// CENTRAL STATE OBJECT
// ==========================================================================
const state = {
  tasks: [],
  filter: 'all',          // 'all' | 'active' | 'completed'
  categoryFilter: 'all',  // 'all' | 'Personal' | 'Work' | 'Study' | 'Shopping'
  priorityFilter: 'all',  // 'all' | 'High' | 'Medium' | 'Low'
  searchQuery: '',        // text filter
  sortBy: 'position',     // 'position' | 'dueDate' | 'priority' | 'title'
  theme: 'light'          // 'light' | 'dark'
};

// ==========================================================================
// DOM ELEMENT SELECTORS
// ==========================================================================
const themeToggleBtn = document.getElementById('themeToggleBtn');
const openModalBtn = document.getElementById('openModalBtn');
const mobileFab = document.getElementById('mobileFab');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const emptyStateBtn = document.getElementById('emptyStateBtn');
const toastContainer = document.getElementById('toastContainer');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const currentDateEl = document.getElementById('currentDate');

// Form Input Elements
const taskIdInput = document.getElementById('taskIdInput');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskDescInput = document.getElementById('taskDescInput');
const taskDueDateInput = document.getElementById('taskDueDateInput');
const taskPriorityInput = document.getElementById('taskPriorityInput');
const taskCategoryInput = document.getElementById('taskCategoryInput');
const charCounter = document.getElementById('charCounter');
const titleError = document.getElementById('titleError');
const modalTitle = document.getElementById('modalTitle');

// Filter & Sort Elements
const searchInput = document.getElementById('searchInput');
const categoryFilterSelect = document.getElementById('categoryFilter');
const priorityFilterSelect = document.getElementById('priorityFilter');
const sortOptionSelect = document.getElementById('sortOption');
const filterTabBtns = document.querySelectorAll('.tab-btn');

// Stats Counters
const statTotalCount = document.getElementById('statTotalCount');
const statCompletedCount = document.getElementById('statCompletedCount');
const statPendingCount = document.getElementById('statPendingCount');
const statProgressValue = document.getElementById('statProgressValue');
const statProgressBarFill = document.getElementById('statProgressBarFill');

// Prioritized values for sorting
const PRIORITY_VALUES = { 'High': 3, 'Medium': 2, 'Low': 1 };

// ==========================================================================
// SAMPLE INITIAL DATA
// ==========================================================================
const DEFAULT_TASKS = [
  {
    id: "sample-1",
    title: "Welcome to the App",
    description: "Organize your tasks, check items, drag to reorder, and toggle dark mode.",
    dueDate: new Date().toISOString().split('T')[0], // present date
    priority: "Medium",
    category: "Personal",
    completed: false,
    position: 0
  }
];

// ==========================================================================
// APP INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Load tasks and theme
  loadThemePreference();
  loadTasksFromStorage();
  
  // Set date
  updateDateDisplay();

  // Register events
  registerEventListeners();

  // Render initial interface
  render();
}

function updateDateDisplay() {
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
}

// ==========================================================================
// STORAGE MANAGEMENT
// ==========================================================================
function loadTasksFromStorage() {
  const storedTasks = localStorage.getItem('todo_tasks');
  if (storedTasks) {
    try {
      state.tasks = JSON.parse(storedTasks);
      
      // Clean up previous default tasks if they exist
      const hasOldWelcome = state.tasks.some(t => t.id === 'sample-1' && t.title.includes('Welcome to Smart To-Do'));
      const hasOldSample2 = state.tasks.some(t => t.id === 'sample-2');
      const hasOldSample3 = state.tasks.some(t => t.id === 'sample-3');
      
      if (hasOldWelcome || hasOldSample2 || hasOldSample3) {
        // Keep only non-sample tasks, and prepend the new welcome task
        state.tasks = [
          ...DEFAULT_TASKS,
          ...state.tasks.filter(t => !t.id.startsWith('sample-'))
        ];
        // Re-assign positions
        state.tasks.forEach((t, idx) => {
          t.position = idx;
        });
        saveTasksToStorage();
      }
    } catch (e) {
      console.error("Error parsing tasks from local storage", e);
      state.tasks = DEFAULT_TASKS;
    }
  } else {
    // Fill with sample tasks on first load
    state.tasks = DEFAULT_TASKS;
    saveTasksToStorage();
  }
}

function saveTasksToStorage() {
  localStorage.setItem('todo_tasks', JSON.stringify(state.tasks));
}

function loadThemePreference() {
  const savedTheme = localStorage.getItem('todo_theme');
  if (savedTheme) {
    state.theme = savedTheme;
  } else {
    // Fallback to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    state.theme = prefersDark ? 'dark' : 'light';
  }
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const sunIcon = themeToggleBtn.querySelector('.sun-icon');
  const moonIcon = themeToggleBtn.querySelector('.moon-icon');

  if (state.theme === 'dark') {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  }
  localStorage.setItem('todo_theme', state.theme);
}

// ==========================================================================
// TOAST NOTIFICATIONS SYSTEM
// ==========================================================================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Choose icon based on toast type
  let iconSVG = '';
  if (type === 'success') {
    iconSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else if (type === 'warning') {
    iconSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    iconSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSVG}</div>
    <div class="toast-message">${message}</div>
    <div class="toast-close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  `;

  // Append toast
  toastContainer.appendChild(toast);

  // Close event listener on toast-close btn
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    removeToast(toast);
  });

  // Auto remove after 3.5s
  setTimeout(() => {
    removeToast(toast);
  }, 3500);
}

function removeToast(toast) {
  if (toast && toast.parentNode) {
    toast.classList.add('fade-out');
    // Wait for fadeout animation to complete, then remove
    toast.addEventListener('animationend', (e) => {
      if (e.animationName === 'fadeOut') {
        toast.remove();
      }
    });
  }
}

// ==========================================================================
// CRUD OPERATIONS & BUSINESS LOGIC
// ==========================================================================
function saveOrUpdateTask(e) {
  e.preventDefault();
  
  const id = taskIdInput.value;
  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();
  const dueDate = taskDueDateInput.value;
  const priority = taskPriorityInput.value;
  const category = taskCategoryInput.value;

  // Validate fields
  if (!validateForm(title, id)) {
    return;
  }

  if (id) {
    // UPDATE MODE
    const taskIndex = state.tasks.findIndex(t => t.id === id);
    if (taskIndex > -1) {
      state.tasks[taskIndex] = {
        ...state.tasks[taskIndex],
        title,
        description,
        dueDate,
        priority,
        category
      };
      showToast('Task updated successfully!', 'success');
    }
  } else {
    // CREATE MODE
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      dueDate,
      priority,
      category,
      completed: false,
      position: state.tasks.length
    };
    state.tasks.push(newTask);
    showToast('Task added successfully!', 'success');
  }

  saveTasksToStorage();
  closeModal();
  render();
}

function deleteTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  state.tasks = state.tasks.filter(t => t.id !== id);
  
  // Re-adjust positions sequentially
  state.tasks
    .sort((a, b) => a.position - b.position)
    .forEach((t, index) => {
      t.position = index;
    });

  saveTasksToStorage();
  showToast(`"${task.title}" deleted permanently.`, 'info');
  render();
}

function toggleTaskComplete(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  saveTasksToStorage();

  const msg = task.completed ? 'Task marked as completed! 🎉' : 'Task marked as pending.';
  showToast(msg, task.completed ? 'success' : 'info');
  render();
}

function clearCompletedTasks() {
  const completedCount = state.tasks.filter(t => t.completed).length;
  if (completedCount === 0) {
    showToast('No completed tasks to clear.', 'warning');
    return;
  }

  state.tasks = state.tasks.filter(t => !t.completed);
  
  // Reset positions
  state.tasks.forEach((t, index) => {
    t.position = index;
  });

  saveTasksToStorage();
  showToast(`Cleared ${completedCount} completed task(s).`, 'info');
  render();
}

// ==========================================================================
// FORM VALIDATIONS
// ==========================================================================
function validateForm(title, editingId = '') {
  let isValid = true;

  // Title empty validation
  if (!title) {
    titleError.textContent = "Task title is required.";
    titleError.classList.add('show');
    taskTitleInput.classList.add('error-border');
    isValid = false;
  } 
  // Title character limit check
  else if (title.length > 40) {
    titleError.textContent = "Title must be 40 characters or less.";
    titleError.classList.add('show');
    taskTitleInput.classList.add('error-border');
    isValid = false;
  }
  // Title uniqueness check (excluding current editing task)
  else {
    const isDuplicate = state.tasks.some(
      t => t.title.toLowerCase().trim() === title.toLowerCase().trim() && t.id !== editingId
    );
    if (isDuplicate) {
      titleError.textContent = "A task with this title already exists.";
      titleError.classList.add('show');
      taskTitleInput.classList.add('error-border');
      isValid = false;
    } else {
      titleError.classList.remove('show');
      taskTitleInput.classList.remove('error-border');
    }
  }

  return isValid;
}

// Clean Validation errors when typing or changing modal states
function clearValidationErrors() {
  titleError.classList.remove('show');
  taskTitleInput.classList.remove('error-border');
}

// ==========================================================================
// UI/MODAL CONTROLLERS
// ==========================================================================
function openModal(editingId = null) {
  clearValidationErrors();
  taskForm.reset();

  if (editingId) {
    // Edit task mode
    modalTitle.textContent = "Edit Task";
    const task = state.tasks.find(t => t.id === editingId);
    if (task) {
      taskIdInput.value = task.id;
      taskTitleInput.value = task.title;
      taskDescInput.value = task.description;
      taskDueDateInput.value = task.dueDate;
      taskPriorityInput.value = task.priority;
      taskCategoryInput.value = task.category;
      
      // Update character count display
      charCounter.textContent = `${task.title.length} / 40`;
    }
  } else {
    // Add task mode
    modalTitle.textContent = "Create New Task";
    taskIdInput.value = "";
    charCounter.textContent = "0 / 40";
    
    // Auto set due date to empty or today by default
    taskDueDateInput.value = "";
    taskPriorityInput.value = "Medium";
    taskCategoryInput.value = "Personal";
  }

  taskModal.classList.add('active');
  taskModal.setAttribute('aria-hidden', 'false');
  taskTitleInput.focus();
}

function closeModal() {
  taskModal.classList.remove('active');
  taskModal.setAttribute('aria-hidden', 'true');
}

// ==========================================================================
// RENDERING & STATISTICS COMPUTATION
// ==========================================================================
function render() {
  // 1. Calculate & render stats
  renderDashboardStats();

  // 2. Filter & Sort tasks
  const processedTasks = getProcessedTasks();

  // 3. Render task list
  renderTaskList(processedTasks);
}

function renderDashboardStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  statTotalCount.textContent = total;
  statCompletedCount.textContent = completed;
  statPendingCount.textContent = pending;
  statProgressValue.textContent = `${percent}%`;
  statProgressBarFill.style.width = `${percent}%`;
}

function getProcessedTasks() {
  // Step 1: Filter tasks by Search query & Status Filter tabs & Priority/Category dropdowns
  let filtered = state.tasks.filter(task => {
    // Text search
    const matchesSearch = task.title.toLowerCase().includes(state.searchQuery.toLowerCase());
    
    // Tabs filter
    let matchesStatus = true;
    if (state.filter === 'active') matchesStatus = !task.completed;
    if (state.filter === 'completed') matchesStatus = task.completed;
    
    // Category dropdown filter
    const matchesCategory = state.categoryFilter === 'all' || task.category === state.categoryFilter;
    
    // Priority dropdown filter
    const matchesPriority = state.priorityFilter === 'all' || task.priority === state.priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  // Step 2: Sort tasks
  filtered.sort((a, b) => {
    if (state.sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (state.sortBy === 'priority') {
      return PRIORITY_VALUES[b.priority] - PRIORITY_VALUES[a.priority];
    }
    if (state.sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    // Default / Position based sorting
    return a.position - b.position;
  });

  return filtered;
}

function renderTaskList(tasks) {
  // Clean up
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    emptyState.style.display = "flex";
    taskList.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  taskList.style.display = "grid";

  // Create cards dynamically
  tasks.forEach((task) => {
    const card = createTaskCard(task);
    taskList.appendChild(card);
  });
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = `task-card ${task.completed ? 'completed' : ''}`;
  card.setAttribute('draggable', 'true');
  card.setAttribute('data-id', task.id);
  
  // Format Date Badge text
  let dateBadgeHtml = '';
  if (task.dueDate) {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.dueDate < today && !task.completed;
    const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const formattedDate = new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', dateOptions);
    
    dateBadgeHtml = `
      <div class="badge badge-date ${isOverdue ? 'overdue' : ''}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>${isOverdue ? 'Overdue: ' : ''}${formattedDate}</span>
      </div>
    `;
  }

  card.innerHTML = `
    <!-- Checkbox -->
    <div class="task-checkbox-wrapper">
      <button class="task-checkbox" aria-label="Toggle completed state" data-action="toggle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>
    </div>

    <!-- Details -->
    <div class="task-details">
      <div class="task-card-header">
        <h3 class="task-title">${escapeHTML(task.title)}</h3>
        <div class="task-actions">
          <button class="icon-btn edit-btn" aria-label="Edit task" data-action="edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="icon-btn delete-btn" aria-label="Delete task permanently" data-action="delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
      
      ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
      
      <div class="task-metadata">
        <div class="badge badge-cat ${task.category}">
          <span>${task.category}</span>
        </div>
        <div class="badge badge-priority ${task.priority}">
          <span>${task.priority}</span>
        </div>
        ${dateBadgeHtml}
      </div>
    </div>
  `;

  // Attach Drag Event Handlers directly to Card
  attachDragEvents(card);

  return card;
}

// XSS mitigation helper
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// ==========================================================================
// DRAG AND DROP HANDLERS (HTML5 NATIVE API)
// ==========================================================================
let draggedElement = null;

function attachDragEvents(card) {
  card.addEventListener('dragstart', (e) => {
    // Only allow drag if sorting is default/position. 
    // Sorting by date or title breaks drag logic conceptually
    if (state.sortBy !== 'position') {
      e.preventDefault();
      showToast('Switch to "Default Order" to reorder tasks.', 'warning');
      return;
    }

    draggedElement = card;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
  });

  card.addEventListener('dragend', () => {
    if (!draggedElement) return;
    draggedElement.classList.remove('dragging');
    draggedElement = null;

    // Remove temporary insertion visual classes
    const cards = taskList.querySelectorAll('.task-card');
    cards.forEach(c => c.classList.remove('drag-over-top', 'drag-over-bottom'));

    // Re-index task positions based on current DOM order
    syncStateOrderFromDOM();
  });
}

function syncStateOrderFromDOM() {
  const DOMCards = [...taskList.querySelectorAll('.task-card')];
  const newOrderIds = DOMCards.map(c => c.getAttribute('data-id'));

  // Update position attributes in main task array
  state.tasks.forEach(task => {
    const newIdx = newOrderIds.indexOf(task.id);
    if (newIdx !== -1) {
      task.position = newIdx;
    }
  });

  // Re-sort the local state arrays so elements align
  state.tasks.sort((a, b) => a.position - b.position);
  
  saveTasksToStorage();
  renderDashboardStats(); // Stats percentage shouldn't change, but save to localStorage is needed
}

// List dragover container helper
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ==========================================================================
// EVENT LISTENERS REGISTER
// ==========================================================================
function registerEventListeners() {
  // Theme Toggle click
  themeToggleBtn.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    showToast(`Switched to ${state.theme} mode.`, 'info');
  });

  // Add Task modals triggers
  openModalBtn.addEventListener('click', () => openModal());
  mobileFab.addEventListener('click', () => openModal());
  emptyStateBtn.addEventListener('click', () => openModal());

  // Close modals triggers
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);
  
  // Overlay click to close
  window.addEventListener('click', (e) => {
    if (e.target === taskModal) {
      closeModal();
    }
  });

  // Form submit
  taskForm.addEventListener('submit', saveOrUpdateTask);

  // Form Title character input counter & validation reset
  taskTitleInput.addEventListener('input', () => {
    const len = taskTitleInput.value.length;
    charCounter.textContent = `${len} / 40`;
    if (len > 0) {
      clearValidationErrors();
    }
  });

  // Event delegation for actions inside Task list cards (complete, edit, delete)
  taskList.addEventListener('click', (e) => {
    const target = e.target;
    
    // Find nearest ancestor with action attribute or specific class
    const interactiveBtn = target.closest('[data-action]');
    if (!interactiveBtn) return;

    const action = interactiveBtn.getAttribute('data-action');
    const card = interactiveBtn.closest('.task-card');
    if (!card) return;

    const taskId = card.getAttribute('data-id');

    if (action === 'toggle') {
      toggleTaskComplete(taskId);
    } else if (action === 'edit') {
      openModal(taskId);
    } else if (action === 'delete') {
      deleteTask(taskId);
    }
  });

  // Clear completed tasks
  clearCompletedBtn.addEventListener('click', clearCompletedTasks);

  // Search Input live typing
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    render();
  });

  // Category filter select change
  categoryFilterSelect.addEventListener('change', (e) => {
    state.categoryFilter = e.target.value;
    render();
  });

  // Priority filter select change
  priorityFilterSelect.addEventListener('change', (e) => {
    state.priorityFilter = e.target.value;
    render();
  });

  // Sort option change
  sortOptionSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    render();
  });

  // Status Filter tab buttons clicks
  filterTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate siblings
      filterTabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });

      // Activate clicked
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update state filter & render
      state.filter = btn.getAttribute('data-filter');
      render();
    });
  });

  // Task list Container dragover handlers
  taskList.addEventListener('dragover', (e) => {
    // Drag and drop sorting is active only in default ordering
    if (state.sortBy !== 'position') return;
    
    e.preventDefault();
    const afterElement = getDragAfterElement(taskList, e.clientY);
    const draggingElement = document.querySelector('.dragging');
    
    if (draggingElement) {
      if (afterElement == null) {
        taskList.appendChild(draggingElement);
      } else {
        taskList.insertBefore(draggingElement, afterElement);
      }
    }
  });

  // Keyboard shortcut keys: Esc key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && taskModal.classList.contains('active')) {
      closeModal();
    }
  });
}
