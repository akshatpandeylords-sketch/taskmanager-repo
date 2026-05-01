import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, isPast, parseISO } from 'date-fns';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const { stats, tasks } = data || {};

  const statCards = [
    { label: 'My Tasks', value: stats?.my_tasks || 0, color: '#6366f1', icon: '◈' },
    { label: 'Completed', value: stats?.completed || 0, color: '#4ade80', icon: '✓' },
    { label: 'Open', value: stats?.open || 0, color: '#fbbf24', icon: '◉' },
    { label: 'Overdue', value: stats?.overdue || 0, color: '#f87171', icon: '⚠' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's on your plate today.</p>
        </div>
        <Link to="/projects" className="btn btn-primary">＋ New Project</Link>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(({ label, value, color, icon }) => (
          <div key={label} className="card" style={{ borderColor: color + '22' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color, fontSize: '1.1rem' }}>{icon}</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{value}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* My Tasks */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#e5e7eb', marginBottom: '1.25rem' }}>
          My Assigned Tasks
        </h2>

        {tasks?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <h3>All clear!</h3>
            <p>No tasks assigned to you yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {tasks?.map(task => {
              const overdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';
              return (
                <Link
                  key={task.id}
                  to={`/projects/${task.project_id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.75rem 1rem', borderRadius: '8px',
                    background: '#0a0a0f', border: '1px solid #1e1e2e',
                    transition: 'border-color 0.15s',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e2e'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.9rem', fontWeight: 500,
                        color: task.status === 'done' ? '#6b7280' : '#e5e7eb',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{task.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.2rem' }}>
                        {task.project_name}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {task.due_date && (
                        <span style={{ fontSize: '0.75rem', color: overdue ? '#f87171' : '#6b7280' }}>
                          {overdue ? '⚠ ' : ''}{format(parseISO(task.due_date), 'MMM d')}
                        </span>
                      )}
                      <span className={`badge badge-${task.status}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                      <span className={`badge badge-${task.priority}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
