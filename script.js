// State Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
let currentDate = new Date();
let selectedDate = new Date();
let userName = localStorage.getItem('userName') || 'Friend';

// Wallpaper Settings
let wallpaperSettings = JSON.parse(localStorage.getItem('wallpaperSettings')) || {
    transparency: 100,
    position: 'cover',
    blur: 0
};

// DOM Elements
const navLinks = document.querySelectorAll('.nav-links li');
const pages = document.querySelectorAll('.page');
const tasksList = document.querySelector('.tasks-list');
const completedTasksList = document.querySelector('.completed-tasks');
const calendarGrid = document.querySelector('.calendar-grid');
const currentMonthDisplay = document.querySelector('.current-month');
const prevMonthBtn = document.querySelector('.prev-month');
const nextMonthBtn = document.querySelector('.next-month');
const darkModeToggle = document.getElementById('darkMode');
const wallpaperInput = document.getElementById('wallpaperInput');
const dateDisplay = document.querySelector('.date-display');
const userNameDisplay = document.getElementById('userName');
const nameInput = document.getElementById('nameInput');
const updateNameBtn = document.getElementById('updateNameBtn');
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mainContent = document.querySelector('.main-content');

// Initialize the application
function init() {
    loadSettings();
    setupEventListeners();
    updateCalendar();
    displayTodayTasks();
    displayCompletedTasks();
    checkMidnightTasks();
    updateUserNameDisplay();
    applyWallpaperSettings();
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const pageId = link.dataset.page;
            navigateToPage(pageId);
            
            // Auto collapse sidebar on calendar page
            if (pageId === 'calendar') {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
                const icon = sidebarToggle.querySelector('i');
                icon.classList.remove('fa-chevron-left');
                icon.classList.add('fa-chevron-right');
            }
        });
    });

    // Calendar Navigation
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    // Settings
    darkModeToggle.addEventListener('change', toggleDarkMode);
    wallpaperInput.addEventListener('change', handleWallpaperUpload);

    // Name update
    updateNameBtn.addEventListener('click', updateUserName);
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            updateUserName();
        }
    });

    // Wallpaper controls
    document.getElementById('transparencySlider').addEventListener('input', (e) => {
        wallpaperSettings.transparency = e.target.value;
        document.getElementById('transparencyValue').textContent = `${e.target.value}%`;
        updateWallpaperSettings();
    });

    document.getElementById('wallpaperPosition').addEventListener('change', (e) => {
        wallpaperSettings.position = e.target.value;
        updateWallpaperSettings();
    });

    document.getElementById('blurSlider').addEventListener('input', (e) => {
        wallpaperSettings.blur = e.target.value;
        document.getElementById('blurValue').textContent = `${e.target.value}px`;
        updateWallpaperSettings();
    });

    document.getElementById('resetWallpaper').addEventListener('click', () => {
        localStorage.removeItem('wallpaper');
        localStorage.removeItem('wallpaperSettings');
        wallpaperSettings = {
            transparency: 100,
            position: 'cover',
            blur: 0
        };
        applyWallpaperSettings();
    });

    // Sidebar toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        const icon = sidebarToggle.querySelector('i');
        icon.classList.toggle('fa-chevron-left');
        icon.classList.toggle('fa-chevron-right');
    });
}

// Navigation
function navigateToPage(pageId) {
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === pageId) {
            page.classList.add('active');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) {
            link.classList.add('active');
        }
    });
}

// Task Management
function addNewTask() {
    const title = document.getElementById('taskTitle').value;
    const date = document.getElementById('taskDate').value;
    const description = document.getElementById('taskDescription').value;

    if (!date) {
        alert('Please select a date for the task');
        return;
    }

    const task = {
        id: Date.now(),
        title,
        date,
        description,
        completed: false
    };

    tasks.push(task);
    saveTasks();
    displayTodayTasks();
    updateCalendar();
    taskModal.style.display = 'none';
    taskForm.reset();
}

function completeTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        const task = tasks[taskIndex];
        task.completed = true;
        task.completedAt = new Date().toISOString();
        completedTasks.push(task);
        tasks.splice(taskIndex, 1);
        saveTasks();
        displayTodayTasks();
        displayCompletedTasks();
        updateCalendar();
    }
}

