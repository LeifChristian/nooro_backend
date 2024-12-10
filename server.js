import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const TaskSchema = z.object({
  title: z.string().min(1),
  color: z.enum(['red', 'blue', 'green']),
});

app.get('/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/tasks', async (req, res) => {
  try {
    const validated = TaskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: {
        ...validated,
        completed: false,
      },
    });
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ error: 'Invalid task data' });
  }
});

app.get('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Fetching task with ID: ${id}`);
    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!task) {
      console.log(`Task with ID ${id} not found`);
      return res.status(404).json({ error: `Task with ID ${id} not found` });
    }
    console.log(`Task found: ${JSON.stringify(task)}`);
    res.json(task);
  } catch (error) {
    console.error(`Error fetching task with ID ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Updating task with ID: ${id}`);
    const validated = TaskSchema.partial().parse(req.body);
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: validated,
    });
    console.log(`Task updated: ${JSON.stringify(task)}`);
    res.json(task);
  } catch (error) {
    console.error(`Error updating task with ID ${id}:`, error);
    res.status(400).json({ error: 'Invalid task data' });
  }
});

app.put('/tasks/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { completed: !task.completed },
    });
    res.json(updatedTask);
  } catch (error) {
    console.error('Error toggling task:', error);
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.task.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});