
import { httpService } from './http.service'


export const chatService = {
  getToken
}


async function getToken(userName) {
   return await httpService.get(`token?identity=${userName}`)

}

