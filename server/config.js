module.exports = (C) => {
	return ({
		// Application specific settings.
		application: {
			name: 'Watson Chatbot',
			shortName: 'Watson-based Chatbot'
		},

		session: {
			secret: 'terces tahc adug',
			maxAge: 24 * 60 * 60 * 1000 // 24 hours
		},

		log: {
		level: 'verbose',
		},

		env: 'dev',

		service: {
			bluepages: {
				photoUrl: ''
			},
			chat: {
				assistants: [{
					id: process.env.WATSON_ASSISTANT_ID,
					name: 'Watson Assistant',
					description: 'I am the default Assistant to help direct your questions to other assistants.',
					image: 'iconWatson.png',
					confidence: 0.95,
					// Will be reported to the client to use as the 'default' assistant,
					// for example when only creating a message on the client.
					default: true
				}],
				confidence: 0.3,
				//https://cloud.ibm.com/docs/assistant?topic=assistant-api-migration&programming_language=javascript
				version: '2020-04-01',
				url: 'https://gateway.watsonplatform.net/assistant/api',
				commands: [
					'invoke-command.js',
					'child-messages.js',
					'text-styling.js',
					'exit-assistant.js'
				],
				messageHistory: 100,
				introStatements: [
					'Hello User!'
				],
				startStatements: [
					'Who are you?'
				],
				helpHtml: '<p></p>',
				errorMessage: 'Sorry, I am having difficulty connecting to Watson Assistant service on IBM Cloud. Please try again later.',
			}
		}
	})
}