function deleteTask(taskId, isCompleted = false) {
    if (isCompleted) {
        completedTasks = completedTasks.filter(task => task.id !== taskId);
    } else {
        tasks = tasks.filter(task => task.id !== taskId);
    }
    saveTasks();
    displayTodayTasks();
    displayCompletedTasks();
    updateCalendar();
}

// Display Functions
function displayTodayTasks() {
    // Get today's date and format it to YYYY-MM-DD
    const today = new Date();
    const todayString = formatDate(today);
    
    // Filter tasks for today only and not completed
    const todayTasks = tasks.filter(task => {
        return task.date === todayString && !task.completed;
    });
    
    tasksList.innerHTML = todayTasks.map(task => `
        <div class="task-item">
            <div>
                <h3>${task.title}</h3>
                <p>${task.description}</p>
            </div>
            <div class="task-actions">
                <button onclick="completeTask(${task.id})" class="complete-btn">
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="deleteTask(${task.id})" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('') || '<p>No tasks for today</p>';

    // Update the date display
    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    const dateDisplayHTML = `
        <div class="date-display">
            <div class="current-date">${today.toLocaleDateString('en-US', dateOptions)}</div>
            <div class="motivation-message"></div>
        </div>
    `;
    
    dateDisplay.innerHTML = dateDisplayHTML;
    updateMotivationMessage();
}

function displayCompletedTasks() {
    const completedTasksList = document.querySelector('.completed-tasks');
    
    if (completedTasks.length === 0) {
        completedTasksList.innerHTML = '<p>No completed tasks yet</p>';
        return;
    }

    // Sort completed tasks by date (most recent first)
    const sortedTasks = completedTasks.sort((a, b) => {
        return new Date(b.completedAt) - new Date(a.completedAt);
    });

    // Group tasks by completion date
    const groupedTasks = {};
    sortedTasks.forEach(task => {
        const date = new Date(task.completedAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!groupedTasks[date]) {
            groupedTasks[date] = [];
        }
        groupedTasks[date].push(task);
    });

    // Generate HTML for grouped tasks
    const tasksHTML = Object.entries(groupedTasks).map(([date, tasks]) => `
        <div class="completed-date-group">
            <h2 class="completed-date">${date}</h2>
            ${tasks.map(task => `
                <div class="task-item">
                    <div class="task-content">
                        <h3>${task.title}</h3>
                        <p>${task.description}</p>
                        <div class="task-meta">
                            <span class="task-scheduled-date">Scheduled for: ${new Date(task.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button onclick="deleteTask(${task.id}, true)" class="delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');

    completedTasksList.innerHTML = tasksHTML;
    updateGrowthAnalysis();
}

function updateGrowthAnalysis() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter tasks for current month
    const monthlyTasks = tasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
    });

    const completedMonthlyTasks = monthlyTasks.filter(task => task.completed);
    
    // Calculate completion rate
    const completionRate = monthlyTasks.length > 0 
        ? Math.round((completedMonthlyTasks.length / monthlyTasks.length) * 100) 
        : 0;

    // Calculate streak
    let currentStreak = 0;
    let lastCompletedDate = null;
    
    completedTasks
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .forEach(task => {
            const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
            if (!lastCompletedDate) {
                lastCompletedDate = completedDate;
                currentStreak = 1;
            } else {
                const yesterday = new Date(lastCompletedDate);
                yesterday.setDate(yesterday.getDate() - 1);
                if (completedDate === yesterday.toISOString().split('T')[0]) {
                    currentStreak++;
                } else {
                    return;
                }
            }
        });

    // Update the UI
    const progressCircle = document.querySelector('.progress-circle');
    progressCircle.style.setProperty('--progress', `${completionRate * 3.6}deg`);
    document.querySelector('.progress-value').textContent = `${completionRate}%`;
    document.querySelector('.streak-count').textContent = `${currentStreak} days`;
    document.querySelector('.total-count').textContent = completedMonthlyTasks.length;
}

// Calendar Functions
function updateCalendar() {
    const calendarGrid = document.querySelector('.calendar-grid');
    const currentMonthElement = document.querySelector('.current-month');
    
    // Get the first day and last day of the current month
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Update month display
    currentMonthElement.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Clear the grid
    calendarGrid.innerHTML = '';
    
    // Add weekday headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        const weekdayCell = document.createElement('div');
        weekdayCell.className = 'weekday';
        weekdayCell.textContent = day;
        calendarGrid.appendChild(weekdayCell);
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Get today's date for highlighting
    const today = new Date();
    const todayString = formatDate(today);
    const isCurrentMonth = today.getMonth() === currentDate.getMonth() && 
                          today.getFullYear() === currentDate.getFullYear();
    
    // Add cells for each day of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        
        // Check if this is today
        if (isCurrentMonth && day === today.getDate()) {
            cell.classList.add('today');
        }
        
        const dateString = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        const dayTasks = tasks.filter(task => task.date === dateString && !task.completed);
        
        if (dayTasks.length > 0) {
            cell.classList.add('has-tasks');
        }
        
        cell.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-tasks">
                ${dayTasks.map(task => `
                    <div class="task-title">
                        <span class="task-title-text">${task.title}</span>
                        <button class="delete-task-btn" onclick="event.stopPropagation(); deleteTask(${task.id})">×</button>
                    </div>
                `).join('')}
            </div>
        `;
        
        cell.addEventListener('click', () => {
            selectedDate = dateString;
            showQuickTaskModal(dateString);
        });
        
        calendarGrid.appendChild(cell);
    }
    
    // Add empty cells for remaining grid spaces to maintain grid structure
    const totalCells = 42; // 6 rows × 7 days
    const remainingCells = totalCells - (firstDay.getDay() + lastDay.getDate());
    for (let i = 0; i < remainingCells; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }

    // After creating calendar days, update their height
    const calendarDays = document.querySelectorAll('.calendar-day:not(.empty)');
    calendarDays.forEach(day => {
        const dayTasks = day.querySelector('.day-tasks');
        if (dayTasks) {
            dayTasks.style.maxHeight = `${day.offsetHeight - 40}px`;
        }
    });
}

function showQuickTaskModal(dateString) {
    // Remove any existing modal
    const existingModal = document.querySelector('.quick-task-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create new modal
    const modal = document.createElement('div');
    modal.className = 'quick-task-modal';
    modal.innerHTML = `
        <h3>Add Task for ${new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h3>
        <input type="text" class="quick-task-input" placeholder="Enter task title">
        <div class="quick-task-buttons">
            <button class="quick-task-btn cancel">Cancel</button>
            <button class="quick-task-btn save">Save Task</button>
        </div>
    `;

    // Add modal to body
    document.body.appendChild(modal);

    // Focus input
    const input = modal.querySelector('.quick-task-input');
    input.focus();

    // Add event listeners
    const cancelBtn = modal.querySelector('.cancel');
    const saveBtn = modal.querySelector('.save');

    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });

    saveBtn.addEventListener('click', () => {
        const title = input.value.trim();
        if (title) {
            addQuickTask(title, dateString);
            modal.remove();
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const title = input.value.trim();
            if (title) {
                addQuickTask(title, dateString);
                modal.remove();
            }
        }
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function addQuickTask(title, dateString) {
    const task = {
        id: Date.now(),
        title,
        date: dateString,
        description: '',
        completed: false
    };

    tasks.push(task);
    saveTasks();
    updateCalendar();
}

// Settings Functions
function loadSettings() {
    // Set dark mode by default
    localStorage.setItem('darkMode', 'true');
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const wallpaper = localStorage.getItem('wallpaper');
    
    darkModeToggle.checked = darkMode;
    if (darkMode) {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }
    
    if (wallpaper) {
        document.body.style.backgroundImage = `url(${wallpaper})`;
    }
}

function toggleDarkMode() {
    const isDarkMode = darkModeToggle.checked;
    localStorage.setItem('darkMode', isDarkMode);
    if (isDarkMode) {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }
}

function handleWallpaperUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const wallpaper = e.target.result;
            localStorage.setItem('wallpaper', wallpaper);
            applyWallpaperSettings();
            document.getElementById('wallpaperControls').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function applyWallpaperSettings() {
    const wallpaper = localStorage.getItem('wallpaper');
    if (wallpaper) {
        // Remove any existing wallpaper overlay
        const existingOverlay = document.getElementById('wallpaper-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Create new wallpaper overlay
        const overlay = document.createElement('div');
        overlay.id = 'wallpaper-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = '-1';
        overlay.style.backgroundImage = `url(${wallpaper})`;
        overlay.style.backgroundSize = wallpaperSettings.position;
        overlay.style.backgroundRepeat = wallpaperSettings.position === 'repeat' ? 'repeat' : 'no-repeat';
        overlay.style.backgroundPosition = 'center';
        overlay.style.opacity = wallpaperSettings.transparency / 100;
        overlay.style.filter = `blur(${wallpaperSettings.blur}px)`;
        
        document.body.insertBefore(overlay, document.body.firstChild);
        document.getElementById('wallpaperControls').style.display = 'block';
    } else {
        const existingOverlay = document.getElementById('wallpaper-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        document.getElementById('wallpaperControls').style.display = 'none';
    }
    
    // Update control values
    document.getElementById('transparencySlider').value = wallpaperSettings.transparency;
    document.getElementById('transparencyValue').textContent = `${wallpaperSettings.transparency}%`;
    document.getElementById('wallpaperPosition').value = wallpaperSettings.position;
    document.getElementById('blurSlider').value = wallpaperSettings.blur;
    document.getElementById('blurValue').textContent = `${wallpaperSettings.blur}px`;
}

function updateWallpaperSettings() {
    localStorage.setItem('wallpaperSettings', JSON.stringify(wallpaperSettings));
    applyWallpaperSettings();
}

// Local Storage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
}

// Midnight Check
function checkMidnightTasks() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const timeUntilMidnight = midnight - now;
    
    setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        const incompleteTasks = tasks.filter(task => task.date === today && !task.completed);
        
        if (incompleteTasks.length > 0) {
            const message = `You have ${incompleteTasks.length} incomplete task(s) for today. Remember: "The only way to do great work is to love what you do."`;
            alert(message);
        }
        
        checkMidnightTasks(); // Schedule next check
    }, timeUntilMidnight);
}

// User Name Functions
function updateUserName() {
    const newName = nameInput.value.trim();
    if (newName) {
        userName = newName;
        localStorage.setItem('userName', userName);
        updateUserNameDisplay();
        nameInput.value = '';
        // Hide the input section
        document.querySelector('.name-input-container').style.display = 'none';
        // Show the edit button
        document.querySelector('.edit-name-btn').style.display = 'block';
    }
}

function updateUserNameDisplay() {
    userNameDisplay.textContent = userName;
    // Show/hide input section based on whether name is set
    const nameInputContainer = document.querySelector('.name-input-container');
    const editNameBtn = document.querySelector('.edit-name-btn');
    if (userName && userName !== 'Friend') {
        nameInputContainer.style.display = 'none';
        editNameBtn.style.display = 'block';
    } else {
        nameInputContainer.style.display = 'flex';
        editNameBtn.style.display = 'none';
    }
}

function showNameInput() {
    document.querySelector('.name-input-container').style.display = 'flex';
    document.querySelector('.edit-name-btn').style.display = 'none';
    nameInput.focus();
}

// Add motivation messages
const motivationMessages = [
    "Code like you're debugging the universe! 🌟",
    "Every line of code is a step towards mastery! 💪",
    "Your code today shapes tomorrow's innovations! 🚀",
    "Stay focused, stay coding! 💻",
    "8 hours of coding = 8 hours of growth! 📈",
    "Your dedication to coding is inspiring! ✨",
    "Keep pushing your coding boundaries! 🎯",
    "Code with passion, debug with patience! 🔍",
    "Your code is your superpower! ⚡",
    "Make today's code better than yesterday's! 🎨"
];

function updateMotivationMessage() {
    const messageElement = document.querySelector('.motivation-message');
    const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
    messageElement.textContent = randomMessage;
}

// Update motivation message every 8 hours
setInterval(updateMotivationMessage, 8 * 60 * 60 * 1000);

// Helper function to format date consistently
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Initialize the application
init(); 