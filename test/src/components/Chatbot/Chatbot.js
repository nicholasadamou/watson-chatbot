import React, { useEffect, useRef } from 'react';

import styled from 'styled-components';

import Chat from '@carbon/icons-react/es/chat/32';
import Close from '@carbon/icons-react/es/close/32';

const Container = styled.div`
  display: grid;
  place-content: center;

  position: absolute;
  right: 50px;
  bottom: 25px;

  width: 64px;
  height: 64px;

  border-radius: 50%;

  cursor: pointer;

  z-index: 9999;

  box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.5);

  svg {
	fill: white;
  }

  @media (prefers-color-scheme: light) {
    background-color: #008bdf;
  }

  @media (prefers-color-scheme: no-preference) {
	background-color: #008bdf;
  }

  @media (prefers-color-scheme: dark) {
    background-color: #262626;
  }

  iframe {
    position: absolute;
    left: -485px;
    bottom: 115%;

    z-index: 9999;

    box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.5);

    border-radius: 1%;
  }
`;

const Chatbot = (props) => {
	const [isShown, setIsShown] = React.useState(false);

	let container = useRef();
	let iframe = useRef();
	let close = useRef();
	let chat = useRef();

	const toggle = () => setIsShown(!isShown);
	const handleClick = e => {
		const isVisible = iframe.current.style.display === "block"

		if (
			isVisible &&
			(
				e.target !== iframe.current &&
				e.target !== container.current &&
				e.target !== close.current &&
				e.target !== chat.current
			) &&
			(
				e.target.nodeName !== "path" &&
				e.target.nodeName !== "svg"
			)
		) {
			setIsShown(false);
		}
	}

	useEffect(() => {
		document.addEventListener('click', handleClick);

		return () => document.removeEventListener('click', handleClick);
	}, []);

	return (
		<Container onClick={toggle} ref={container}>
			<iframe src='http://localhost:4200/chatbot' width={550} height={650} style={{ display: isShown ? 'block' : 'none' }} ref={iframe} title="chatbot" />
			{ isShown ?  <Close ref={close} /> : <Chat ref={chat} /> }
		</Container>
	)
};

export default Chatbot;
