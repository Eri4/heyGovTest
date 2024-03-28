import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface Contact {
    id: string;
    name: string;
    email: string;
    company: string;
}

const App: React.FC = () => {
    const [manualName, setManualName] = useState('');
    const [manualEmail, setManualEmail] = useState('');
    const [manualCompany, setManualCompany] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [text, setText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, [searchTerm]);

    const fetchContacts = async () => {
        try {
            const response = await axios.get<Contact[]>(`http://localhost:3000/api/contacts?search=${searchTerm}`);
            setContacts(response.data);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    };

    const handleAIExtractionSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) {
            alert("Please enter some text for AI extraction.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:3000/api/contacts', { text, type: 'ai' });
            setContacts([...contacts, response.data]);
            setText('');
        } catch (error) {
            console.error('Error adding contact:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualName.trim() && !manualEmail.trim()) {
            alert("Please enter a name or an email.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:3000/api/contacts', { type: 'manual', name: manualName, email: manualEmail, company: manualCompany });
            setManualName('');
            setManualEmail('')
            setManualCompany('')
            setContacts([...contacts, response.data]);
        } catch (error) {
            console.error('Error adding contact:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderContacts = () => {
        if (contacts.length === 0) {
            return <p>No contacts found. Start adding some!</p>;
        }
        return contacts.map((contact) => (
            <div key={contact.id} className="contact-item">
                <p>
                    <strong>Name:</strong> {contact.name}
                </p>
                <p>
                    <strong>Email:</strong> {contact.email}
                </p>
                <p>
                    <strong>Company:</strong> {contact.company}
                </p>
            </div>
        ));
    };

    return (
        <div className="container">
            <h1>Mini CRM</h1>
            <div className="ai-extraction-form">
                <form onSubmit={handleAIExtractionSubmit}>
                    <textarea
                        placeholder="Today i had a interview with Dustin and Andrei from HeyGov, thier emails are dustin@gmail.com and andrei@gmail.com."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    ></textarea>
                    <button type="submit">Extract and Add Contact</button>
                </form>
            </div>
            <div className="manual-addition-form">
                <form onSubmit={handleManualSubmit} className="manual-form">
                    <input
                        type="text"
                        placeholder="Name"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Email"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Company"
                        value={manualCompany}
                        onChange={(e) => setManualCompany(e.target.value)}
                    />
                    <button type="submit">Add Contact Manually</button>
                </form>
            </div>
            <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="contact-list">
                {renderContacts()}
            </div>
        </div>
    );
};

export default App;