import './App.css';
import React, {useEffect, useRef, useState} from 'react';
import io from 'socket.io-client';

function App() {
  const [text, setText] = useState('');
  const socketRef = useRef();

  useEffect(() => {

    socketRef.current = io('http://localhost:4000');
    socketRef.current.on('textChange', (newText) => {
      setText(newText);
    });

    const id = window.location.pathname.split('/').pop(); //formatted localhost/texts/{id}
    socketRef.current.emit('getTextById', '658d10709ec0c49bb22dd122');

    // for all clients
    socketRef.current.on('userConnected', () => {
      console.log('A user connected');
    });

    // for all clients
    socketRef.current.on('userDisconnected', () => {
      console.log('A user disconnected');
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

