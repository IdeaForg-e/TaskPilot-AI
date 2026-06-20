import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Quality from './pages/Quality';
import Priority from './pages/Priority';
import Planner from './pages/Planner';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="/priority" element={<Priority />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
