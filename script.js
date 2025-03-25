class Task {
  constructor(name, description, importance, profile, dueDate) {
    this.id = Date.now();
    this.name = name;
    this.description = description;
    this.completed = false;
    this.createdAt = new Date().toLocaleString();
    this.updatedAt = null;
    this.importance = importance;
    this.profile = profile;
    this.dueDate = dueDate ? new Date(dueDate).toISOString() : null;
  }
}

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const noTasksMessage = document.getElementById('no-tasks-message');
const dayElement = document.getElementById('day');
const timeElement = document.getElementById('time');
const dateElement = document.getElementById('date');
const quoteElement = document.getElementById('quote');
const themeButtons = document.querySelectorAll('.theme-btn');
const modal = document.getElementById('edit-modal');
const closeBtn = document.querySelector('.close-btn');
const editForm = document.getElementById('edit-form');

const quotes = [
  "Focus on your day, one task at a time.",
  "The secret of getting ahead is getting started.",
  "Productivity is never an accident.",
  "Don't watch the clock; do what it does.",
  "The way to get started is to begin doing.",
  "Your time is limited, don't waste it.",
  "The future depends on what you do today."
];

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function init() {
  setupEventListeners();
  updateDateTime();
  setInterval(updateDateTime, 1000);
  changeQuote();
  setInterval(changeQuote, 10000);
  renderTasks();
}

function setupEventListeners() {
  taskForm.addEventListener('submit', handleTaskSubmit);
  closeBtn.addEventListener('click', closeModal);
  window.addEventListener('click', outsideModalClick);
  
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => changeTheme(btn.dataset.theme));
  });
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const parent = this.parentElement;
      parent.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
      });
      this.classList.add('active');
      renderTasks();
    });
  });
}

function handleTaskSubmit(e) {
  e.preventDefault();
  const taskName = document.getElementById('task-name').value;
  if (taskName.trim() === '') return;

  const newTask = new Task(
    taskName,
    document.getElementById('task-description').value,
    document.querySelector('input[name="importance"]:checked').value,
    document.querySelector('input[name="profile"]:checked').value,
    document.getElementById('task-due-date').value
  );
  
  tasks.push(newTask);
  saveTasks();
  renderTasks();
  taskForm.reset();
}

function openEditModal(id) {
  const task = tasks.find(task => task.id === id);
  document.getElementById('edit-name').value = task.name;
  document.getElementById('edit-description').value = task.description;
  document.querySelector(`input[name="edit-importance"][value="${task.importance}"]`).checked = true;
  document.querySelector(`input[name="edit-profile"][value="${task.profile}"]`).checked = true;
  
  if (task.dueDate) {
    const dueDateInput = document.getElementById('edit-due-date');
    const dueDate = new Date(task.dueDate);
    const formattedDate = dueDate.toISOString().slice(0, 16);
    dueDateInput.value = formattedDate;
  } else {
    document.getElementById('edit-due-date').value = '';
  }
  
  editForm.onsubmit = (e) => {
    e.preventDefault();
    saveTaskChanges(id);
  };
  
  modal.style.display = 'flex';
}

function saveTaskChanges(id) {
  const task = tasks.find(task => task.id === id);
  const newName = document.getElementById('edit-name').value;
  if (newName.trim() === '') return;

  task.name = newName;
  task.description = document.getElementById('edit-description').value;
  task.importance = document.querySelector('input[name="edit-importance"]:checked').value;
  task.profile = document.querySelector('input[name="edit-profile"]:checked').value;
  task.updatedAt = new Date().toLocaleString();
  task.dueDate = document.getElementById('edit-due-date').value ? new Date(document.getElementById('edit-due-date').value).toISOString() : null;
  
  saveTasks();
  renderTasks();
  closeModal();
}

function closeModal() {
  modal.style.display = 'none';
}

function outsideModalClick(e) {
  if (e.target === modal) closeModal();
}

function changeTheme(theme) {
  document.body.className = `theme-${theme}`;
  themeButtons.forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.theme-btn[data-theme="${theme}"]`).classList.add('active');
}

function updateDateTime() {
  const now = new Date();
  dayElement.textContent = days[now.getDay()];
  timeElement.textContent = now.toLocaleTimeString();
  dateElement.textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

function changeQuote() {
  quoteElement.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

function formatDueDate(dueDate) {
  if (!dueDate) return '';
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffTime < 0) {
    return `(Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''})`;
  } else if (diffDays === 0) {
    return '(Due today)';
  } else if (diffDays === 1) {
    return '(Due tomorrow)';
  } else {
    return `(Due in ${diffDays} days)`;
  }
}

function renderTasks() {
  taskList.innerHTML = '';
  
  const statusFilter = document.querySelector('.status-btn.active')?.dataset.status || 'all';
  const profileFilter = document.querySelector('.profile-btn.active')?.dataset.profile || 'all';
  const criticalityFilter = document.querySelector('.criticality-btn.active')?.dataset.criticality || 'all';
  const sortBy = document.querySelector('.sort-btn.active')?.dataset.sort || 'creation';
  
  let filteredTasks = tasks.filter(task => {
    if (statusFilter === 'completed' && !task.completed) return false;
    if (statusFilter === 'pending' && task.completed) return false;
    if (profileFilter !== 'all' && task.profile !== profileFilter) return false;
    if (criticalityFilter !== 'all' && task.importance !== criticalityFilter) return false;
    return true;
  });

  filteredTasks.sort((a, b) => {
    if (sortBy === 'due') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  noTasksMessage.style.display = filteredTasks.length === 0 ? 'block' : 'none';

  filteredTasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = `task ${task.completed ? 'completed' : ''} ${task.dueDate && new Date(task.dueDate) < new Date() ? 'overdue' : ''}`;
    
    const dueDateText = task.dueDate ? 
      `<span class="task-due-date">${new Date(task.dueDate).toLocaleString()} ${formatDueDate(task.dueDate)}</span>` : 
      '';
    
    taskElement.innerHTML = `
      <h3>${task.name} ${dueDateText}</h3>
      <p>${task.description}</p>
      <div class="task-meta">
        <span class="task-profile ${task.profile}">${task.profile.charAt(0).toUpperCase() + task.profile.slice(1)}</span>
        <span>Created: ${task.createdAt}</span>
      </div>
      <div class="task-actions">
        <button class="complete-btn" data-id="${task.id}">${task.completed ? 'Mark Pending' : 'Complete'}</button>
        <button class="edit-btn" data-id="${task.id}">Edit</button>
        <button class="delete-btn" data-id="${task.id}">Delete</button>
      </div>
    `;
    
    taskList.appendChild(taskElement);
  });

  document.querySelectorAll('.complete-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleTask(parseInt(btn.dataset.id)));
  });
  
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteTask(parseInt(btn.dataset.id)));
  });
}

function toggleTask(id) {
  const task = tasks.find(task => task.id === id);
  task.completed = !task.completed;
  task.updatedAt = new Date().toLocaleString();
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  if (confirm('Are you sure you want to delete this task?')) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
  }
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

init();