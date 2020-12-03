import React, { useEffect, useRef } from 'react';

import styled from 'styled-components';

import Chat from '@carbon/icons-react/es/chat/32';
import Close from '@carbon/icons-react/es/close/32';

const Container = styled.div`
  display: grid;
  place-content: center;

  position: absolute;
  right: 25px;
  bottom: 25px;

  width: 64px;
  height: 64px;

  border-radius: 50%;

  cursor: pointer;

  z-index: 9999;

  box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.5);

  background-color: var(--chatbot-icon-background-color);

  svg {
	fill: var(--chatbot-icon);

	width: 32px;
	height: 32px;
  }

  .bx--assistive-text {
	  background-color: var(--chatbot-icon) !important;
	  color: white;
  }

  .bx--tooltip__trigger path, .bx--tooltip__trigger polygon, .bx--tooltip__trigger circle {
	  fill: white;
  }

  iframe {
    position: absolute;
    left: -485px;
	bottom: 115%;

	z-index: 9999;

	box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.5);

    border-radius: 1%;
  }
`;

const Chatbot = (props) => {
	const COLOR_SCHEME = 'user-color-scheme';

	const [isShown, setIsShown] = React.useState(false);
	const [scheme, setScheme] = React.useState(sessionStorage.getItem(COLOR_SCHEME));

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

	const handleChangeScheme = ({key, value}) => {
		const currentScheme = localStorage.getItem(COLOR_SCHEME);

		if (scheme !== currentScheme && currentScheme !== null) {
			setScheme(currentScheme);

			const frame = iframe.current.contentWindow || (iframe.current.contentDocument.document || iframe.current.contentDocument);

			frame.location.reload(false);
		}
	}

	useEffect(() => {
		document.addEventListener('click', handleClick);
		window.addEventListener('color-scheme-change', handleChangeScheme);

		return () => {
			document.removeEventListener('click', handleClick);
			window.removeEventListener('color-scheme-change', handleChangeScheme);
		}
	}, [scheme]);

	return (
		<Container onClick={toggle} ref={container}>
			<iframe
				src='/chatbot'
				width={550}
				height={650}
				style={{ display: isShown ? 'block' : 'none' }}
				ref={iframe}
				title="chatbot"
			/>

			{ isShown
				?
					<Close ref={close} />
				:
					<Chat ref={chat} />
			}
		</Container>
	)
};

export default Chatbot;
