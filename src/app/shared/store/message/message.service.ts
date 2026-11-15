import { Injectable } from "@angular/core";
import { MessageModel } from "./message.model";
import { environment } from "environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
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
    sendMessage(message:MessageModel, idempotencyKey:string): Observable<ApiResultFormat<MessageModel>>
    {
        const formData = new FormData();
        Object.entries(message || {}).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (key === "planification" || key === "template") {
                formData.append(key, JSON.stringify(value));
            } else if (Array.isArray(value) && value.some((item) => item instanceof Blob)) {
                // Plusieurs fichiers : un champ multipart par fichier.
                value.forEach((item) => formData.append(key, item));
            } else if (Array.isArray(value)) {
                formData.append(key, value.join(","));
            } else if (value instanceof File || value instanceof Blob) {
                formData.append(key, value);
            } else {
                formData.append(key, String(value));
            }
        });
        // Le serveur refuse un envoi sans cle : un rejeu reseau ne cree pas un second envoi.
        const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
        return this._httpClient.post<ApiResultFormat<MessageModel>>(`${environment.apiUrl}/message/post`, formData, { headers })
    }
    
}