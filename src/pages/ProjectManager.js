import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import './Dashboard.css';
import { mockUser, mockProjects, mockTasks } from '../mock/mockData';

const ProjectManager = () => {
  const location = useLocation();
  const navUser = location.state?.user;
  // default to a PM user if none is passed
  const user = navUser || { ...mockUser, role: 'Project Manager' };

  const projectById = useMemo(
    () => Object.fromEntries(mockProjects.map((p) => [p.id, p])),
    []
  );

  // Use a small subset of tasks as the PM's "My To Do Items"
  const tasks = useMemo(() => {
    return mockTasks.slice(0, 4);
  }, []);

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <nav className="menu">
          <button type="button" className="menu-item active">Dashboard</button>
          <button type="button" className="menu-item">Tasks</button>
          <button type="button" className="menu-item">Projects</button>
          <button type="button" className="menu-item">History</button>
          <button type="button" className="menu-item">Settings</button>
        </nav>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <div className="role-pill">{user?.role || 'Project Manager'}</div>
          <div className="top-actions">
            <span className="profile">
              <span className="avatar" />
              {user?.email && (
                <span className="phone" style={{ marginLeft: '2rem' }}>{user.email}</span>
              )}
            </span>
          </div>
        </div>

        <div className="pm-grid">
          <div className="panel dark">
            <div className="panel-title">All Projects</div>
            <div className="donut" aria-hidden="true"></div>
            <div className="donut-legend" style={{ marginTop: '1rem' }}>
              <div className="legend-item"><span className="legend-dot dot-green"></span>Complete</div>
              <div className="legend-item"><span className="legend-dot dot-blue"></span>In Progress</div>
              <div className="legend-item"><span className="legend-dot dot-yellow"></span>Not Start</div>
            </div>
          </div>
          <div className="panel dark">
            <div className="panel-title">Events</div>
            <div className="events">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="event">
                  <div className="date">
                    <div className="day">{20 + i}</div>
                    <div className="dow">Mon</div>
                  </div>
                  <div>
                    <div className="title">Development planning</div>
                    <div className="sub">W3 Technologies</div>
                  </div>
                  <div className="time">12.02 PM</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pm-row">
          <div className="panel dark">
            <div className="panel-title">My To Do Items</div>
            <div className="events">
              {tasks.map((t) => (
                <div className="event" key={t.id}>
                  <div className="date">
                    <div className="day">{new Date(t.dueDate).getDate()}</div>
                    <div className="dow">{new Date(t.dueDate).toLocaleString('en-US', { weekday: 'short' })}</div>
                  </div>
                  <div>
                    <div className="title">{t.title}</div>
                    <div className="sub">{projectById[t.projectId]?.name || '-'}</div>
                  </div>
                  <div className="time">Due</div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel dark">
            <div className="panel-title">Project Overview</div>
            <div
              style={{
                height: '220px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid #2a3a59',
                borderRadius: 10,
              }}
            ></div>
          </div>
        </div>

        <div className="pm-stats">
          <div className="stat"><div className="value">12,721</div><div className="label">Number of projects</div></div>
          <div className="stat"><div className="value">721</div><div className="label">Active tasks</div></div>
          <div className="stat"><div className="value">$2,50,254</div><div className="label">Revenue</div></div>
          <div className="stat"><div className="value">12,185 hr</div><div className="label">Working Hours</div></div>
        </div>
      </main>
    </div>
  );
};

export default ProjectManager;
