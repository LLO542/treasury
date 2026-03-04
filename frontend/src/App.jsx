import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import BlogDetail from "./pages/BlogDetail";
import Blogs from "./pages/Blogs";
import CreateBlog from "./pages/CreateBlog";
import CreateWork from "./pages/CreateWork";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WorkDetail from "./pages/WorkDetail";
import Works from "./pages/Works";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="works" element={<Works />} />
        <Route path="works/:slug" element={<WorkDetail />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="blogs/:slug" element={<BlogDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        
        {/* Admin routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard/works/new"
          element={
            <ProtectedRoute requiredRole="admin">
              <CreateWork />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard/blogs/new"
          element={
            <ProtectedRoute requiredRole="admin">
              <CreateBlog />
            </ProtectedRoute>
          }
        />
        {/* Any authenticated user can create blogs */}
        <Route
          path="blogs/new"
          element={
            <ProtectedRoute>
              <CreateBlog />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
