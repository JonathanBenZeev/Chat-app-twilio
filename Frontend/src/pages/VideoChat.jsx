import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import Video from 'twilio-video'
import { chatService } from '../services/chat.service'
import { FaVideo, FaVideoSlash } from 'react-icons/fa'
import { FaMicrophone, FaMicrophoneLinesSlash } from 'react-icons/fa6'
import { AppHeader } from '../cmps/AppHeader'

export function VideoChat() {
  const loggedInUser = useSelector((storeState) => storeState.userModule.user)
  const [room, setRoom] = useState(null)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)

  const [localMediaAvailable, setLocalMediaAvailable] = useState(false)
  const [remoteParticipants, setRemoteParticipants] = useState([])
  const localMediaRef = useRef()
  const remoteMediaRef = useRef({})
  const localVideoTrackRef = useRef(null)
  const localAudioTrackRef = useRef(null)

  useEffect(() => {
    async function joinVideoRoom() {
      const { token } = await chatService.getToken(loggedInUser.fullname) // Fetch the token from your server
      try {
        const room = await Video.connect(token, {
          name: 'my-room-name',
          audio: true,
          video: true,
        })
        setRoom(room)
        if (!localMediaAvailable) setLocalMediaAvailable(true)
        room.localParticipant.tracks.forEach((publication) => {
          if (publication.track) {
            localMediaRef.current.appendChild(publication.track.attach())

            if (publication.track.kind === 'video') {
              localVideoTrackRef.current = publication.track
            } else if (publication.track.kind === 'audio') {
              localAudioTrackRef.current = publication.track
            }
          }
        })
        const localNameTag = document.createElement('div');
        localNameTag.className = 'name-tag';
        localNameTag.innerText = loggedInUser.fullname; // Or any name you wish to display
        localMediaRef.current.appendChild(localNameTag);
        room.participants.forEach(participantConnected)
        room.on('participantConnected', participantConnected)
        room.on('participantDisconnected', participantDisconnected)

        window.addEventListener('beforeunload', leaveRoom)
      } catch (error) {
        console.error('Error connecting to the video room', error)
      }
    }

    joinVideoRoom()

    return () => {
      leaveRoom()
    }
  }, [])

  const leaveRoom = () => {
    setLocalMediaAvailable(false)
    if (room) {
      room.localParticipant.tracks.forEach((publication) => {
        publication.track.stop()
        publication.track.detach().forEach((element) => element.remove())
      })
      room.disconnect()
      setRoom(null)
      window.removeEventListener('beforeunload', leaveRoom)
    }
  }

  const toggleAudio = () => {
    if (localAudioTrackRef.current) {
      const isCurrentlyEnabled = localAudioTrackRef.current.isEnabled
      localAudioTrackRef.current.enable(!isCurrentlyEnabled)
      setIsAudioMuted(isCurrentlyEnabled) // Change this line
    }
  }

  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      const isCurrentlyEnabled = localVideoTrackRef.current.isEnabled
      localVideoTrackRef.current.enable(!isCurrentlyEnabled)
      setIsVideoEnabled(!isCurrentlyEnabled) // Change this line
    }
  }

  const participantConnected = (participant) => {
    participant.tracks.forEach((publication) => {
      if (publication.isSubscribed) {
        const { track } = publication
        addTrack(track, participant)
      }
    })

    participant.on('trackSubscribed', (track) => {
      addTrack(track, participant)
    })

    participant.on('trackUnsubscribed', (track) => {
      removeTrack(track, participant)
    })

    setRemoteParticipants((prevParticipants) => [
      ...prevParticipants,
      participant,
    ])
  }

  // const addTrack = (track, participant) => {
  //   if (!remoteMediaRef.current[participant.sid]) {
  //     remoteMediaRef.current[participant.sid] = document.createElement('div')
  //   }
  //   remoteMediaRef.current[participant.sid].appendChild(track.attach())
  // }
  const addTrack = (track, participant) => {
    let participantContainer = remoteMediaRef.current[participant.sid];
    if (!participantContainer) {
      participantContainer = document.createElement('div');
      participantContainer.className = 'participant-container'; // Add a class for styling
      remoteMediaRef.current[participant.sid] = participantContainer;
    }
    const nameTag = document.createElement('div');
    nameTag.className = 'name-tag'; // Add a class for styling
    nameTag.innerText = participant.identity; // Assuming the identity is the name you want to display
  
    // Append the name tag and the video track to the participant container
    participantContainer.appendChild(nameTag);
    participantContainer.appendChild(track.attach());
  
    // Append the participant container to the DOM, wherever you want it to appear
    // For example, append it to a main container in your component
  };

  const removeTrack = (track) => {
    track.detach().forEach((element) => element.remove())
  }

  const participantDisconnected = (participant) => {
    setRemoteParticipants((prevParticipants) =>
      prevParticipants.filter((p) => p !== participant)
    )
  }

  return (
    <div className='video-chat'>
      <header>
        {/* <h1>Chat Room</h1> */}
        <AppHeader />
      </header>
      <div className='video-wrapper' ref={localMediaRef}>
        <div className='controls'>
          <button onClick={toggleAudio}>
            {isAudioMuted ? <FaMicrophoneLinesSlash /> : <FaMicrophone />}
          </button>
          <button onClick={toggleVideo}>
            {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
          </button>
          <button onClick={leaveRoom}>Leave Room</button>
        </div>
      </div>
      {remoteParticipants.map((participant) => (
        <div
          className='video-wrapper'
          key={participant.sid}
          ref={(el) => (remoteMediaRef.current[participant.sid] = el)}
        ></div>
      ))}
    </div>
  )
}
