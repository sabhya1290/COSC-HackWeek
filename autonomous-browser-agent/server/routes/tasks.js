import express from 'express';
import { taskStore } from '../services/taskStore.js';
import { generatePlan } from '../services/planner.js';
import { runBrowserAgent } from '../services/browserAgent.js';

const router = express.Router();

// POST /api/plan - generates a structured step-by-step plan
router.post('/plan', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: 'Task prompt is required.' });
  }

  try {
    const task = taskStore.createTask(prompt);
    taskStore.updateTaskStatus(task.id, 'planning');
    
    // Get server port to interpolate local links correctly
    const port = req.app.get('port') || 5000;
    
    const plan = await generatePlan(prompt, port);
    taskStore.setTaskPlan(task.id, plan);
    taskStore.updateTaskStatus(task.id, 'queued');

    res.json({
      id: task.id,
      prompt: task.prompt,
      plan: task.plan,
      status: task.status
    });
  } catch (error) {
    console.error('Planning API error:', error);
    res.status(500).json({ error: 'Failed to generate task plan.' });
  }
});

// POST /api/run - executes the approved steps using Playwright
router.post('/run', async (req, res) => {
  const { id, plan } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Task ID is required.' });
  }

  const task = taskStore.getTask(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  // Update plan if the client sent an approved/edited version
  if (plan && Array.isArray(plan)) {
    taskStore.setTaskPlan(id, plan);
  }

  // Run in background
  runBrowserAgent(id);

  res.json({
    id: task.id,
    status: 'running',
    message: 'Playwright agent has been started in the background.'
  });
});

// GET /api/tasks - lists all tasks (for local dashboard history)
router.get('/tasks', (req, res) => {
  res.json(taskStore.getAllTasks());
});

// GET /api/tasks/:id - returns task details, logs, results, screenshots
router.get('/tasks/:id', (req, res) => {
  const task = taskStore.getTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }
  res.json(task);
});

export default router;
