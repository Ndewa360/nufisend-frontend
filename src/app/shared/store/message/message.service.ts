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
        const formData = new FormData();
        Object.entries(message || {}).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (key === "planification") {
                formData.append(key, JSON.stringify(value));
            } else if (Array.isArray(value)) {
                formData.append(key, value.join(","));
            } else if (value instanceof File || value instanceof Blob) {
                formData.append(key, value);
            } else {
                formData.append(key, String(value));
            }
        });
        return this._httpClient.post<ApiResultFormat<MessageModel>>(`${environment.apiUrl}/message/post`, formData)
    }
    
}