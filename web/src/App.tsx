import { Routes, BrowserRouter, Route } from 'react-router-dom'
import Login from "./components/Login/Login"
import Dashboard from './components/Dashboard/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/Home" element={<Dashboard/>}/>
      </Routes>
    </BrowserRouter>
  )
}