import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { taskStore } from './taskStore.js';
import { isUrlAllowed } from './safeDomains.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_ACTIONS = 15;
const ACTION_TIMEOUT = 10000; // 10 seconds

export async function runBrowserAgent(taskId) {
  const task = taskStore.getTask(taskId);
  if (!task) return;

  taskStore.updateTaskStatus(taskId, 'running');
  taskStore.addLog(taskId, 'Starting browser agent execution...', 'info');

  const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  let browser;
  let context;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();
    page.setDefaultTimeout(ACTION_TIMEOUT);

    let actionCount = 0;
    const results = {};

    for (let i = 0; i < task.plan.length; i++) {
      const step = task.plan[i];
      actionCount++;

      if (actionCount > MAX_ACTIONS) {
        throw new Error(`Maximum browser action limit (${MAX_ACTIONS}) exceeded. Aborting.`);
      }

      taskStore.updateStepStatus(taskId, i, 'running');
      taskStore.addLog(taskId, `Executing step ${i + 1}: ${step.description}`, 'info');

      try {
        switch (step.action) {
          case 'navigate': {
            if (!step.url) throw new Error('No URL specified for navigation step.');
            
            taskStore.addLog(taskId, `Checking domain permission for URL: ${step.url}`, 'info');
            if (!isUrlAllowed(step.url)) {
              throw new Error(`Navigation blocked: Domain of "${step.url}" is not on the safe allowlist.`);
            }

            taskStore.addLog(taskId, `Navigating to ${step.url}`, 'info');
            await page.goto(step.url, { waitUntil: 'domcontentloaded' });
            break;
          }

          case 'type': {
            if (!step.selector) throw new Error('No CSS selector specified for type action.');
            taskStore.addLog(taskId, `Waiting for selector "${step.selector}" to type`, 'info');
            await page.waitForSelector(step.selector, { state: 'visible', timeout: ACTION_TIMEOUT });
            
            taskStore.addLog(taskId, `Typing value into "${step.selector}"`, 'info');
            await page.fill(step.selector, step.value || '');
            break;
          }

          case 'click': {
            if (!step.selector) throw new Error('No CSS selector specified for click action.');
            taskStore.addLog(taskId, `Waiting for selector "${step.selector}" to click`, 'info');
            await page.waitForSelector(step.selector, { state: 'visible', timeout: ACTION_TIMEOUT });
            
            taskStore.addLog(taskId, `Clicking "${step.selector}"`, 'info');
            await page.click(step.selector);
            break;
          }

          case 'extract': {
            if (!step.selector) throw new Error('No CSS selector specified for extract action.');
            taskStore.addLog(taskId, `Extracting content from selector "${step.selector}"`, 'info');
            
            taskStore.addLog(taskId, `Waiting for selector "${step.selector}" to appear...`, 'info');
            try {
              await page.waitForSelector(step.selector, { state: 'attached', timeout: 5000 });
            } catch (err) {
              taskStore.addLog(taskId, `Timeout waiting for selector "${step.selector}". Skipping extraction.`, 'warning');
              results[`extract_step_${i}`] = 'Element not found';
              taskStore.setResults(taskId, results);
              break;
            }

            const element = page.locator(step.selector).first();
            const tag = await element.evaluate(el => el.tagName.toLowerCase());
            let extractedText = '';

            if (tag === 'table') {
              // Extract tabular data
              extractedText = await element.evaluate(table => {
                const rows = Array.from(table.querySelectorAll('tr'));
                return rows.map(row => {
                  const cells = Array.from(row.querySelectorAll('th, td'));
                  return cells.map(cell => cell.innerText.trim()).join(' | ');
                }).join('\n');
              });
            } else if (tag === 'select') {
              extractedText = await element.inputValue();
            } else {
              extractedText = await element.innerText();
            }

            taskStore.addLog(taskId, `Successfully extracted content: "${extractedText.substring(0, 100)}..."`, 'success');
            results[`extract_step_${i}`] = extractedText;
            taskStore.setResults(taskId, results);
            break;
          }

          case 'wait': {
            const waitTime = parseInt(step.value || '1000', 10);
            taskStore.addLog(taskId, `Waiting for ${waitTime}ms`, 'info');
            await page.waitForTimeout(waitTime);
            break;
          }

          default:
            throw new Error(`Unknown step action: "${step.action}"`);
        }

        // Stability delay
        await page.waitForTimeout(800);

        // Capture screenshot after step completes
        const screenshotFilename = `screenshot_${taskId}_step_${i}.png`;
        const screenshotPath = path.join(screenshotsDir, screenshotFilename);
        
        await page.screenshot({ path: screenshotPath, type: 'png' });
        taskStore.addScreenshot(taskId, `/screenshots/${screenshotFilename}`);
        taskStore.addLog(taskId, `Captured screenshot: /screenshots/${screenshotFilename}`, 'success');

        // Mark step success
        taskStore.updateStepStatus(taskId, i, 'success');

      } catch (stepErr) {
        taskStore.updateStepStatus(taskId, i, 'failed');
        throw stepErr;
      }
    }

    // Task finished successfully
    taskStore.setResults(taskId, results);
    taskStore.updateTaskStatus(taskId, 'completed');
    taskStore.addLog(taskId, 'Task execution completed successfully.', 'success');

  } catch (error) {
    console.error('Browser Agent execution error:', error);
    taskStore.addLog(taskId, `Error occurred: ${error.message}`, 'error');
    taskStore.updateTaskStatus(taskId, 'failed');
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}
