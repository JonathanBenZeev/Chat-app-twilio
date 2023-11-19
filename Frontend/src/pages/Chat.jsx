import { useSelector } from 'react-redux'
import { Client as ConversationsClient } from '@twilio/conversations'
import { useState, useEffect, useRef } from 'react'
import { chatService } from '../services/chat.service'
import { AppHeader } from '../cmps/AppHeader'

export function ChatApp() {
  const loggedInUser = useSelector((storeState) => storeState.userModule.user)
  const [client, setClient] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [token, setToken] = useState(null)
  const messageContainerRef = useRef(null)

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (!loggedInUser) {
      setMessages([])
      return
    }
    initializeClient()
  }, [token, loggedInUser])

  useEffect(() => {
    if (conversation) {
      const handleNewMessage = (message) => {
        setMessages((prevMessages) => [...prevMessages, message])
      }

      conversation.on('messageAdded', handleNewMessage)

      // Clean up the listener when the component unmounts or conversation changes
      return () => {
        conversation.off('messageAdded', handleNewMessage)
      }
    }
  }, [conversation])

  const initializeClient = async () => {
    if (token) {
      try {
        const initializedClient = await ConversationsClient.create(token)
        setClient(initializedClient)
        await joinConversation(initializedClient)
      } catch (err) {
        console.error('Error initializing Twilio client:', err)
      }
    } else {
      await connect()
    }
  }

  const connect = async () => {
    if (!loggedInUser) return
    try {
      const tokenResponse = await chatService.getToken(loggedInUser.fullname)
      setToken(tokenResponse.token)
    } catch (error) {
      console.error(error, 'Error fetching token:')
    }
  }

  const joinConversation = async (client) => {
    try {
      // **how to create a conversation**
      // await client.createConversation({
      //     uniqueName: 'test20'
      // });

      // **how to join a conversation **
      const conversation = await client.getConversationByUniqueName('test20')
      setConversation(conversation)

      //**How to add users to conversation **
      // try {
      //     await conversation.add('asf');
      //     console.log('Participant added');
      // } catch (err) {
      //     console.error('Error adding participant:', err);
      // }

      if (!conversation) {
        await conversation.join()
      }

      try {
        const messagesPaginator = await conversation.getMessages()
        setMessages(messagesPaginator.items)
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    } catch (error) {
      console.error('Error joining conversation:', error)
    }
  }

  // Send a message to the conversation
  const sendMessage = async () => {
    if (client && newMessage.trim() && conversation && loggedInUser) {
      try {
        await conversation.sendMessage(newMessage)
        setNewMessage('')
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }
  }

  return (
    <section className='chat-app'>
      <header>
        <AppHeader/>
      </header>
      <div className='message-area' ref={messageContainerRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.author === loggedInUser.fullname
                ? 'message sent'
                : 'message received'
            }
          >
            {message.author !== loggedInUser.fullname && (
              <div className='message-author'>{message.author}</div>
            )}
            <p>{message.body}</p>
            <span className='timestamp'>
              {new Date(message.dateCreated).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ))}
      </div>
      <div className='input-area'>
        <input
          type='text'
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder='Type your message'
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </section>
    // <section className='chat-app'>
    //   <div>
    //     <div>
    //       {messages.map((message, index) => (
    //         <p key={index}>
    //           {message.author} : {message.body}
    //         </p>
    //       ))}
    //     </div>
    //     <input
    //       type='text'
    //       value={newMessage}
    //       onChange={(e) => setNewMessage(e.target.value)}
    //       placeholder='Type your message'
    //     />
    //     <button onClick={sendMessage}>Send</button>
    //   </div>
    // </section>
  )
}
