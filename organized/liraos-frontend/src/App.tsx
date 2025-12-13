import React from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';

function App() {
  return (
    <div className="min-h-screen bg-nagisa-bg text-nagisa-text dark:bg-nagisaDark-bg dark:text-nagisaDark-text flex">
      <Sidebar />
      <ChatArea />
    </div>
  );
}

export default App;
