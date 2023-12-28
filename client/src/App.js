import './App.css';
import React, {useEffect, useRef, useState} from 'react';
import io from 'socket.io-client';
const socket = io();

// ... (import statements)

function App() {
  const [text, setText] = useState('');
  const socketRef = useRef();

  useEffect(() => {

    socketRef.current = io('http://localhost:4000');

    socketRef.current.on('textChange', (newText) => {
      setText(newText);
    });

    // for all clients
    socketRef.current.on('userConnected', () => {
      console.log('A user connected');
    });

    // for all clients
    socketRef.current.on('userDisconnected', () => {
      console.log('User disconnected');
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  function handleChange(e) {
    const newText = e.target.value;
    setText(newText);
    socketRef.current.emit('textChange', newText);
  }

  return (
    <div className="app-container">
      <textarea className="centered-textarea" value={text} onChange={handleChange} />
    </div>
  );
}

export default App;

