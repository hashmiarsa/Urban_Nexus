import { createContext, useContext, useState } from "react"
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("civiq_user")
    return saved ? JSON.parse(saved) : null
  })
  const login = (userData) => { setUser(userData); localStorage.setItem("civiq_user", JSON.stringify(userData)) }
  const logout = () => { setUser(null); localStorage.removeItem("civiq_user") }
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}
export function useAuth() { return useContext(AuthContext) }
