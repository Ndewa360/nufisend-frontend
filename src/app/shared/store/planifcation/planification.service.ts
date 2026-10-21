import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { PlanificationModel } from "./planification.model";
import { HttpClient } from "@angular/common/http";
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