import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectManager from './pages/ProjectManager';
import ProjectTasks from './pages/Project_Tasks';
import SkillAssessmentTest from './pages/Skill Assessment Test';
import SkillAssessmentQuiz from './pages/Skill Assessment Quiz';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<Services />} />
            <Route path="portfolio" element={<Services />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="pm" element={<ProjectManager />} />
            <Route path="project-tasks" element={<ProjectTasks />} />
            <Route path="skill-assessment" element={<SkillAssessmentTest />} />
            <Route path="skill-assessment/quiz" element={<SkillAssessmentQuiz />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
