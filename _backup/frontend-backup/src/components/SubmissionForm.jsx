import { useState, useEffect } from 'react';
import useEntries from '../hooks/useEntries.js';
import styles from './SubmissionForm.module.css';

const INITIAL_FORM = {
  type: 'memo',
  clientName: '',
  question: '',
  memo: '',
  tags: '',
  conversation: '',
};

function validate(form) {
  const errors = {};

  if (!form.clientName.trim()) {
    errors.clientName = 'Client name is required.';
  }

  if (!form.question.trim()) {
    errors.question = 'Question / Topic is required.';
  } else if (form.question.trim().length < 20) {
    errors.question = 'Question must be at least 20 characters.';
  }

  if (!form.memo.trim()) {
    errors.memo = 'Memo / Answer is required.';
  } else if (form.memo.trim().length < 20) {
    errors.memo = 'Memo must be at least 20 characters.';
  }

  return errors;
}

function parseTags(rawTags) {
  return rawTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function SubmissionForm() {
  const { submitEntry, loading, error, successMessage, clearStatus } = useEntries();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  // Clear form when submission succeeds
  useEffect(() => {
    if (successMessage) {
      setForm(INITIAL_FORM);
      setFieldErrors({});
    }
  }, [successMessage]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear field-level error as the user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    // Clear API-level status when user resumes editing
    if (error || successMessage) {
      clearStatus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    await submitEntry({
      type: form.type,
      clientName: form.clientName.trim(),
      question: form.question.trim(),
      memo: form.memo.trim(),
      tags: parseTags(form.tags),
      conversation: form.conversation.trim(),
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={`glass glow-amber ${styles.card}`}>
        <h2 className={styles.title}>Submit Research Entry</h2>
        <p className={styles.subtitle}>
          Contribute to the firm knowledge base. Entries are reviewed before publishing.
        </p>

        {/* Success banner */}
        {successMessage && (
          <div className={styles.successBanner} role="status">
            <span className={styles.successIcon}>&#10003;</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <span className={styles.errorIcon}>&#9888;</span>
            <span>
              Submission failed. Please try again. {error}
            </span>
          </div>
        )}

        <form
          aria-label="Submit Research Entry"
          onSubmit={handleSubmit}
          noValidate
          className={styles.form}
        >
          {/* Type */}
          <div className={styles.fieldGroup}>
            <label htmlFor="type" className={styles.label}>
              Type
            </label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
              className={`glass-input ${styles.select}`}
            >
              <option value="memo">Memo</option>
              <option value="sop">SOP</option>
              <option value="policy">Policy</option>
            </select>
          </div>

          {/* Client Name */}
          <div className={styles.fieldGroup}>
            <label htmlFor="clientName" className={styles.label}>
              Client Name <span className={styles.required}>*</span>
            </label>
            <input
              id="clientName"
              name="clientName"
              type="text"
              value={form.clientName}
              onChange={handleChange}
              placeholder="e.g. Smith Enterprises LLC"
              className={`glass-input ${styles.input} ${fieldErrors.clientName ? styles.inputError : ''}`}
              aria-describedby={fieldErrors.clientName ? 'clientName-error' : undefined}
            />
            {fieldErrors.clientName && (
              <span id="clientName-error" className={styles.fieldError} role="alert">
                {fieldErrors.clientName}
              </span>
            )}
          </div>

          {/* Question / Topic */}
          <div className={styles.fieldGroup}>
            <label htmlFor="question" className={styles.label}>
              Question / Topic <span className={styles.required}>*</span>
            </label>
            <textarea
              id="question"
              name="question"
              value={form.question}
              onChange={handleChange}
              placeholder="What is the research question or topic? (min 20 characters)"
              rows={3}
              className={`glass-input ${styles.textarea} ${fieldErrors.question ? styles.inputError : ''}`}
              aria-describedby={fieldErrors.question ? 'question-error' : undefined}
            />
            {fieldErrors.question && (
              <span id="question-error" className={styles.fieldError} role="alert">
                {fieldErrors.question}
              </span>
            )}
          </div>

          {/* Memo / Answer */}
          <div className={styles.fieldGroup}>
            <label htmlFor="memo" className={styles.label}>
              Memo / Answer <span className={styles.required}>*</span>
            </label>
            <textarea
              id="memo"
              name="memo"
              value={form.memo}
              onChange={handleChange}
              placeholder="Detailed answer, analysis, or SOP content (min 20 characters)"
              rows={6}
              className={`glass-input ${styles.textarea} ${fieldErrors.memo ? styles.inputError : ''}`}
              aria-describedby={fieldErrors.memo ? 'memo-error' : undefined}
            />
            {fieldErrors.memo && (
              <span id="memo-error" className={styles.fieldError} role="alert">
                {fieldErrors.memo}
              </span>
            )}
          </div>

          {/* Tags */}
          <div className={styles.fieldGroup}>
            <label htmlFor="tags" className={styles.label}>
              Tags
              <span className={styles.hint}> — comma-separated (e.g. home office, deductions)</span>
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={form.tags}
              onChange={handleChange}
              placeholder="home office, S-corp, deductions, depreciation"
              className={`glass-input ${styles.input}`}
            />
          </div>

          {/* Conversation Transcript (optional) */}
          <div className={styles.fieldGroup}>
            <label htmlFor="conversation" className={styles.label}>
              Conversation Transcript
              <span className={styles.hint}> — optional</span>
            </label>
            <textarea
              id="conversation"
              name="conversation"
              value={form.conversation}
              onChange={handleChange}
              placeholder="Paste raw conversation, email thread, or meeting notes here (optional)"
              rows={5}
              className={`glass-input ${styles.textarea}`}
            />
          </div>

          {/* Submit */}
          <div className={styles.actions}>
            <button
              type="submit"
              disabled={loading}
              className={`glass-button ${styles.submitBtn} ${loading ? styles.submitBtnLoading : ''}`}
            >
              {loading ? 'Submitting...' : 'Submit Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
