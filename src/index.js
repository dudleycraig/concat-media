import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
/** 
 * strict mode removed due react 18 bug, 
 * https://www.techiediaries.com/react-18-useeffect/ 
 **/
root.render(<App />);
