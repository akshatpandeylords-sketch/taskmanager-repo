import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ProjectModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('Project name is required.');
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">New Project</h2>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <label>Project Name *</label>
          <input
            autoFocus value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Website Redesign"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="What's this project about?"
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = () => {
    api.get('/projects')
      .then(res => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (form) => {
    await api.post('/projects', form);
    fetchProjects();
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
            ＋ Create Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {projects.map(project => (
            <div
              key={project.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
              onClick={() => navigate(`/projects/${project.id}`)}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e2e'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e5e7eb' }}>{project.name}</h3>
                <span className={`badge badge-${project.user_role}`}>{project.user_role}</span>
              </div>

              {project.description && (
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {project.description.length > 100
                    ? project.description.slice(0, 100) + '…'
                    : project.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: '#6b7280', marginTop: 'auto' }}>
                <span>👥 {project.member_count} member{project.member_count !== '1' ? 's' : ''}</span>
                <span>✓ {project.task_count} task{project.task_count !== '1' ? 's' : ''}</span>
                {project.open_tasks > 0 && (
                  <span style={{ color: '#fbbf24' }}>◉ {project.open_tasks} open</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
    </div>
  );
};

export default Projects;
