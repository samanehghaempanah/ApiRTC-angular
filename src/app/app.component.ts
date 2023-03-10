import { Component } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
declare var apiRTC: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ApiRTC-angular';

  conversationFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required])
  });

  constructor(private fb: FormBuilder) {
  }

  get conversationNameFc(): FormControl {
    return this.conversationFormGroup.get('name') as FormControl;
  }


  getOrcreateConversation() {
    var localStream: any  = null;

    //==============================
    // 1/ CREATE USER AGENT
    //==============================
    var ua = new apiRTC.UserAgent({
      uri: 'apzkey:myDemoApiKey'
    });

    //==============================
    // 2/ REGISTER
    //==============================
    ua.register().then((session : any) => {

      //==============================
      // 3/ CREATE CONVERSATION
      //==============================
      const conversation = session.getConversation(this.conversationNameFc.value);

      //==========================================================
      // 4/ ADD EVENT LISTENER : WHEN NEW STREAM IS AVAILABLE IN CONVERSATION
      //==========================================================
      conversation.on('streamListChanged', (streamInfo: any) => {
        console.log("streamListChanged :", streamInfo);
        if (streamInfo.listEventType === 'added') {
          if (streamInfo.isRemote === true) {
            conversation.subscribeToMedia(streamInfo.streamId)
              .then((stream : any) => {
                console.log('subscribeToMedia success');
              }).catch((err : any) => {
                console.error('subscribeToMedia error', err);
              });
          }
        }
      });
      //=====================================================
      // 4 BIS/ ADD EVENT LISTENER : WHEN STREAM IS ADDED/REMOVED TO/FROM THE CONVERSATION
      //=====================================================
      conversation.on('streamAdded', (stream: any) => {
        stream.addInDiv('remote-container', 'remote-media-' + stream.streamId, {}, false);
      }).on('streamRemoved', (stream: any) => {
        stream.removeFromDiv('remote-container', 'remote-media-' + stream.streamId);
      });

      //==============================
      // 5/ CREATE LOCAL STREAM
      //==============================
      ua.createStream({
        constraints: {
          audio: true,
          video: true
        }
      })
        .then((stream: any) => {

          console.log('createStream :', stream);

          // Save local stream
          localStream = stream;
          stream.removeFromDiv('local-container', 'local-media');
          stream.addInDiv('local-container', 'local-media', {}, true);

          //==============================
          // 6/ JOIN CONVERSATION
          //==============================
          conversation.join()
            .then((response: any) => {
              //==============================
              // 7/ PUBLISH LOCAL STREAM
              //==============================
              conversation.publish(localStream);
            }).catch((err :any) => {
              console.error('Conversation join error', err);
            });

        }).catch((err:any) => {
          console.error('create stream error', err);
        });
    });
  }
}
