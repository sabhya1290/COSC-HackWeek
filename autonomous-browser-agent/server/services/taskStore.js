import crypto from 'crypto';

class TaskStore {
  constructor() {
    this.tasks = new Map();
  }

  createTask(prompt) {
    const id = crypto.randomUUID();
    const task = {
      id,
      prompt,
      status: 'queued', // queued | planning | running | completed | failed
      plan: [],
      logs: [],
      results: {},
      screenshots: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.tasks.set(id, task);
    this.addLog(id, 'Task initialized in queue.', 'info');
    return task;
  }

  getTask(id) {
    return this.tasks.get(id);
  }

  getAllTasks() {
    return Array.from(this.tasks.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  updateTaskStatus(id, status) {
    const task = this.tasks.get(id);
    if (task) {
      task.status = status;
      task.updatedAt = new Date().toISOString();
      this.addLog(id, `Status changed to: ${status}`, 'info');
      this.tasks.set(id, task);
    }
    return task;
  }

  setTaskPlan(id, plan) {
    const task = this.tasks.get(id);
    if (task) {
      task.plan = plan;
      task.updatedAt = new Date().toISOString();
      this.addLog(id, 'Execution plan generated.', 'success');
      this.tasks.set(id, task);
    }
    return task;
  }

  updateStepStatus(id, stepIndex, status) {
    const task = this.tasks.get(id);
    if (task && task.plan[stepIndex]) {
      task.plan[stepIndex].status = status; // pending | running | success | failed
      task.updatedAt = new Date().toISOString();
      this.tasks.set(id, task);
    }
  }

  addLog(id, message, type = 'info') {
    const task = this.tasks.get(id);
    if (task) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        message,
        type // info | success | warning | error
      };
      task.logs.push(logEntry);
      task.updatedAt = new Date().toISOString();
      this.tasks.set(id, task);
    }
  }

  addScreenshot(id, filepath) {
    const task = this.tasks.get(id);
    if (task) {
      task.screenshots.push(filepath);
      task.updatedAt = new Date().toISOString();
      this.tasks.set(id, task);
    }
  }

  setResults(id, results) {
    const task = this.tasks.get(id);
    if (task) {
      task.results = results;
      task.updatedAt = new Date().toISOString();
      this.tasks.set(id, task);
    }
  }
}

export const taskStore = new TaskStore();
