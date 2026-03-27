import AppRouter from "./router/AppRouter"
import { ToastContainer } from "./components/Toast"

export default function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  )
}
