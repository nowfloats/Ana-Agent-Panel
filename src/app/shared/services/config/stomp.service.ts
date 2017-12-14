import { Injectable } from '@angular/core';
import * as SockJS from 'sockjs-client';
import * as StompJS from 'stompjs';
import { ConfigService } from './config.service'
import { DataService, ChatCustomerInfo } from '../data/data.service'
import { parse } from 'date-fns';

@Injectable()
export class StompService {
	public config: StompConfig;
	private client: StompJS.Client;
	private sockInstance: any;
	public count = 0;
	private timer: NodeJS.Timer;
	private stompHeaders: any = {};
	public liveMsgStorage: {};
	connectionStatus: StompConnectionStatus;

	constructor(private _config: ConfigService, private _data: DataService) { }

	public connect(config?: StompConfig) {
		this.configure(config);
		if (!this.client)
			throw Error('Client not configured!');
		this.debug('Connecting...');
		this.connectionStatus = StompConnectionStatus.Connecting;
		this.stompHeaders = { user_id: this._config.profile.userId };
		this.client.connect(this.stompHeaders, this.onConnect, this.onError);
	}
	private clearTimer() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}
	public disconnect() {
		this.clearTimer();
		if (this.client && this.client.connected) {
			this.client.disconnect(() => this.debug("WebSocket Disconnected"));
			delete this.client;
			delete this.sockInstance;
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
		console.log("Socket Connected");

		if (this.connectionStatus == StompConnectionStatus.Connected)
			return;

		try {
			this.subscribe();
			if (this.handleConnect)
				this.handleConnect();

			this.connectionStatus = StompConnectionStatus.Connected;
		} catch (e) {
			this.debug(e);
			this.connectionStatus = StompConnectionStatus.Disconnected;
		}
	}

	private subscribe = () => {
		this.stompHeaders['user_id'] = this._config.profile.userId;
		let userId = this._config.profile.userId
		this.stompHeaders['id'] = this.count++;

		this.client.subscribe('/topic/presence', (message) => {
			this.client.send("/app/presence", this.stompHeaders, JSON.stringify({ user_id: userId }));
		}, this.stompHeaders);

		this.stompHeaders['id'] = this.count++;
		this.client.subscribe('/queue/events/user/' + this._config.profile.userId, (message) => {
			var eventMsg = JSON.parse(message.body);
			for (var i = 0; i < eventMsg.events.length; i++) {
				var eventType = eventMsg.events[i].type;
				if (eventType == 5) {
					this.stompHeaders['id'] = this.count++;
					this.client.subscribe(eventMsg.events[i].channel, (message) => {
						this.onMessage(JSON.parse(message.body));
					}, this.stompHeaders);
					console.log(eventMsg);
					if (this.handleNewChat)
						this.handleNewChat({
							agentId: '',
							assignedAt: Date(),
							businessId: '',
							created_at: '',
							customerId: eventMsg.meta.sender.id,
							id: 0,
							last_message_time: '',
							status: 0,
							unreadCount: 0
						});
				}
			}
		}, this.stompHeaders);
	}

	allChatsSubscription(custChats: ChatCustomerInfo[]) {
		custChats.forEach(custChat => {
			this.stompHeaders['id'] = this.count++;
			this.client.subscribe('/topic/chat/customer/' + custChat.customerId + "/business/" + custChat.businessId, (message) => {
				this.onMessage(JSON.parse(message.body));
			}, this.stompHeaders);
		});
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

	private msgsIds: string[] = [];
	private onMessage = (messageBody: any) => {
		if (this.handleMessageReceived)
			this.handleMessageReceived(messageBody);
	}

	sendMessage(msg: any) {
		let headers = this.stompHeaders;
		this.client.send(`/app/message`, headers, JSON.stringify(msg));
	}

	handleMessageReceived: (message: any) => void;
	handleConnect: () => void;
	handleNewChat: (custInto: ChatCustomerInfo) => void;
}
export interface StompConfig {
	endpoint: string;
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