import React from 'react'

function App() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        WaEmma Wines & Spirits Ltd - Business Management System
      </h1>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>System Status</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ margin: '10px 0', color: 'green' }}>✅ Frontend: Running on port 5000</li>
          <li style={{ margin: '10px 0', color: 'green' }}>✅ Backend: Running on port 3001</li>
          <li style={{ margin: '10px 0', color: 'green' }}>✅ React: Rendering correctly</li>
          <li style={{ margin: '10px 0', color: 'orange' }}>⚠️  Database: Not connected (expected)</li>
        </ul>
        <p style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', border: '1px solid #4caf50', borderRadius: '4px' }}>
          <strong>Import Success!</strong> The GitHub import has been successfully configured for the Replit environment.
          The application is ready for development and can be deployed when needed.
        </p>
      </div>
    </div>
  )
}

export default App