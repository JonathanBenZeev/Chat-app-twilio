import { useSelector } from 'react-redux'
import { Client as ConversationsClient } from '@twilio/conversations'
import { useState, useEffect } from 'react'
import { chatService } from '../services/chat.service'

export function ChatApp() {
  const loggedInUser = useSelector((storeState) => storeState.userModule.user)
  const [client, setClient] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [token, setToken] = useState(null)

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
      //     uniqueName: 'test8'
      // });

      // **how to join a conversation **
      const conversation = await client.getConversationByUniqueName('test8')
      setConversation(conversation)

      //**How to add users to conversation **
      // try {
      //     await conversation.add('yoyo bu');
      //     console.log('Participant added');
      // } catch (err) {
      //     console.error('Error adding participant:', err);
      // }

      if (!conversation) {
        await conversation.join();
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
 
  console.log(loggedInUser);
  return (
    <section className='chat'>
      <div>
        <div>
          {messages.map((message, index) => (
            <p key={index}>
              {message.author} : {message.body}
            </p>
          ))}
        </div>
        <input
          type='text'
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder='Type your message'
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </section>
  )
}
