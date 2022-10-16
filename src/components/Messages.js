import React from 'react';

const Messages = ({messages, render = false, ...props}) =>
  messages && 
  messages.length > 0 &&
  render 
    ? <ul className="messages">{messages.map((message, index) => <li className={Object.keys(message)[0]} key={`message-${index}`}>{message[Object.keys(message)[0]]}</li>)}</ul>
    : messages.map(message => ({error:console.error, warning:console.warn, success:console.info})[Object.keys(message)[0]](message[Object.keys(message)[0]]));

export default Messages;
