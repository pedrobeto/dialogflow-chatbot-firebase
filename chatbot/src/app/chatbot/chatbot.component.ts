import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const dialogflowURL = 'https://us-central1-fir-base-node.cloudfunctions.net/dialogflowGateway';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit {
  messages = [];
  loading = false;

  // simple random ID to maintain session with server
  // for tests its ok, but better use something like uuid on prod
  sessionId = Math.random().toString(36).slice(-5);

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.addBotMessage('Human presence detected 🤖. How can I help you? ');
  }

  handleUserMessage(event) {
    const text = event.message;
    this.loading = true;
    this.addUserMessage(text);

    // make http request to dialog through firebase
    this.http.post<any>(
      dialogflowURL,
      {
        sessionId: this.sessionId,
        queryInput: {
          text: {
            text,
            languageCode: 'en-US'
          }
        }
      }
    )
    .subscribe(res => {
      this.addBotMessage(res.fulfillmentText);
      this.loading = false;
    });
  }


  // helpers
  addUserMessage(text) {
    this.messages.push({
      text,
      sender: 'You',
      reply: true,
      date: new Date()
    });
  }

  addBotMessage(text) {
    this.messages.push({
      text,
      sender: 'Bot',
      avatar: '/assets/bot.jpeg',
      date: new Date()
    });
  }
}
