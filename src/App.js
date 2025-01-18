import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:4000'); // Replace with your WebSocket server URL

// Task List Component
const TaskList = ({ tasks, onSearch, onFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('');

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const handleFilter = (e) => {
    setFilter(e.target.value);
    onFilter(e.target.value);
  };

  return (
    <div className="task-list">
      <h1>Task List</h1>
      <input
        type="text"
        placeholder="Search tasks..."
        value={searchTerm}
        onChange={handleSearch}
      />
      <select value={filter} onChange={handleFilter}>
        <option value="">All</option>
        <option value="completed">Completed</option>
        <option value="pending">Pending</option>
      </select>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <Link to={`/tasks/${task.id}`}>{task.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Task Details Component
const TaskDetails = ({ task }) => (
  <div className="task-details">
    <h2>{task.title}</h2>
    <p>{task.description}</p>
    <p>Status: {task.status}</p>
  </div>
);

// Task Editor Component
const TaskEditor = ({ task, onSave }) => {
  const [title, setTitle] = useState(task ? task.title : '');
  const [description, setDescription] = useState(task ? task.description : '');
  const [status, setStatus] = useState(task ? task.status : 'pending');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description) {
      alert('Both title and description are required!');
      return;
    }
    onSave({ id: task ? task.id : uuidv4(), title, description, status });
  };

  return (
    <form onSubmit={handleSubmit} className="task-editor">
      <h2>{task ? 'Edit Task' : 'Create Task'}</h2>
      <input
        type="text"
        placeholder="Task Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Task Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      ></textarea>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>
      <button type="submit">Save</button>
    </form>
  );
};

// Activity Log Component
const ActivityLog = ({ activities }) => (
  <div className="activity-log">
    <h2>Activity Log</h2>
    <ul>
      {activities.map((activity, index) => (
        <li key={index}>{activity}</li>
      ))}
    </ul>
  </div>
);

// Main App Component
const App = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    socket.on('taskUpdate', (updatedTasks) => {
      setTasks(updatedTasks);
      setFilteredTasks(updatedTasks);
    });

    return () => {
      socket.off('taskUpdate');
    };
  }, []);

  const handleSaveTask = (task) => {
    const updatedTasks = tasks.some((t) => t.id === task.id)
      ? tasks.map((t) => (t.id === task.id ? task : t))
      : [...tasks, task];
    setTasks(updatedTasks);
    setFilteredTasks(updatedTasks);
    setActivities((prev) => [...prev, `Task "${task.title}" was ${task.id in tasks ? 'updated' : 'created'}.`]);
    socket.emit('updateTasks', updatedTasks);
  };

  const handleSearch = (term) => {
    setFilteredTasks(tasks.filter((task) => task.title.includes(term)));
  };

  const handleFilter = (status) => {
    setFilteredTasks(status ? tasks.filter((task) => task.status === status) : tasks);
  };

  return (
    <Router>
      <div className="app">
        <nav>
          <Link to="/">Task List</Link>
          <Link to="/create">Create Task</Link>
        </nav>
        <Routes>
          <Route
            path="/"
            element={<TaskList tasks={filteredTasks} onSearch={handleSearch} onFilter={handleFilter} />}
          />
          <Route
            path="/tasks/:id"
            element={<TaskDetails task={currentTask} />}
          />
          <Route
            path="/create"
            element={<TaskEditor onSave={handleSaveTask} />}
          />
          <Route
            path="/edit/:id"
            element={<TaskEditor task={currentTask} onSave={handleSaveTask} />}
          />
        </Routes>
        <ActivityLog activities={activities} />
      </div>
    </Router>
  );
};

export default App;
