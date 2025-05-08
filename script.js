document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task');
    const taskList = document.getElementById('task-list');
    const filterBtns = document.querySelectorAll('.filter');
    const tasksCount = document.getElementById('tasks-count');
    const clearCompletedBtn = document.getElementById('clear-completed');

    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

    // Initialize
    renderTasks();
    updateTasksCount();
    taskInput.focus();

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderTasks();
        });
    });

    // Functions
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText) {
            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            // Add task with animation
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            updateTasksCount();
            
            // Reset input with focus
            taskInput.value = '';
            taskInput.focus();
            
            // Show success feedback
            showNotification('משימה נוספה בהצלחה!');
        }
    }

    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                const updated = { ...task, completed: !task.completed };
                // Show feedback
                showNotification(updated.completed ? 'משימה הושלמה! 🎉' : 'משימה סומנה כלא הושלמה');
                return updated;
            }
            return task;
        });
        saveTasks();
        renderTasks();
        updateTasksCount();
    }

    function deleteTask(id) {
        // Get task first to show its text in notification
        const taskToDelete = tasks.find(task => task.id === id);
        
        // Add fade out animation before removing
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            taskElement.classList.add('fade-out');
            setTimeout(() => {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                renderTasks();
                updateTasksCount();
                showNotification(`"${taskToDelete.text}" נמחקה`);
            }, 300);
        }
    }

    function clearCompleted() {
        const completedCount = tasks.filter(task => task.completed).length;
        
        if (completedCount === 0) {
            showNotification('אין משימות שהושלמו למחיקה');
            return;
        }
        
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTasksCount();
        showNotification(`${completedCount} משימות שהושלמו נמחקו`);
    }

    function renderTasks() {
        taskList.innerHTML = '';
        
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-list';
            
            if (currentFilter === 'all') {
                emptyMessage.innerHTML = '<i class="fas fa-inbox"></i><p>אין משימות. הוסף משימה חדשה!</p>';
            } else if (currentFilter === 'active') {
                emptyMessage.innerHTML = '<i class="fas fa-check-circle"></i><p>אין משימות פעילות. כל הכבוד!</p>';
            } else {
                emptyMessage.innerHTML = '<i class="fas fa-tasks"></i><p>אין משימות שהושלמו</p>';
            }
            
            taskList.appendChild(emptyMessage);
            return;
        }

        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.setAttribute('data-id', task.id);
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-check';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => toggleTask(task.id));
            
            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = task.text;
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-task';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.addEventListener('click', () => deleteTask(task.id));
            
            taskItem.appendChild(checkbox);
            taskItem.appendChild(taskText);
            taskItem.appendChild(deleteButton);
            
            taskList.appendChild(taskItem);
        });
    }

    function updateTasksCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        tasksCount.innerHTML = `<i class="fas fa-clipboard-check"></i> ${activeTasks} משימות נותרו`;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function showNotification(message) {
        // Check if notification already exists and remove it
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Show notification with animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove notification after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}); 