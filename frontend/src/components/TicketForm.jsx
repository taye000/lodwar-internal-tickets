import { useState } from 'react';
import { PRIORITIES, PRIORITY_LABELS } from '../constants';

export default function TicketForm({ onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card ticket-form" onSubmit={handleSubmit}>
      <h2>New ticket</h2>

      <div className="row">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={255}
          aria-label="Title"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          aria-label="Priority"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]} priority
            </option>
          ))}
        </select>
      </div>

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        aria-label="Description"
      />

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create ticket'}
      </button>
    </form>
  );
}