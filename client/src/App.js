import './App.css';
import React, {useEffect, useRef, useState} from 'react';
import io from 'socket.io-client';

function App() {
  const [text, setText] = useState('');
  const socketRef = useRef();
  const idRef = useRef();

  useEffect(() => {

    socketRef.current = io('http://localhost:4000');

    socketRef.current.on('textChange', (newText) => {
      console.log("TEXT SET");
      setText(newText);
    });

    idRef.current = window.location.pathname.split('/').pop(); //formatted localhost/texts/{id} for the future
    socketRef.current.emit('getTextById', idRef.current);

    socketRef.current.on('userConnected', () => {
      console.log('A user connected');
    });

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
    const payload = {
      newText: newText,
      idRef: idRef.current,
    }
    socketRef.current.emit('textChange', payload);
  }

  return (
    <div className="app-container">
      <textarea className="centered-textarea" value={text} onChange={handleChange} />
    </div>
  );
}

export default App;