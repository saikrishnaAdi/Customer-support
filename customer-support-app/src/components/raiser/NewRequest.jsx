import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { MODULES, PRIORITIES, CATEGORIES, RAISER_STEPS } from '../../data/constants';
import StepGuide from '../common/StepGuide';
import { Send, ArrowLeft, Paperclip, Info, AlertCircle, X, FileText, Image, FileSpreadsheet, File, Mail, CheckCircle, Link2 } from 'lucide-react';
import './NewRequest.css';
import '../common/EmailCompose.css';

export default function NewRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preModule = params.get('module') || '';

  const [form, setForm] = useState({
    module: preModule,
    title: '',
    description: '',
    priority: 'Medium',
    category: 'General',
    linkedRecords: '',
  });
  const [currentStep, setCurrentStep] = useState(preModule ? 1 : 0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [touched, setTouched] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const ALLOWED_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.zip', '.rar'];

  const getFileIcon = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <Image size={18} className="file-icon-img" />;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={18} className="file-icon-sheet" />;
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'].includes(ext)) return <FileText size={18} className="file-icon-doc" />;
    return <File size={18} className="file-icon-other" />;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const addFiles = useCallback((newFiles) => {
    const validFiles = [];
    const errors = [];
    for (const file of newFiles) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_TYPES.includes(ext)) {
        errors.push(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: exceeds 25 MB limit`);
        continue;
      }
      if (files.some((f) => f.name === file.name && f.size === file.size)) {
        errors.push(`${file.name}: already added`);
        continue;
      }
      validFiles.push(file);
    }
    if (errors.length) setApiError(errors.join('. '));
    if (validFiles.length) {
      setFiles((prev) => [...prev, ...validFiles]);
      setCurrentStep(Math.max(currentStep, 2));
    }
  }, [files, currentStep]);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };

  const updateField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear that field's error when user types
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setApiError('');
    if (field === 'module' && value) setCurrentStep(1);
    if (field === 'title' && value) setCurrentStep(Math.max(currentStep, 1));
    if (field === 'description' && value) setCurrentStep(Math.max(currentStep, 2));
  };

  const validate = () => {
    const errs = {};
    if (!form.module) errs.module = 'Please select an eQMS module';
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error
      const firstField = Object.keys(errs)[0];
      const el = document.querySelector(`[data-field="${firstField}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors({});
    setApiError('');
    setSubmitting(true);
    setCurrentStep(3);
    try {
      // Upload files first if any
      let uploadedFiles = [];
      if (files.length > 0) {
        setUploading(true);
        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));
        const uploadRes = await fetch('http://localhost:4000/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || 'File upload failed');
        }
        const uploadData = await uploadRes.json();
        uploadedFiles = uploadData.files;
        setUploading(false);
      }

      const ticket = await api.createTicket({
        ...form,
        raiserId: user.id,
        attachments: uploadedFiles,
        linkedRecords: form.linkedRecords
          ? form.linkedRecords.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      });
      setSubmitted(ticket);
    } catch (err) {
      console.error('Submit failed:', err);
      setApiError(err.message || 'Failed to submit request. Please check your connection and try again.');
      setCurrentStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="new-request">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Request Submitted Successfully!</h2>
          <p>Your support ticket has been created.</p>
          <div className="success-detail">
            <div className="success-row">
              <span className="success-label">Ticket ID</span>
              <span className="success-value ticket-id-highlight">{submitted.id}</span>
            </div>
            <div className="success-row">
              <span className="success-label">Module</span>
              <span className="success-value">{submitted.module}</span>
            </div>
            <div className="success-row">
              <span className="success-label">Priority</span>
              <span className="success-value">{submitted.priority}</span>
            </div>
            <div className="success-row">
              <span className="success-label">Status</span>
              <span className="success-value">{submitted.status}</span>
            </div>
          </div>
          <div className="success-note">
            <Info size={14} />
            <span>A support agent will be assigned shortly. You'll receive real-time updates via the app.</span>
          </div>
          <div className="email-preview-section">
            <div className="email-preview-title">
              <Mail size={16} />
              Confirmation Email Sent
              <span className="email-preview-badge"><CheckCircle size={11} /> Delivered</span>
            </div>
            <div className="email-preview-card">
              <div className="email-preview-row">
                <strong>To:</strong> {user.name} &lt;{user.email}&gt;
              </div>
              <div className="email-preview-row">
                <strong>Subject:</strong> [{submitted.id}] Support Request Received - {submitted.title}
              </div>
              <div className="email-preview-body">
                {`Dear ${user.name},\n\nYour support request has been received and logged.\n\nTicket ID: ${submitted.id}\nModule: ${submitted.module}\nPriority: ${submitted.priority}\nTitle: ${submitted.title}\n\nOur support team will review your request and assign an agent shortly. You will be notified when there is an update.\n\nThank you,\neQMS Support Team`}
              </div>
            </div>
          </div>
          <div className="success-actions">
            <button className="primary-btn" onClick={() => navigate(`/raiser/request/${submitted.id}`)}>
              View Ticket
            </button>
            <button className="secondary-btn" onClick={() => navigate('/raiser')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="new-request">
      <button className="back-btn" onClick={() => navigate('/raiser')}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <h2 className="page-title">Raise a New Support Request</h2>
      <p className="page-subtitle">Fill in the details below to get help from our support team</p>

      <StepGuide steps={RAISER_STEPS.newRequest} currentStep={currentStep} title="Steps to Raise a Request" />

      <form className="request-form" onSubmit={handleSubmit}>
        {/* API Error Banner */}
        {apiError && (
          <div className="api-error-banner">
            <AlertCircle size={16} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Step 1: Module */}
        <div className={`form-section ${touched && errors.module ? 'form-section-error' : ''}`} data-field="module">
          <label className="form-label">
            <span className="form-step-badge">1</span>
            Select eQMS Module <span className="required">*</span>
          </label>
          {touched && errors.module && <div className="field-error"><AlertCircle size={13} /> {errors.module}</div>}
          <div className="module-select-grid">
            {MODULES.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`module-select-btn ${form.module === m.key ? 'selected' : ''}`}
                onClick={() => updateField('module', m.key)}
                style={form.module === m.key ? { borderColor: m.color, background: m.color + '10' } : {}}
              >
                <span className="module-select-icon">{m.icon}</span>
                <span className="module-select-key">{m.key}</span>
                <span className="module-select-name">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Details */}
        <div className="form-section">
          <label className="form-label">
            <span className="form-step-badge">2</span>
            Request Details <span className="required">*</span>
          </label>
          <div className="form-group" data-field="title">
            <label className="field-label">Title</label>
            <input
              type="text"
              className={`form-input ${touched && errors.title ? 'input-error' : ''}`}
              placeholder="Brief summary of your issue..."
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
            />
            {touched && errors.title && <div className="field-error"><AlertCircle size={13} /> {errors.title}</div>}
          </div>
          <div className="form-group" data-field="description">
            <label className="field-label">Description</label>
            <textarea
              className={`form-textarea ${touched && errors.description ? 'input-error' : ''}`}
              placeholder="Describe the issue in detail. Include steps to reproduce, expected behavior, and what you observed..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={5}
            />
            {touched && errors.description && <div className="field-error"><AlertCircle size={13} /> {errors.description}</div>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="field-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={(e) => updateField('priority', e.target.value)}>
                {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.key}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="field-label">Category</label>
              <select className="form-select" value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="field-label"><Link2 size={14} /> Linked eQMS Records <span className="optional">(Optional)</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. CAPA-001, CCN-042, DEV-017"
              value={form.linkedRecords}
              onChange={(e) => updateField('linkedRecords', e.target.value)}
            />
            <span className="field-hint">Comma-separated record IDs from eQMS modules</span>
          </div>
        </div>

        {/* Step 3: Attachments */}
        <div className="form-section">
          <label className="form-label">
            <span className="form-step-badge">3</span>
            Attachments <span className="optional">(Optional)</span>
          </label>
          <div
            className={`file-drop-zone ${dragOver ? 'drag-active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={20} />
            <p>Drag & drop files here, or <span className="file-link">browse</span></p>
            <span className="file-hint">Max file size: 25 MB. Supports images, PDFs, documents.</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_TYPES.join(',')}
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.length) addFiles(Array.from(e.target.files));
                e.target.value = '';
              }}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="file-list">
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} className="file-item">
                  <div className="file-item-icon">{getFileIcon(file.name)}</div>
                  <div className="file-item-info">
                    <span className="file-item-name">{file.name}</span>
                    <span className="file-item-size">{formatSize(file.size)}</span>
                  </div>
                  <button
                    type="button"
                    className="file-item-remove"
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    title="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="file-list-summary">
                {files.length} file{files.length > 1 ? 's' : ''} · {formatSize(files.reduce((a, f) => a + f.size, 0))} total
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Submit */}
        <div className="form-actions">
          <button type="button" className="secondary-btn" onClick={() => navigate('/raiser')}>
            Cancel
          </button>
          <button
            type="submit"
            className="primary-btn submit-btn"
            disabled={submitting}
          >
            {submitting ? <span className="btn-spinner" /> : <Send size={16} />}
            {uploading ? 'Uploading files...' : submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
