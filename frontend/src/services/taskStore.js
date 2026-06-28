const TASKS_KEY = "careerpilot_tasks";
const HISTORY_KEY = "careerpilot_chat_history";

function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Silently handle storage errors
  }
}

export function getTasks() {
  return loadFromStorage(TASKS_KEY);
}

export function addTask(task) {
  const tasks = getTasks();
  const newTask = {
    id: Date.now(),
    text: task.text,
    status: "pending",
    createdAt: new Date().toISOString(),
    completed: false,
  };
  tasks.push(newTask);
  saveToStorage(TASKS_KEY, tasks);
  return newTask;
}

export function completeTask(taskId) {
  const tasks = getTasks();
  const updated = tasks.map((t) =>
    t.id === taskId ? { ...t, completed: true, status: "completed" } : t
  );
  saveToStorage(TASKS_KEY, updated);
  return updated;
}

export function deleteTask(taskId) {
  const tasks = getTasks().filter((t) => t.id !== taskId);
  saveToStorage(TASKS_KEY, tasks);
  return tasks;
}

export function clearTasks() {
  saveToStorage(TASKS_KEY, []);
}

export function getChatHistory() {
  return loadFromStorage(HISTORY_KEY);
}

export function addChatMessage(message) {
  const history = getChatHistory();
  history.push({
    ...message,
    id: Date.now(),
    timestamp: new Date().toISOString(),
  });
  saveToStorage(HISTORY_KEY, history);
  return message;
}

export function clearChatHistory() {
  saveToStorage(HISTORY_KEY, []);
}
