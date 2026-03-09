const config = {
  apiUrl:    import.meta.env.VITE_API_URL    || 'http://localhost:5000/api/v1',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  isDev:     import.meta.env.DEV,
  isProd:    import.meta.env.PROD,
}

export default config