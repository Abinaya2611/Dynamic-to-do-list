// Task class for better organization
class Task {
    constructor(text, category, priority, dueDate, completed = false) {
        this.id = Date.now() + Math.random();
        this.text = text;
        this.category = category;
        this.priority = priority;
        this.dueDate = dueDate;
        this.completed = completed;
    }
}

// App class to manage the application
class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.taskList = document.getElementById('task-list');
        this.init();
    }

    init() {
        this.renderTasks();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.updateStats();
    }

    setupEventListeners() {
        document.getElementById('add-btn').addEventListener('click', () => this.addTask());
        document.getElementById('task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        document.getElementById('search-input').addEventListener('input', () => this.filterTasks());
        document.getElementById('filter-category').addEventListener('change', () => this.filterTasks());
        document.getElementById('filter-priority').addEventListener('change', () => this.filterTasks());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('export-btn').addEventListener('click', () => this.exportTasks());
        document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
        document.getElementById('import-file').addEventListener('change', (e) => this.importTasks(e));
    }

    addTask() {
        const input = document.getElementById('task-input');
        const category = document.getElementById('category-select').value;
        const priority = document.getElementById('priority-select').value;
        const dueDate = document.getElementById('due-date').value;
        const text = input.value.trim();

        if (text) {
            const task = new Task(text, category, priority, dueDate);
            this.tasks.push(task);
            this.saveTasks();
            this.renderTasks();
            input.value = '';
            document.getElementById('due-date').value = '';
        }
    }

    renderTasks(filteredTasks = null) {
        const tasksToRender = filteredTasks || this.tasks;
        this.taskList.innerHTML = '';
        tasksToRender.forEach(task => {
            const li = this.createTaskElement(task);
            this.taskList.appendChild(li);
        });
        this.updateStats();
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''} fade-in`;
        li.dataset.id = task.id;

        const details = document.createElement('div');
        details.className = 'task-details';

        const text = document.createElement('div');
        text.className = 'task-text';
        text.textContent = task.text;
        text.addEventListener('click', () => this.toggleComplete(task.id));

        const meta = document.createElement('div');
        meta.className = 'task-meta';
        meta.textContent = `Category: ${task.category} | Priority: ${task.priority} | Due: ${task.dueDate || 'None'}`;

        details.appendChild(text);
        details.appendChild(meta);

        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = '✏️';
        editBtn.addEventListener('click', () => this.editTask(task.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(details);
        li.appendChild(actions);

        return li;
    }

    toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const newText = prompt('Edit task:', task.text);
            if (newText) {
                task.text = newText.trim();
                this.saveTasks();
                this.renderTasks();
            }
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
    }

    filterTasks() {
        const search = document.getElementById('search-input').value.toLowerCase();
        const category = document.getElementById('filter-category').value;
        const priority = document.getElementById('filter-priority').value;

        const filtered = this.tasks.filter(task => {
            return (task.text.toLowerCase().includes(search)) &&
                   (category === 'all' || task.category === category) &&
                   (priority === 'all' || task.priority === priority);
        });
        this.renderTasks(filtered);
    }

    setupDragAndDrop() {
        dragula([this.taskList]).on('drop', () => {
            const newOrder = Array.from(this.taskList.children).map(li => {
                return this.tasks.find(t => t.id == li.dataset.id);
            });
            this.tasks = newOrder;
            this.saveTasks();
        });
    }

    toggleTheme() {
        document.body.classList.toggle('dark');
        const btn = document.getElementById('theme-toggle');
        btn.textContent = document.body.classList.contains('dark') ? '☀️ Light Mode' : '🌙 Dark Mode';
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const overdue = this.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed).length;

        document.getElementById('total-tasks').textContent = total;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('overdue-tasks').textContent = overdue;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const stored = localStorage.getItem('tasks');
        return stored ? JSON.parse(stored).map(t => new Task(t.text, t.category, t.priority, t.dueDate, t.completed)) : [];
    }

    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importTasks(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedTasks = JSON.parse(e.target.result).map(t => new Task(t.text, t.category, t.priority, t.dueDate, t.completed));
                    this.tasks = [...this.tasks, ...importedTasks];
                    this.saveTasks();
                    this.renderTasks();
                } catch (err) {
                    alert('Invalid file format.');
                }
            };
            reader.readAsText(file);
        }
    }
}

// Initialize the app
new TodoApp();