module.exports = function (C, apiRoutes) {

	// These constants are only loaded once at startup.

	const L = C.LOG;
	const SESSION = require('../session');
	const chatCommands = require('./commands')(C);

	const AssistantV2 = require('ibm-watson/assistant/v2');
	const {IamAuthenticator} = require('ibm-watson/auth');

	const assistant = new AssistantV2({
		version: C.CONFIG.service.chat.version,
		url: C.CONFIG.service.chat.url,
		authenticator: new IamAuthenticator({
			apikey: process && process.env && process.env.CHAT_KEY ? process.env.CHAT_KEY : ''
		})
	});

	const confidenceThreshold = C.CONFIG.service.chat.confidence;

	let assistantDefs = {};

	//////////////////////////////////////////////////////////////////////////////

	// Function to process commands returned from the (embedded in) text responses.
	// NOTE: Ideally would use Watson Assistant Integrations to do this, but not working
	//  for some reason and is very poorly documented.
	const processActions = (req, res, msg, json, clientChatSessionId, callback) => {

		const A = 'processActions():';

		let exit = false;

		json.processedResponse = new Array(json.response ? json.response.length : 0);

		const submessages = new Array(json.response ? json.response.length : 0);
		for (let i = 0; i < submessages.length; i++) {
			submessages[i] = [];
		}

		const REGEX = /(?<=\[)(.*?)(?=\])/g;
		const promises = [];

		for (let i = 0; i < json.response.length; i++) {
			promises.push(
				new Promise((resolve, reject) => {

					if (json.response[i].response_type === 'TEXT' && json.response[i].text) {

						chatCommands.invokeCommands(req, json.response[i].text, response => {

							if (response) {

								if (response.exit) {
									exit = true;
									delete response.exit;
								}
								json.processedResponse[i] = response;
							} else {

								json.processedResponse[i] = {
									response_type: 'TEXT',
									message: json.response[i].text.replace(/(?:\r\n|\r|\n)/g, '<br/>')
								};
							}
							resolve();
						});
					} else if (json.response[i].response_type === 'IMAGE' && json.response[i].source) {

						json.processedResponse[i] = {
							response_type: 'IMAGE',
							source: json.response[i].source.trim(),
						}
						if (json.response[i].title) {
							json.processedResponse[i].title = json.response[i].title;
						}
						if (json.response[i].description) {
							json.processedResponse[i].description = json.response[i].description;
						}

						//L.verbose(`${A} Processed JSON commands, returning: `, json);
						resolve();
					} else if (json.response[i].response_type === 'OPTION' && json.response[i].options) {

						json.processedResponse[i] = {
							response_type: 'OPTION',
							options: json.response[i].options
						}
						if (json.response[i].title) {
							json.processedResponse[i].title = json.response[i].title;
						}
						if (json.response[i].description) {
							json.processedResponse[i].description = json.response[i].description;
						}

						//L.verbose(`${A} Processed JSON commands, returning: `, json);
						resolve();
					} else {
						resolve();
					}
				}).catch(err => {
					throw err;
				}));
		}
		Promise.all(promises).then(() => {

			// It's possible that responses where converted to sub messages, which means we would have null entries at top level.
			// So remove those first.
			// Also add any accummulated sub messages.

			const replace = [];
			for (let i = 0; i < json.processedResponse.length; i++) {
				if (json.processedResponse[i]) {
					replace.push(json.processedResponse[i]);
					let j = i;
					while (submessages.length > j + 1 && submessages[j + 1].length > 0) {
						if (!replace[i].submessages) replace[i].submessages = [];
						for (let k = 0; k < submessages[j + 1].length; k++) {
							replace[i].submessages.push(submessages[j + 1][k]);
						}
						j++;
					}
				}
			}
			json.processedResponse = replace;

			callback(exit);

		}).catch(err => {
			L.error(`${A} Unable to process command: ${err}`);
			res.status(500).send({ok: false, chatSessionId: clientChatSessionId});
		});
	}

	//////////////////////////////////////////////////////////////////////////////
	//
	// Assistant Session Affinity:
	// 1a. Make request to configured Assistants (configured pipeline).
	//      Determine highest confidence answer and return;
	//      or if below configured confidence threshold, return nothing.
	// 1b. If selected answer is above configured session "lock" confidence,
	//      then "lock on" to Assistant (save session) and only send next messages to it.
	// 2a. If locked, and response is above configured session confidence,
	//      continue to "lock on" Assistant sending session identifier.
	// 2b. If response falls below configured session confidence,
	//      destroy Assistant session, and send question to all configured Assistants
	//      by going Step 1) and start over.
	//
	//////////////////////////////////////////////////////////////////////////////


	// Function to send a message to the Watson Assistant API (a single assistant).

	const sendMessage = (req, assistId, sessionId, msg, locked, callback) => {

		const sendMsg = {
			assistantId: assistId,
			sessionId: sessionId,
			input: {
				message_type: 'text',
				text: msg
			}
		};

		// Add role to message if available.
		let role = undefined;
		const sess = SESSION.get(C, req);
		// If available, send the user role.
		if (sess && sess.userInfo && sess.userInfo.role && sess.userInfo.role > 0) {
			role = sess.userInfo.role;
		}
		if (role) {
			// This format is not defined well in the official documentation. Used this:
			// https://stackoverflow.com/questions/53404249/watson-assistant-api-v2-manages-the-context-automatically-more-details
			sendMsg.context = {skills: {"main skill": {user_defined: {role: role}}}};
		}

		// if (C.CONFIG.jobs.apiCount) {
		//   if (!C.CONFIG.jobs.apiCount.count) {
		//     C.CONFIG.jobs.apiCount.count = 0;
		//     C.CONFIG.jobs.apiCount.start = new Date();
		//   }
		//   C.CONFIG.jobs.apiCount.count++;
		// }

		assistant.message(
			sendMsg
		)
			.then(res => {

				const response = res.result;

				L.verbose(`Response from assistant ${assistId}: ${JSON.stringify(response)}`);

				// Determine if there was no response given.
				let matched = false;
				if (response.output && response.output.generic && response.output.generic.length > 0) {
					matched = response.output.intents && response.output.intents.length > 0;
					matched = matched || response.output.entities && response.output.entities.length > 0;
				}

				// Get the highest confidence value from all possible confidence items (e.g. intent, entity).
				let confidence = 0.0;
				if (matched) {
					if (response.output && response.output.generic) {
						if (response.output.intents && response.output.intents.length > 0) {
							for (let i = 0; i < response.output.intents.length; i++) {
								if (response.output.intents[i].confidence) {
									if (response.output.intents[i].confidence > confidence) {
										confidence = response.output.intents[i].confidence;
									}
								}
							}
						}
						if (response.output.entities && response.output.entities.length > 0) {
							for (let i = 0; i < response.output.entities.length; i++) {
								if (response.output.entities[i].confidence) {
									if (response.output.entities[i].confidence > confidence) {
										confidence = response.output.entities[i].confidence;
									}
								}
							}
						}
					}
				}

				// If not locked into assistant.
				if (!locked) {
					matched = confidence >= confidenceThreshold;
				}

				// And only if the confidence meets the threshold.
				let answers = [];
				if (matched || locked) {
					if (response.output && response.output.generic && response.output.generic.length > 0) {
						for (let i = 0; i < response.output.generic.length; i++) {
							if (response.output.generic[i].response_type) {
								if (response.output.generic[i].response_type === 'text' && response.output.generic[i].text) {
									answers.push({
										response_type: 'TEXT',
										text: response.output.generic[i].text
									});
								} else if (response.output.generic[i].response_type === 'image' && response.output.generic[i].source) {
									const d = {
										response_type: 'IMAGE',
										source: response.output.generic[i].source
									};
									if (response.output.generic[i].title) {
										d.title = response.output.generic[i].title;
									}
									if (response.output.generic[i].description) {
										d.description = response.output.generic[i].description;
									}
									answers.push(d);
								} else if (response.output.generic[i].response_type === 'option' && response.output.generic[i].options) {
									const d = {
										response_type: 'OPTION',
										options: response.output.generic[i].options
									};
									if (response.output.generic[i].title) {
										d.title = response.output.generic[i].title;
									}
									if (response.output.generic[i].description) {
										d.description = response.output.generic[i].description;
									}
									answers.push(d);
								}
							}
						}
					}
				}

				let originalConfidence = undefined;
				if (locked && answers.length > 0) {
					originalConfidence = confidence;
					confidence = 1.0;
				}

				const answer = {
					ok: true,
					response: answers,
					confidence: confidence,
					// The Watson Assistant API details (needed later).
					apiSession: {
						assistant_id: assistId,
						session_id: sessionId
					}
				};

				if (originalConfidence != undefined) {
					answer.originalConfidence = originalConfidence;
				}

				callback(false, answer);
			})
			.catch(err => {
				callback(err);
			});
	};


	// Function to close a Watson Assistant session.

	const deleteSession = (assistId, sessionId, next) => {

		assistant.deleteSession({
			assistantId: assistId,
			sessionId: sessionId
		})
			.then(() => {
				if (next) {
					next();
				}
			})
			.catch(err => {
				L.error(err);
				if (next) {
					next();
				}
			});
	}


	// Function to send the message to all assistants provided.

	const sendMessageAssistantUnlocked = (req, res, msg, assistants, clientChatSessionId, skipLock, recordHistory) => {

		// First, create an array of Promises to do the work of sending the messages to the Watson Assistant API.

		let assistantRequests = [];
		let assistantResponses = [];

		for (let i = 0; i < assistants.length; i++) {
			assistantRequests.push(
				new Promise((resolve, reject) => {

					assistant.createSession({
						assistantId: assistants[i].id
					})
						.then(res => {
							const result = res.result;

							// Send the message to an assistant.
							sendMessage(req, assistants[i].id, result.session_id, msg, false,
								(err, response) => {
									if (err) {
										reject(err);
									} else {
										assistantResponses.push(response);
										resolve();
									}
								});
						})
						.catch(err => {
							reject(err);
						});
				}).catch(err => {
					throw err;
				}));
		}

		// Now run all Promises simultaneously, and when all done, evaluate the responses.

		Promise.all(assistantRequests).then(() => {

			// Now go through all responses and decide which to send.
			let locked = -1;
			let response = undefined;

			if (assistantResponses.length > 0) {
				locked = 0;
				response = assistantResponses[0];
			}
			if (assistantResponses.length > 1) {
				for (let i = 1; i < assistantResponses.length; i++) {
					if (assistantResponses[i].confidence > response.confidence) {
						locked = i;
						response = assistantResponses[i];
					}
				}
			}

			const assistantId = response.apiSession.assistant_id;
			const assistantConfidenceThreshold = assistantDefs[assistantId].confidence;

			L.verbose(`Assistant confidence: ${assistantConfidenceThreshold}`);

			// If the confidence in response is over the threshold, then "lock into" the assistant for further dialog.
			if (!skipLock && response && response.confidence >= assistantConfidenceThreshold) {

				// The details of the assistant and session are already stored on response.apiSession.
				L.verbose(`Locked into assistant ${response.apiSession.assistant_id} with session ${response.apiSession.session_id}.`);
			} else {
				// Since no lock, ensure that all sessions get deleted.
				locked = -1;
			}

			// Now delete any Watson API sessions that are not going to be "locked" into.
			for (let i = 0; i < assistantResponses.length; i++) {
				if (i !== locked) {
					deleteSession(assistantResponses[i].apiSession.assistant_id, assistantResponses[i].apiSession.session_id);
				}
			}

			// Not locked, so remove the Watson API session details before sending to client.
			if (locked === -1) {
				if (response && response.apiSession) {
					delete (response.apiSession);
				}
			}

			// If no matching answer, then create a non-response.
			if (!response) {
				response = {ok: true, response: [], confidence: 0.0};
			}

			// Set the server/client session ID to maintain user login (undefined for not logged in).
			response.chatSessionId = clientChatSessionId;
			// Set the asssitantId the made the response.
			response.assistantId = assistantId;

			L.verbose(`Response to client: ${JSON.stringify(response)}`);

			processActions(req, res, msg, response, clientChatSessionId, () => {
				recordHistory(req, msg, response, () => {
					res.json(response);
				});
			});
		}).catch(err => {
			// Some error in contacting one or more of the assistants occurred.
			L.error(err);
			res.status(500).send({ok: false, chatSessionId: clientChatSessionId});
		});
	}


	// Function to send the message to "locked into" assistant.

	const sendMessageAssistantLocked = (req, res, msg, apiSession, clientChatSessionId, recordHistory) => {

		const assistantId = apiSession.assistant_id;
		const assistantConfidenceThreshold = assistantDefs[assistantId].confidence;
		const assistantStayLocked = assistantDefs[assistantId].locked == true;

		sendMessage(req, apiSession.assistant_id, apiSession.session_id, msg, assistantStayLocked,
			(err, response) => {
				if (err) {

					// Some error in contacting the assistant occurred.
					// This is most likely due to the assistant session timing out or becoming invalid.
					// So instead, default back to unlocked state, and if errors still occur, it will report it to client.
					sendMessageAssistantUnlocked(req, res, msg, C.CONFIG.service.chat.assistants, clientChatSessionId, false, recordHistory);
				} else {

					L.verbose(`Assistant confidence threshold: ${assistantConfidenceThreshold}`);

					// If no matching answer, or answer doesn't meet locked in confidence threshold,
					// then "unlock" assistant and send message to all assistants.
					if (!assistantStayLocked || !response || response.confidence <= assistantConfidenceThreshold) {

						L.verbose('Assistant lock threshold not met, unlocking and sending message to all assistants.');

						deleteSession(apiSession.assistant_id, apiSession.session_id, () => {

							sendMessageAssistantUnlocked(req, res, msg, C.CONFIG.service.chat.assistants, clientChatSessionId, false, recordHistory);
						});
					} else {

						// Set the server/client session ID to maintain user login (undefined for not logged in).
						response.chatSessionId = clientChatSessionId;
						// Set the asssitantId the made the response.
						response.assistantId = assistantId;

						L.verbose(`Response to client: ${JSON.stringify(response)}`);

						processActions(req, res, msg, response, clientChatSessionId, exit => {

							if (exit) {
								deleteSession(apiSession.assistant_id, apiSession.session_id, () => {
									if (response.apiSession) {
										delete (response.apiSession);
									}
									recordHistory(req, msg, response, () => {
										res.json(response);
									})
								});
							} else {
								// Add the "locked in" assistant session details.
								response.apiSession = apiSession;
								recordHistory(req, msg, response, () => {
									res.json(response);
								});
							}
						});
					}
				}
			});
	}

	//////////////////////////////////////////////////////////////////////////////

	const recordAnswerHistory = (req, message, response, callback) => {

		// Save the history of answers
		const sess = SESSION.get(C, req);
		if (sess) {
			if (!sess.messageHistory) {
				sess.messageHistory = [];
			}
			if (sess.messageHistory.length > C.CONFIG.service.chat.messageHistory) {
				sess.messageHistory.splice(0, 1);
			}
			sess.messageHistory.push({
				confidence: response.originalConfidence != undefined ? response.originalConfidence : response.confidence,
				message: message
			});
		}

		callback();
	};

	//////////////////////////////////////////////////////////////////////////////

	apiRoutes.post('/chat/message', (req, res) => {

		//NOTE: WORK AROUND FOR NOW SINCE RESPONSE HEADERS AREN'T WORKING FOR SOME REASON.
		//      SESSION MUST BE SENT TO CLIENT OTHERWISE IT WILL LOG THE USER OUT ON THE CLIENT.
		const nodeUserSessionId = res.getHeader('Chat-Session-ID');

		const LN = '/chat/message';
		L.verbose(`${LN}: Entered.`);

		const msg = req.body.message || '';
		if (!msg || msg === '[Object object]') {
			res.json({ok: false, chatSessionId: nodeUserSessionId, error: 'No message provided.'});
		} else {

			const skipLock = req.body.skipLock || false;
			const apiSession = req.body.apiSession || undefined;

			if (skipLock) {
				L.verbose('Client requested to skip assistant lock.');
			}

			if (apiSession) {
				L.verbose(`Client sent assistant locked details: ${apiSession}`);
			}

			if (apiSession && apiSession.assistant_id && apiSession.session_id) {

				// Only send to the "locked in" assistant.  If response doesn't meet threshold confidence, then "unlock" and send to other assistants.
				sendMessageAssistantLocked(req, res, msg, apiSession, nodeUserSessionId, recordAnswerHistory);
			} else {

				// Send message to all assistants and if allowed, lock into an assistant if the threshold confidence for lock is met.
				sendMessageAssistantUnlocked(req, res, msg, C.CONFIG.service.chat.assistants, nodeUserSessionId, skipLock, recordAnswerHistory);
			}
		}
	});

	//////////////////////////////////////////////////////////////////////////////

	const assistantIds = [];
	let assistantDefault = '';
	for (let i = 0; i < C.CONFIG.service.chat.assistants.length; i++) {
		assistantIds.push(C.CONFIG.service.chat.assistants[i].id);
		assistantDefs[C.CONFIG.service.chat.assistants[i].id] = C.CONFIG.service.chat.assistants[i];
		if (C.CONFIG.service.chat.assistants[i].default) {
			assistantDefault = C.CONFIG.service.chat.assistants[i].id;
		}
	}

	return {
		loaded: true,
		// This information will be included in the configuration sent to the client
		// in order to display the responding assistant details in the UI.
		assistantIds: assistantIds,
		assistant: assistantDefs,
		assistantDefault: assistantDefault,
		introStatements: C.CONFIG.service.chat.introStatements,
		startStatements: C.CONFIG.service.chat.startStatements,
		helpHtml: C.CONFIG.service.chat.helpHtml,
		errorMessage: C.CONFIG.service.chat.errorMessage,
		loginErrorMessage: C.CONFIG.service.chat.loginErrorMessage
	};
}
