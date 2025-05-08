document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const reminderInput = document.getElementById('reminder-input');
    const addTaskBtn = document.getElementById('add-task');
    const taskList = document.getElementById('task-list');
    const filterBtns = document.querySelectorAll('.filter');
    const tasksCount = document.getElementById('tasks-count');
    const clearCompletedBtn = document.getElementById('clear-completed');
    
    // מודל לעריכת משימה
    const editModal = document.getElementById('edit-modal');
    const closeModal = document.querySelector('.close-modal');
    const editTaskInput = document.getElementById('edit-task-input');
    const editReminderInput = document.getElementById('edit-reminder-input');
    const editPriorityInput = document.getElementById('edit-priority-input');
    const saveEditBtn = document.getElementById('save-edit-btn');
    
    // משתנה לשמירת המשימה הנוכחית בעריכה
    let currentEditingTaskId = null;

    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

    // Initialize
    renderTasks();
    updateTasksCount();
    taskInput.focus();
    setupNotifications();
    checkForDueReminders();

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
    
    // מאזיני אירועים למודל עריכה
    closeModal.addEventListener('click', () => {
        editModal.classList.remove('show');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.classList.remove('show');
        }
    });
    
    saveEditBtn.addEventListener('click', saveTaskEdit);

    // Functions
    function addTask() {
        const taskText = taskInput.value.trim();
        const reminderTime = reminderInput.value;
        
        if (taskText) {
            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
                createdAt: new Date().toISOString(),
                reminder: reminderTime || null,
                priority: 'medium' // עדיפות ברירת מחדל
            };
            
            // הוספת משימה עם אנימציה
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            updateTasksCount();
            
            // איפוס שדות הקלט
            taskInput.value = '';
            reminderInput.value = '';
            taskInput.focus();
            
            // הצגת התראה
            if (reminderTime) {
                showNotification(`משימה נוספה בהצלחה עם תזכורת ל-${formatReminderTime(reminderTime)}!`);
            } else {
                showNotification('משימה נוספה בהצלחה!');
            }
            
            // רישום התזכורת אם קיימת
            if (reminderTime && Notification.permission === 'granted') {
                registerReminderNotification(newTask);
            }
        }
    }

    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                const updated = { ...task, completed: !task.completed };
                // שליחת התראה
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
        // קבלת המשימה למחיקה כדי להציג את הטקסט בהתראה
        const taskToDelete = tasks.find(task => task.id === id);
        
        // הוספת אנימציית היעלמות לפני המחיקה
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
    
    function editTask(id) {
        const task = tasks.find(task => task.id === id);
        if (!task) return;
        
        // שמירת המשימה הנוכחית בעריכה
        currentEditingTaskId = id;
        
        // מילוי הפרטים במודל העריכה
        editTaskInput.value = task.text;
        editReminderInput.value = task.reminder || '';
        editPriorityInput.value = task.priority || 'medium';
        
        // הצגת המודל
        editModal.classList.add('show');
    }
    
    function saveTaskEdit() {
        if (!currentEditingTaskId) return;
        
        const newText = editTaskInput.value.trim();
        const newReminder = editReminderInput.value;
        const newPriority = editPriorityInput.value;
        
        if (!newText) {
            showNotification('שם המשימה לא יכול להיות ריק', true);
            return;
        }
        
        tasks = tasks.map(task => {
            if (task.id === currentEditingTaskId) {
                return {
                    ...task,
                    text: newText,
                    reminder: newReminder || null,
                    priority: newPriority
                };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        
        // סגירת המודל
        editModal.classList.remove('show');
        
        // איפוס המשימה הנוכחית בעריכה
        currentEditingTaskId = null;
        
        showNotification('המשימה עודכנה בהצלחה!');
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
            if (currentFilter === 'reminder') return task.reminder !== null && task.reminder !== undefined && task.reminder !== '';
            return true;
        });

        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-list';
            
            if (currentFilter === 'all') {
                emptyMessage.innerHTML = '<i class="fas fa-inbox"></i><p>אין משימות. הוסף משימה חדשה!</p>';
            } else if (currentFilter === 'active') {
                emptyMessage.innerHTML = '<i class="fas fa-check-circle"></i><p>אין משימות פעילות. כל הכבוד!</p>';
            } else if (currentFilter === 'completed') {
                emptyMessage.innerHTML = '<i class="fas fa-tasks"></i><p>אין משימות שהושלמו</p>';
            } else if (currentFilter === 'reminder') {
                emptyMessage.innerHTML = '<i class="fas fa-bell"></i><p>אין משימות עם תזכורות</p>';
            }
            
            taskList.appendChild(emptyMessage);
            return;
        }

        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''} ${task.priority ? 'priority-' + task.priority : ''}`;
            taskItem.setAttribute('data-id', task.id);
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-check';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => toggleTask(task.id));
            
            // יצירת אלמנט הכולל את טקסט המשימה ומידע נוסף
            const textWithMeta = document.createElement('div');
            textWithMeta.className = 'text-with-meta';
            
            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = task.text;
            
            textWithMeta.appendChild(taskText);
            
            // הוספת תזכורת אם קיימת
            if (task.reminder) {
                const reminderElement = document.createElement('span');
                reminderElement.className = 'task-reminder';
                
                // בדיקה אם התזכורת היא בעבר
                const isDue = new Date(task.reminder) < new Date();
                if (isDue) {
                    reminderElement.classList.add('due');
                }
                
                reminderElement.innerHTML = `<i class="fas fa-bell"></i> ${formatReminderTime(task.reminder)}`;
                textWithMeta.appendChild(reminderElement);
            }
            
            // יצירת div לפעולות (עריכה ומחיקה)
            const taskActions = document.createElement('div');
            taskActions.className = 'task-actions';
            
            // כפתור עריכה
            const editButton = document.createElement('button');
            editButton.className = 'edit-task';
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.addEventListener('click', () => editTask(task.id));
            
            // כפתור מחיקה
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-task';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.addEventListener('click', () => deleteTask(task.id));
            
            taskActions.appendChild(editButton);
            taskActions.appendChild(deleteButton);
            
            taskItem.appendChild(checkbox);
            taskItem.appendChild(textWithMeta);
            taskItem.appendChild(taskActions);
            
            taskList.appendChild(taskItem);
        });
    }

    function updateTasksCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        tasksCount.innerHTML = `<i class="fas fa-clipboard-check"></i> ${activeTasks} משימות נותרו`;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        checkForDueReminders();
    }
    
    function showNotification(message, isError = false) {
        // בדיקה אם התראה כבר קיימת והסרתה
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'notification ' + (isError ? 'error' : '');
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // הצגת התראה עם אנימציה
        setTimeout(() => notification.classList.add('show'), 10);
        
        // הסרת ההתראה אחרי השהייה
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // פונקציה לעיצוב תאריך ושעה בפורמט מתאים
    function formatReminderTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleString('he-IL', { 
            year: 'numeric', 
            month: 'numeric', 
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        });
    }
    
    // פונקציה להגדרת הרשאות להתראות במערכת
    function setupNotifications() {
        if (!("Notification" in window)) {
            console.log("דפדפן זה אינו תומך בהתראות.");
            return;
        }
        
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
    
    // פונקציה לרישום התראה במערכת
    function registerReminderNotification(task) {
        if (!task.reminder) return;
        
        const reminderTime = new Date(task.reminder).getTime();
        const now = new Date().getTime();
        const timeUntilReminder = reminderTime - now;
        
        if (timeUntilReminder <= 0) return; // התזכורת כבר עברה
        
        setTimeout(() => {
            // בדיקה שהמשימה עדיין קיימת ושלא הושלמה
            const currentTask = tasks.find(t => t.id === task.id);
            if (currentTask && !currentTask.completed) {
                showReminderNotification(currentTask);
            }
        }, timeUntilReminder);
    }
    
    // פונקציה להצגת התראת מערכת
    function showReminderNotification(task) {
        if (Notification.permission !== 'granted') return;
        
        const notification = new Notification('תזכורת למשימה', {
            body: task.text,
            icon: 'https://cdn-icons-png.flaticon.com/512/1345/1345823.png'
        });
        
        notification.onclick = function() {
            window.focus();
            document.querySelector(`[data-id="${task.id}"]`)?.scrollIntoView();
        };
    }
    
    // פונקציה לבדיקת תזכורות
    function checkForDueReminders() {
        const now = new Date();
        
        tasks.forEach(task => {
            if (task.reminder && !task.completed) {
                const reminderTime = new Date(task.reminder);
                const timeUntilReminder = reminderTime.getTime() - now.getTime();
                
                if (timeUntilReminder > 0 && timeUntilReminder < 60000) { // פחות מדקה
                    registerReminderNotification(task);
                }
            }
        });
    }
    
    // בדיקת תזכורות כל דקה
    setInterval(checkForDueReminders, 60000);
}); 