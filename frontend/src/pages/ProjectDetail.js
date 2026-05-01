import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, parseISO } from 'date-fns';

const STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITIES = ['low', 'medium', 'high'];

/* ── Task Modal ── */
const TaskModal = ({ task, members, projectId, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assigned_to: task?.assigned_to || '',
    due_date: task?.due_date ? task.due_date.slice(0, 10) : '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Task title is required.');
    setLoading(true);
    try {
      const payload = { ...form, assigned_to: form.assigned_to || null, due_date: form.due_date || null };
      if (task) {
        await api.put(`/projects/${projectId}/tasks/${task.id}`, payload);
      } else {
        await api.post(`/projects/${projectId}/tasks`, payload);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h2>
        {error && <div className="error-msg">{error}</div>}

        <div className="form-group">
          <label>Title *</label>
          <input autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label>Assign To</label>
            <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Add Member Modal ── */
const MemberModal = ({ projectId, onClose, onSave }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return setError('Email is required.');
    setLoading(true);
    try {
      await api.post(`/projects/${projectId}/members`, { email, role });
      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Add Team Member</h2>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <label>Email Address</label>
          <input autoFocus type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="member@example.com" />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Task Card ── */
const TaskCard = ({ task, isAdmin, onEdit, onDelete, onStatusChange }) => {
  const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div style={{
      background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: '10px',
      padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#e5e7eb', lineHeight: 1.4, flex: 1 }}>
          {task.title}
        </span>
        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
          <button
            className="btn btn-sm btn-secondary"
            style={{ padding: '0.25rem 0.5rem' }}
            onClick={() => onEdit(task)}
            title="Edit"
          >✎</button>
          {isAdmin && (
            <button
              className="btn btn-sm btn-danger"
              style={{ padding: '0.25rem 0.5rem' }}
              onClick={() => onDelete(task.id)}
              title="Delete"
            >✕</button>
          )}
        </div>
      </div>

      {task.description && (
        <p style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.4 }}>
          {task.description.length > 80 ? task.description.slice(0, 80) + '…' : task.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        {task.assigned_to_name && (
          <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>👤 {task.assigned_to_name}</span>
        )}
        {task.due_date && (
          <span style={{ fontSize: '0.72rem', color: overdue ? '#f87171' : '#6b7280' }}>
            {overdue ? '⚠ ' : '📅 '}{format(parseISO(task.due_date), 'MMM d')}
          </span>
        )}
      </div>

      <select
        value={task.status}
        onChange={e => onStatusChange(task.id, e.target.value)}
        style={{
          background: '#13131a', border: '1px solid #1e1e2e', borderRadius: '6px',
          padding: '0.3rem 0.5rem', color: '#9ca3af', fontSize: '0.78rem',
          cursor: 'pointer', width: '100%', fontFamily: 'inherit',
        }}
      >
        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
    </div>
  );
};

/* ── Main Page ── */
const ProjectDetail = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task object
  const [memberModal, setMemberModal] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const isAdmin = project?.user_role === 'admin';

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${projectId}`);
      navigate('/projects');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="spinner" />;
  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  const tabStyle = (tab) => ({
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    fontWeight: 500,
    background: activeTab === tab ? '#6366f1' : 'transparent',
    color: activeTab === tab ? 'white' : '#6b7280',
    transition: 'all 0.15s',
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            onClick={() => navigate('/projects')}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem', fontFamily: 'inherit' }}
          >
            ← Projects
          </button>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setMemberModal(true)}>＋ Member</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete Project</button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => setTaskModal('new')}>＋ Task</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: '#13131a', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '0.35rem', width: 'fit-content' }}>
        <button style={tabStyle('board')} onClick={() => setActiveTab('board')}>Board</button>
        <button style={tabStyle('list')} onClick={() => setActiveTab('list')}>List</button>
        <button style={tabStyle('members')} onClick={() => setActiveTab('members')}>
          Team ({project.members?.length || 0})
        </button>
      </div>

      {/* Board View */}
      {activeTab === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {STATUSES.map(status => (
            <div key={status} className="card" style={{ minHeight: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {STATUS_LABELS[status]}
                </h3>
                <span style={{ background: '#1e1e2e', color: '#6b7280', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>
                  {tasksByStatus[status].length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {tasksByStatus[status].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isAdmin={isAdmin}
                    onEdit={setTaskModal}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {tasksByStatus[status].length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#374151', fontSize: '0.82rem' }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="card">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No tasks yet</h3>
              <p>Create your first task to get started.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                  {['Task', 'Status', 'Priority', 'Assigned', 'Due'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                  return (
                    <tr key={task.id} style={{ borderBottom: '1px solid #1e1e2e' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#e5e7eb', maxWidth: '280px' }}>
                        {task.title}
                        {task.description && <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.15rem' }}>{task.description.slice(0, 60)}…</div>}
                      </td>
                      <td style={{ padding: '0.75rem' }}><span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
                      <td style={{ padding: '0.75rem' }}><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td style={{ padding: '0.75rem', fontSize: '0.83rem', color: '#9ca3af' }}>{task.assigned_to_name || '—'}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.83rem', color: overdue ? '#f87171' : '#6b7280' }}>
                        {task.due_date ? format(parseISO(task.due_date), 'MMM d') : '—'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => setTaskModal(task)}>✎</button>
                          {isAdmin && <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTask(task.id)}>✕</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Members View */}
      {activeTab === 'members' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {project.members?.map(member => (
              <div key={member.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', background: '#0a0a0f',
                border: '1px solid #1e1e2e', borderRadius: '8px',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem', color: 'white', flexShrink: 0,
                }}>
                  {member.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#e5e7eb' }}>{member.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{member.email}</div>
                </div>
                <span className={`badge badge-${member.role}`}>{member.role}</span>
                {isAdmin && member.id !== user.id && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveMember(member.id)}
                    style={{ flexShrink: 0 }}
                  >Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {taskModal && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          members={project.members || []}
          projectId={projectId}
          onClose={() => setTaskModal(null)}
          onSave={fetchAll}
        />
      )}
      {memberModal && (
        <MemberModal
          projectId={projectId}
          onClose={() => setMemberModal(false)}
          onSave={fetchAll}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
