import React from 'react'
import Authentication from '../../util/Authentication/Authentication'

import './App.css'

/*  Taken from https://stackoverflow.com/a/5663611
 *  Return a date string as yyyymmddThhmmssZ
 *  in UTC.
 *  Use supplied date object or, if no
 *  object supplied, return current time
 */
const jwt = require('jsonwebtoken')
const clientId = "9r6z4p0jcomcdydex394t2rpnugsqy";

import './App.css'

var dateToUTCString = (function () {

  // Add leading zero to single digit numbers
  function addZ(n) {
    return (n<10)?'0'+n:''+n;
  }

  return function(d) {

    // If d not supplied, use current date
    var d = d || new Date();

    return d.getUTCFullYear() + '-' +
           addZ(d.getUTCMonth() + 1) + '-' +
           addZ(d.getUTCDate()) +
           'T' +
           addZ(d.getUTCHours()) + ":" +
           addZ(d.getUTCMinutes()) + ":" +
           addZ(d.getUTCSeconds()) +
           'Z';
  }
}());

export default class App extends React.Component{
    constructor(props){
        super(props)
        this.Authentication = new Authentication()

        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null
        this.state={
            finishedLoading:false,
            theme:'light',
            isVisible:true,
            theme:'light' ,
            isVisible:true
        }

        this.clips = [];
        this.broadcasterName = "";

        this.yesterdayDate = new Date();
        this.yesterdayDate.setDate(this.yesterdayDate.getDate() - 1);
        this.yesterdayDate = dateToUTCString(this.yesterdayDate);

        this.todayDate = new Date();
        this.todayDate = dateToUTCString(this.todayDate);
    }

    contextUpdate(context, delta){
        if(delta.includes('theme')){
            this.setState(()=>{
                return {theme:context.theme}
            })
        }
    }

    visibilityChanged(isVisible){
        this.setState(()=>{
            return {
                isVisible
            }
        })
    }

    componentDidMount(){
        if(this.twitch){
            this.twitch.onAuthorized((auth)=>{
                this.Authentication.setToken(auth.token, auth.userId)
                //this.twitch.rig.log(`This is the ID: ${auth.channelId}.`);

                let numClips = 6;

                // TODO: RESET TO CHANNEL_ID WHEN LAUNCH
                // This is a manual test for Shroud
                let broadcaster_id = 37402112;


                fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${broadcaster_id}&first=${numClips}&started_at=${this.yesterdayDate}&ended_at=${this.todayDate}`, {
                      method: "GET",
                      headers: {
                        "Client-ID": clientId
                      }
                    })
                  .then(results => {
                    return results.json();
                  }).then(json => {
                    if (json.data.length) {
                      this.broadcasterName = json.data[0].broadcaster_name;
                    }

                    for (let clip of json.data) {
                      this.clips.push(clip);
                    }

                    this.forceUpdate();
                  })

                //
                // async function getClips() {
                //   let response = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=37402112&first=${numClips}`, {
                //     method: "GET",
                //     headers: {
                //       "Client-ID": "9r6z4p0jcomcdydex394t2rpnugsqy"
                //     }
                //   });
                //
                //   let json = response.json();
                //   return json;
                // }
                //
                //
                // Promise.all([getClips()]).then(json => {
                //   this.twitch.rig.log(json);
                //   for (let clip of json) {
                //     clipURLs.push(clip.url);
                //   }
                // });

                // this.twitch.rig.log(clipURLs);


                //
                let decoded = jwt.decode(auth.token);
                this.twitch.rig.log(decoded);

                if(!this.state.finishedLoading){
                    // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.

                    // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
                    this.setState(()=>{
                        return {finishedLoading:true}
                    })
                }
            })

            this.twitch.listen('broadcast',(target,contentType,body)=>{
                this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)
                // now that you've got a listener, do something with the result... 

                // do something...

            })

            this.twitch.onVisibilityChanged((isVisible,_c)=>{
                this.visibilityChanged(isVisible)
            })

            this.twitch.onContext((context,delta)=>{
                this.contextUpdate(context,delta)
            })
        }
    }

    componentWillUnmount() {
        if(this.twitch){
            this.twitch.unlisten('broadcast', ()=>console.log('successfully unlistened'))
        }
    }
    
    render() {
        if(this.state.finishedLoading && this.state.isVisible){
            var images = [];
            if (this.clips.length) {
                for (let clip of this.clips) {
                    images.push(clip);
                }
                //this.twitch.rig.log(this.clips.length);
            }
            return (
                <div className="App">
                    <div className={this.state.theme === 'light' ? 'App-light' : 'App-dark'} >
                        <h2>EZclips!</h2>

                        {/*
                          * BUG:
                          * This creates images that you can right click
                          * and open in a new tab (because of target="_blank")
                          * but you cannot left click to open them.
                          * If I remove target="_blank", then left clicking the
                          * image breaks the extension altogether.
                          * Feel free to try it yourself.
                          */}
                        <div id="logo-holder">{images.map(image => <a href={image.url} target="_blank" title={image.title}><img src={image.thumbnail_url} alt="" className="image"></img></a>)}</div>
                    </div>
                </div>
            )
        }else{
            return (
                <div className="App">
                </div>
            )
        }

    }
}