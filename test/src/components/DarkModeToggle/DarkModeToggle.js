import React, {useState} from 'react';

import styled from 'styled-components';

import Toggle from 'carbon-components-react/lib/components/Toggle';

const Container = styled.div`
	position: absolute;
	top: 10px;
	right: 90px;

	.bx--toggle-input:checked + .bx--toggle-input__label > .bx--toggle__switch::before {
		background: #0370b0;
	}
`;

const DarkModeToggle = (Props) => {
	const COLOR_SCHEME = 'user-color-scheme';
	const PREFERS_DARK_COLOR_SCHEME = '(prefers-color-scheme: dark)';

	const DEFAULT_SCHEME = window.matchMedia(PREFERS_DARK_COLOR_SCHEME).matches
				?
					'dark'
				:
					'light';

	const [scheme, setScheme] = useState(DEFAULT_SCHEME);

	const applyColorScheme = scheme => {
		let currentScheme = scheme || localStorage.getItem(COLOR_SCHEME);

		if (currentScheme) {
			setScheme(currentScheme);

			document.documentElement.setAttribute(`data-${COLOR_SCHEME}`, currentScheme);
		}
	}

	const getCSSCustomProp = key => {
        let response = getComputedStyle(document.documentElement).getPropertyValue(key);

        if (response.length) {
            response = response.replace(/"/g, '').trim();
        }

        return response;
    }

	const toggleScheme = () => {
		let currentScheme = localStorage.getItem(COLOR_SCHEME);

		switch (currentScheme) {
            case null:
                currentScheme = getCSSCustomProp('--color-mode') === 'dark' ? 'light' : 'dark';
                break;
            case 'light':
                currentScheme = 'dark';
                break;
            case 'dark':
                currentScheme = 'light';
				break;
			default:
				currentScheme = DEFAULT_SCHEME;
				break;
		}

		localStorage.setItem(COLOR_SCHEME, currentScheme);

		return currentScheme;
	}

	const handleToggle = () => {
		applyColorScheme(toggleScheme());
	}

	return (
		<Container>
			<Toggle
					labelA="Light Mode"
					labelB="Dark Mode"
					onToggle={handleToggle}
					defaultToggled={window.matchMedia(PREFERS_DARK_COLOR_SCHEME).matches}
					toggled={
						scheme === null
							?
								window.matchMedia(PREFERS_DARK_COLOR_SCHEME).matches
							:
								scheme === 'dark'
						}
					id="dark-mode-toggle"
				/>
		</Container>
	)
}

export default DarkModeToggle;
