import { Injectable } from '@angular/core';
import * as SockJS from 'sockjs-client';
import * as StompJS from 'stompjs';
import { ConfigService } from './config.service'
import { DataService } from '../data/data.service'
import { parse } from 'date-fns';
//import { ChatMessageVM, MessageStatus } from '../models/ana-chat-vm.models';
//import { ANAChatMessage } from '../models/ana-chat.models';
//import { UtilitiesService } from '../services/utilities.service';

@Injectable()
export class StompService {
	public config: StompConfig;
	private client: StompJS.Client;
	private sockInstance: any;
	public count = 0;
	private timer: NodeJS.Timer;
	private stompHeaders: any = {};
	public liveMsgStorage: {};
	//public chatData={};
	public chatDataNew = {} as ChatsResponse;
	//chatDataNew.content=[];
	connectionStatus: StompConnectionStatus;

	constructor(private _config: ConfigService, private _data: DataService) { }


	public connect(config?: StompConfig, chatData?: ChatsResponse) {
		//this.clearTimer();

		//;
		//config.customerId="agent1";
		//console.log(chatData);
		this.configure(config);
		//console.log(JSON.stringify(chatData))
		this.chatDataNew = chatData;
		if (!this.client)
			throw Error('Client not configured!');
		this.debug('Connecting...');
		this.connectionStatus = StompConnectionStatus.Connecting;
		this.stompHeaders = { user_id: this._config.profile.userId };
		this.client.connect(this.stompHeaders, this.onConnect, this.onError);

		console.log("Connnected")
	}
	private clearTimer() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}
	private disconnect() {
		this.clearTimer();
		if (this.client && this.client.connected) {
			this.client.disconnect(() => this.debug("WebSocket Disconnected"));
		}
	}

	private debug = (...args: any[]) => {
		if (console && console.log && console.log.apply && this.config && this.config.debug)
			console.log.apply(console, args);
	}

	configure(config?: StompConfig) {
		if (config === null && this.config === null)
			throw Error('No configuration provided!');

		if (config != null)
			this.config = config;

		this.sockInstance = new SockJS(this._config.app.webSocketEndPoint + "/chatagents-websocket?access-token=" + this._config.profile.accessToken);
		this.client = StompJS.over(this.sockInstance);
		this.connectionStatus = StompConnectionStatus.Disconnected;
		this.client.debug = (this.config.debug || this.config.debug == null ? this.debug : null);
	}
	//Should be an arrow function to follow class context
	private onConnect = (frame: StompJS.Frame) => {
		//	this.clearTimer();

		if (this.connectionStatus == StompConnectionStatus.Connected)
			return;
		//console.log(this.chatDataNew)
		try {
			this.subscribe();
			this.connectionStatus = StompConnectionStatus.Connected;

			//	if (this.handleConnect)
			//		this.handleConnect();
		} catch (e) {
			this.debug(e);
			this.connectionStatus = StompConnectionStatus.Disconnected;
		}
	}

	private subscribe = () => {
		//this.stompHeaders['user_id'] = this._config.profile.userId;
		let userId = this._config.profile.userId

		this.stompHeaders['id'] = this.count++;

		this.client.subscribe('/topic/presence', (message) => {
			this.client.send("/app/presence", this.stompHeaders, JSON.stringify({ user_id: userId }));
		}, this.stompHeaders);

		this.stompHeaders['id'] = this.count++;
		this.client.subscribe('/queue/events/user/' + this._config.profile.userId, (message) => {
			console.log(JSON.parse(message.body));
			var eventMsg = JSON.parse(message.body);
			console.log("subscribed for agent events" + this._config.profile.userId)
			//this.liveMsgStorage=liveMsg;
			for (var i = 0; i < eventMsg.events.length; i++) {
				var eventType = eventMsg.events[i].type;
				if (eventType == 5) {
					//liveMsg.content.customerId=liveMsg.meta.sender.id;
					this.stompHeaders['id'] = this.count++;
					this.client.subscribe(eventMsg.events[i].channel, (liveStompMessage) => {
						console.log("live message");
						console.log(liveStompMessage);
						//console.log("subscribed for user" + this.chatDataNew.content[i].customerId)

						this.onMessage(liveStompMessage);
					}, this.stompHeaders);
				}
			}

		}, this.stompHeaders);

		//	debugger;
		this.chatDataNew.content.forEach(x => {
			this.stompHeaders['id'] = this.count++;

			this.client.subscribe('/topic/chat/customer/' + x.customerId + "/business/" + x.businessId, (message) => {
				console.log("user message");
				console.log(JSON.parse(message.body));
				//console.log("subscribed for user" + this.chatDataNew.content[i].customerId)
				this.onMessage(JSON.parse(message.body));
			}, this.stompHeaders);

		});


		// 	this.stompHeaders['id'] = this.uuidv4();
		// 	this.client.subscribe('/queue/events/user/' + custId, (message) => {
		// 		this.onAck(message.headers['tid']);
		// 	}, this.stompHeaders);


	}


	private onError = (error: string | StompJS.Message) => {
		this.connectionStatus = StompConnectionStatus.Disconnected;

		if (typeof error === 'object')
			error = error.body;

		if (this.config && this.config.debug)
			this.debug('Socket Error: ' + JSON.stringify(error));

		this.debug(`Error: ${error}`);
		if (error.indexOf('Lost connection') !== -1)
			this.delayReconnect(5000);
	}

	private delayReconnect(t: number) {
		this.debug(`Reconnecting in ${t / 1000} second(s)...`);
		this.timer = setTimeout(() => {
			this.connect();
		}, t);
	}

	// private onAck = (msgAckId: string) => {
	// 	this.debug("Ack Msg Id: " + msgAckId);
	// 	//if (this.handleAck)
	// 		this.handleAck(msgAckId);
	// };

	private msgsIds: string[] = [];
	private onMessage = (messageBody: any) => {
		if (this.handleMessageReceived) {
			let anaMsg = messageBody;
			// 	let anaMsg:{
			// 		meta:{
			// 			id:number
			// 		}

			// 	}
			// 	anaMsg=messageBody
			// 	if (this.msgsIds.indexOf(anaMsg.meta.id) == -1) { //handle message only if it is not already handled
			// 		this.msgsIds.push(anaMsg.meta.id);
			this.handleMessageReceived(anaMsg);
			//}
		}
	}

	sendMessage(msg: any) {
		this.debug("Sent Socket Message: ");
		this.debug(msg);

		let headers = this.stompHeaders;
		this.client.send(`/app/message`, headers, JSON.stringify(msg));
		console.log(JSON.stringify(msg))
	}

	// 	handleConnect: () => void;
	handleMessageReceived: (message: any) => any;
	// 	handleAck: (messageAckId: string) => any;
	// 
}
export interface StompConfig {
	endpoint: string;
	customerId: string;
	businessId: string;
	debug: boolean;
}

export enum StompConnectionStatus {
	None,
	Connected,
	Disconnected,
	Connecting
}

export interface ChatsResponse {
	content: any[];
	number: number;
	numberOfElements: number;
	size: number;
	totalElements: number;
	isFirst: boolean;
	isLast: boolean;
	totalPages: number;
};