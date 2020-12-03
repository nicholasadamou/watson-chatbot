import React from 'react';

import storageChanged from 'storage-changed';

import DarkModeToggle from './components/DarkModeToggle/DarkModeToggle';
import Chatbot from './components/Chatbot/Chatbot';

import './App.scss';

storageChanged('local', {
	eventName: 'color-scheme-change'
});

const App = () => (
	<>
		<DarkModeToggle />
		<Chatbot />
	</>
);

export default App;
