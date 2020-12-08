import React from 'react';

import storage from '@nicholasadamou/storage';

import DarkModeToggle from './components/DarkModeToggle/DarkModeToggle';
import Chatbot from './components/Chatbot/Chatbot';

import './App.scss';

storage(window.localStorage, {
	eventName: 'color-scheme-change'
});

const App = () => (
	<>
		<DarkModeToggle />
		<Chatbot />
	</>
);

export default App;
