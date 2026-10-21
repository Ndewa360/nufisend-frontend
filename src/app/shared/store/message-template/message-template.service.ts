import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { MessageTemplateModel } from "./message-template.model";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiResultFormat } from "../global";

@Injectable({
    providedIn:'root'
})
export class MessageTemplateService
{
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {}
    /**
     * Get message-template
     */
    getMessageTemplates(): Observable<ApiResultFormat<MessageTemplateModel[]>>
    {
        return this._httpClient.get<ApiResultFormat<MessageTemplateModel[]>>(`${environment.apiUrl}/message-template`)
    }

    /**
     * Create Message Template
     */
    createMessageTemplate(messageTemplate:MessageTemplateModel): Observable<ApiResultFormat<MessageTemplateModel>>
    {
        return this._httpClient.post<ApiResultFormat<MessageTemplateModel>>(`${environment.apiUrl}/message-template`, messageTemplate)
    }

    /**
     * Update Message Template
     */
    updateMessageTemplate(messageTemplate:MessageTemplateModel,id:string): Observable<ApiResultFormat<MessageTemplateModel>>
    {
        return this._httpClient.put<ApiResultFormat<MessageTemplateModel>>(`${environment.apiUrl}/message-template/${id}`, messageTemplate)
    }

    /**
     * Delete Message Template
     */
    deleteMessageTemplate(id:string): Observable<ApiResultFormat<null>>
    {
        return this._httpClient.delete<ApiResultFormat<null>>(`${environment.apiUrl}/message-template/${id}`)
    }
}