import {
    Component,
    OnInit,
    trigger,
    state,
    style,
    AfterViewChecked,
    transition,
    animate,
    ElementRef,
    HostListener,
    HostBinding,
    ViewChild,
    Input,
    TemplateRef,
    NgZone, DoCheck
} from "@angular/core";
//import { ConfigService} from "../../shared/services/config/config.service"
import { Inject } from "@angular/core"
import { DOCUMENT } from "@angular/platform-browser"
import { StompService, StompConfig, ChatsResponse } from "../../shared/services/config/stomp.service"
import { GlobalState } from "../../app.state";
import { ConfigService } from "../../shared/services/config/config.service";
import { MdSidenav } from "@angular/material";
import { Observable } from "rxjs";
import { DataService } from "../../shared/services/data/data.service";
import { uuid } from "../../shared/util/uuid";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { timestamp } from "rxjs/operator/timestamp";
import { currentId } from "async_hooks";
@Component({
    selector: ".content_inner_wrapper",
    templateUrl: "./chat.component.html",
    styleUrls: ["./chat.component.scss"]
})

export class ChatComponent implements OnInit {
    @ViewChild("leftSidenav2") leftSidenav2: MdSidenav;
    @ViewChild("chatProfile") chatProfile: TemplateRef<any>;
    navMode = "side";
    @Input() chatId;
    chat: any;
    chatThread: any[] = [];
    recipientMedium: number
    threadId: any;
    threads: any;
    messages: any;
    term: any;
    isFocused: any;
    activeThread: any;
    activeProfile: any;
    userEmail: any;
    public newMessage: string;
    value: boolean
    closeResult: string;
    customerId: any;
    businessId: any;
    timestamp: any;
    activeSearch: boolean = false
    textArea: boolean = false;
    chatData = {
        content: [
            {
                customerId: "",
                businessId: ""
            }
        ]
    } as ChatsResponse;
    activeChat = {} as cData;
    tempData = {}
    historyData: any = {
        content: []
    };
    chatThreads: {
        [custId: string]: any[]
    } = {};
    statusText: any
    lastTimeStamp: string;
    config: StompConfig = {} as StompConfig;
    public navIsFixed: boolean = false;
    public scrollbarOptions = { axis: "yx", theme: "minimal-dark" };

    @ViewChild("scrollMe") private myScrollContainer: ElementRef;

    constructor(
        private _state: GlobalState,
        public _config: ConfigService,
        private _elementRef: ElementRef,
        private _DataService: DataService,
        private modalService: NgbModal,
        private _StompService: StompService,
        @Inject(DOCUMENT) private _doc: Document
    ) {
        this._StompService.handleMessageReceived = (msg) => {
            // if(msg.meta.sender.id==this.customerId)
            // {
            // 	this.historyData.content.push(msg)
            // 	console.log("new history data"+this.historyData.content)
            // 	console.log(this.historyData)
            // }
            console.log(JSON.stringify(msg))
            if (!this.chatThreads[msg.meta.sender.id]) {
                this.chatThreads[msg.meta.sender.id] = [];
            }
            this.chatData.content[this.chatData.content.length].push(msg.meta.sender.id);
            this.chatThreads[msg.meta.sender.id].push(msg.data);
        };
    }


    static uuidv4() {
        return (<any>[1e7] + -1e3 + -4e3 + -8e3 + -1e11).toString().replace(/[018]/g,
            c => (<any>c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> <any>c / 4).toString(16)
        )
    }

    onClick(customerId, businessId) {
        //console.log(customerId+"      "+businessId)
        //this.chatThread.custId=customerId;
        this.activeChat.value = true;
        this.activeSearch = true;
        this.customerId = customerId;
        this.businessId = businessId;
        //debugger;
        if (!this.chatThreads[customerId]) {
            this._DataService.getHistory(customerId, businessId, 5, 0).subscribe(resData => {
                try {
                    this.chatThreads[customerId] = resData.content.filter(x => (x.data.type == 0) || (x.data.type == 2 && x.data.content.input && x.data.content.input.val));;
                    //this.historyData.content = this.chatThreads[customerId]
                    //console.log(this.historyData.content)
                }
                catch (e) {
                    console.log(e);
                    debugger;
                }
            });
        }
        else {

        }
    }

