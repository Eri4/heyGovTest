import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';


const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
dotenv.config();

let contacts = [];

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function extractContactFromText(text) {
    try {

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4',
                messages: [
                    { role: "system", content: "Extract the contact information such as name, company and email from the text provided by the user." },
                    { role: "user", content: text }
                ],
                max_tokens: 100,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
            }
        );

        const aiResponse = response.data.choices[0].message.content.trim();
        let name = '', email = '', company = '';

        const lines = aiResponse.split('\n');
        lines.forEach(line => {
            if (line.toLowerCase().startsWith('name:')) {
                name = line.substring(5).trim();
            } else if (line.toLowerCase().startsWith('email:')) {
                email = line.substring(6).trim();
            } else if(line.toLowerCase().startsWith('company:')) {
                company = line.substring(7).trim();
            }
        });

        if (!name && !email && !company) {
            throw new Error('No contact information found in the AI response.');
        }

        return { name, email, company };
    } catch (error) {
        console.error('OpenAI API Error:', error.response ? error.response.data : error.message);
        return { name: '', email: '', company: '', error: 'Failed to extract contact info from the provided text.' };
    }
}

app.post('/api/contacts', async (req, res) => {
    const { text, type, name: manualName, email: manualEmail, company: manualCompany } = req.body;

    if (type === 'ai') {
        if (text !== '') {
            const { name, email, company } = await extractContactFromText(text);
            if (name !== '' || email !== '') {
                const contact = { id: Date.now().toString(), name, email, company };
                contacts.push(contact);
                res.status(201).json(contact);
            } else {
                res.status(400).json({ error: 'Unable to extract contact information' });
            }
        } else {
            res.status(400).json({ error: 'Text is required for AI extraction.' });
        }
    } else if (type === 'manual') {
        if (manualName.trim() !== '' || manualEmail.trim() !== '') {
            const contact = {
                id: Date.now().toString(),
                name: manualName.trim(),
                email: manualEmail.trim(),
                company: manualCompany.trim(),
            };
            contacts.push(contact);
            res.status(201).json(contact);
        } else {
            res.status(400).json({ error: 'Name or Email is required for manual addition.' });
        }
    } else {
        res.status(400).json({ error: 'Invalid request type.' });
    }
});

app.get('/api/contacts', (req, res) => {
    const searchTerm = req.query.search ? req.query.search.toLowerCase() : '';
    const filteredContacts = contacts.filter(
        (contact) =>
            contact.name.toLowerCase().includes(searchTerm) || contact.email.toLowerCase().includes(searchTerm)
    );
    res.json(filteredContacts);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});