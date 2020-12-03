import React from 'react';

import DarkModeToggle from './components/DarkModeToggle/DarkModeToggle';
import Chatbot from './components/Chatbot/Chatbot';

import './App.scss';

const App = () => (
	<>
		<DarkModeToggle />
		<Chatbot />
	</>
);

export default App;