    ngOnInit() {

        if (window.innerWidth < 992) {
            this.navMode = "over";
            this.leftSidenav2.opened = false;
        }
        if (window.innerWidth > 992) {
            this.navMode = "side";
            this.leftSidenav2.open();
        }
        this._DataService.getChatDetails().subscribe((resData) => {
            this.chatData = (resData);
            console.log(this.chatData)
            this.activeChat.value = false;

            //console.log("Access Token is" + this._config.profile.accessToken)
            //this.config.customerId=customerId;
            //this.config.businessId=businessId;
            this.config.debug = true;

            // this.chatData.content.forEach(x => {

            // });

            this._StompService.connect(this.config, this.chatData);


            //console.log(JSON.stringify(this.chatData));
        });


        //	console.log(this.chatData)
        this.activeChat.value = false;


    }

    scrollToBottom(): void {
        try {
            this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }

    onScroll(event: UIEvent) {
        if (this.myScrollContainer.nativeElement.scrollTop == 0) {
            //this.timestamp = this.historyData.content[this.historyData.content.length - 1].meta.timestamp;
            //this._DataService.getHistory(this.customerId, this.businessId, 5, 0, this.timestamp).subscribe(resData => {
            //    //console.log(resData.content)
            //    resData.content.foreach(x => {
            //        this.chatThreads[this.customerId].push(x)
            //    })
            //    this.historyData.content = this.chatThreads[this.customerId];
            //    // for (let i = 0; i < resData.content.length; i++) {
            //    // 	this.chatThreads[this.customerId].push(resData);
            //    // 	this.historyData.content.push(resData.content[i]);
            //    // }
            //    //	console.log(this.historyData.content)
            //    //	console.log(JSON.stringify(this.historyData))
            //})
        }
    }


    isMe(senderType) {
        if (senderType != 0) {
            return true;
        } else {
            return false;
        }
    }
    isYou(senderType) {
        if (senderType != 0) {
            return false;
        } else {
            return true;
        }
    }
    getMsgImage(senderType) {
        if (senderType == 0) {
            return "/assets/img/profiles/avatar.png"
        }
        else {
            return "/assets/img/logo/ana-logo.png"
        }
    }

    sendMessage() {
        console.log(this.newMessage)
        let chatThread = this.currentChatThread();
        let lastMsg = chatThread[chatThread.length - 1];
        this.recipientMedium = lastMsg.meta.recipient.medium;

        let msg = {
            "data": {
                "type": 2,
                "content": {
                    "inputType": 0,
                    "input": {
                        "val": this.newMessage
                    }
                }
            },
            "meta": {
                "sender": {
                    "id": this.businessId,
                    "medium": 3
                },
                "recipient": {
                    "id": this.customerId,
                    "medium": this.recipientMedium
                },
                "senderType": 1,
                "id": ChatComponent.uuidv4(),
                "sessionId": lastMsg.meta.sessionId,
                "timestamp": new Date().getTime(),
                "responseTo": lastMsg.meta.id
            }
        };

        // this.historyData.content.push(msg)
        // for(var i=0;i<this.historyData.content.length;i++)
        // {
        // 	console.log("new history"+this.historyData.content[i]);
        // }
        debugger;
        //console.log(msg)
        this._StompService.sendMessage(msg);
        chatThread.push(msg);
        //this.historyData.content = this.chatThreads[this.customerId].push(msg);

        //this._DataService.getHistory(this.customerId, this.businessId, 5, 0, this.timestamp).subscribe(resData => {
        //    this.historyData = resData
        //    console.log(this.historyData)
        //})
        ////console.log(resData.content)
        this.newMessage = null;
    }

    currentChatThread() {
        return this.chatThreads[this.customerId];
    }

    @HostListener("window:resize", ["$event"])
    onResize(event) {
        if (event.target.innerWidth < 992) {
            this.navMode = "over";
            this.leftSidenav2.close();
        }
        if (event.target.innerWidth > 992) {
            this.navMode = "side";
            this.leftSidenav2.open();
        }
    }
}

export interface meta {
    content: {
        text: string,
        mandatory
    }
}

// export class Data {

// }
// export interface content {
// 	data: Data,
// 	meta: {
// 		sender: {
// 			id: string,
// 			medium: number
// 		},
// 		recipient: {
// 			id: string,
// 			medium: number
// 		},

// 		senderType: number,
// 		id: string,
// 		sessionId: string,
// 		timestamp: string,
// 		responseTo: string
// 	}
// }

// export interface message {
// 	content: content[],
// 	number: number,
// 	numberOfElements: number,
// 	size: number,
// 	totalElements: number,
// 	isFirst: boolean,
// 	isLast: boolean,
// 	totalPages: number
// }

export interface cData {
    value: boolean,
    name: string

};