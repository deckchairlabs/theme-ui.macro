import React from 'react'
import logo from './logo.svg'
import './App.css'
import { Button, Box } from 'theme-ui'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>

        <Box padding={3}>
          <Button>Primary Button</Button>
        </Box>
      </header>
    </div>
  )
}

export default App
