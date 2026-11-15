import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { PlanificationModel, PlanificationOccurrencesItem } from "./planification.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiResultFormat } from "../global";

@Injectable({
    providedIn:'root'
})
export class PlanificationService
{
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {}
    /**
     * Get planifications
     */
    getPlanifications(): Observable<ApiResultFormat<PlanificationModel[]>>
    {
        return this._httpClient.get<ApiResultFormat<PlanificationModel[]>>(`${environment.apiUrl}/planifications`)
    }

    /**
     * Occurrences des planifications entre deux jours (YYYY-MM-DD, bornes incluses).
     */
    getOccurrences(from:string, to:string): Observable<ApiResultFormat<PlanificationOccurrencesItem[]>>
    {
        const params = new HttpParams().set('from', from).set('to', to);
        return this._httpClient.get<ApiResultFormat<PlanificationOccurrencesItem[]>>(`${environment.apiUrl}/planifications/occurrences`, { params })
    }

    /**
     * Update planification
     */
    updatePlanification(planification:PlanificationModel,id:string): Observable<ApiResultFormat<PlanificationModel>>
    {
        return this._httpClient.put<ApiResultFormat<PlanificationModel>>(`${environment.apiUrl}/planifications/${id}`, planification)
    }

    /**
     * Delete planification
     */
    deletePlanification(id:string): Observable<ApiResultFormat<null>>
    {
        return this._httpClient.delete<ApiResultFormat<null>>(`${environment.apiUrl}/planifications/${id}`)
    }
}