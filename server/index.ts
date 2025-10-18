import express from 'express';
import cors from 'cors';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { pressPasses } from '../shared/schema';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Health check endpoint
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok' });
});

// Track/create a new press pass
app.post('/api/track-pass', async (req, res) => {
  try {
    const { name, email, title, pass_number, organization } = req.body;

    // Validate required fields
    if (!name || !email || !pass_number) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, or pass_number' 
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Insert the new press pass
    const newPass = await db.insert(pressPasses).values({
      name,
      email,
      title: title || null,
      passNumber: pass_number,
      downloadType: 'download',
      contactEmail: 'press@freepresspass.com'
    }).returning();

    res.json(newPass[0]);
  } catch (error) {
    console.error('Error creating press pass:', error);
    res.status(500).json({ 
      error: 'Failed to create press pass',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all press passes
app.get('/api/get-passes', async (req, res) => {
  try {
    const passes = await db.select().from(pressPasses).orderBy(pressPasses.createdAt);
    res.json(passes);
  } catch (error) {
    console.error('Error fetching press passes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch press passes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific pass by ID
app.get('/api/get-pass/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pass = await db.select().from(pressPasses).where(eq(pressPasses.passNumber, id));
    
    if (!pass || pass.length === 0) {
      return res.status(404).json({ error: 'Press pass not found' });
    }
    
    res.json(pass[0]);
  } catch (error) {
    console.error('Error fetching press pass:', error);
    res.status(500).json({ 
      error: 'Failed to fetch press pass',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
