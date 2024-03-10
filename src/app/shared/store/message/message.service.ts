import { Injectable } from "@angular/core";
import { MessageModel } from "./message.model";
import { environment } from "environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiResultFormat } from "../global";

@Injectable({
    providedIn:"root"
})
export class MessageService
{
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {}

    /**
     * Send Message
     */
    sendMessage(message:MessageModel): Observable<ApiResultFormat<MessageModel>>
    {
        let formData = new FormData();
        for ( var key in message ) {
            if(key=="planification") formData.append(key,JSON.stringify( message[key]));
            else formData.append(key, message[key]);
        }
        return this._httpClient.post<ApiResultFormat<MessageModel>>(`${environment.apiUrl}/message/post`, formData)
    }
    
}