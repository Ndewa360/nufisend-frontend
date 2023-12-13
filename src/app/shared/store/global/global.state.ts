import { Action, State, StateContext } from "@ngxs/store";
import { GlobalModel } from "./global.model";
import { Injectable } from "@angular/core";
import { GlobalAction } from "./global.actions";

@State<GlobalModel>({
    name: "globals",
    defaults:{
        isLoading:false,
        notifications:[]
    }
})
@Injectable()
export class GlobalState{

    @Action(GlobalAction.ChangeLoading)
    setGlobalLoading(ctx:StateContext<GlobalModel>,action:GlobalAction.ChangeLoading)
    {
        ctx.patchState({isLoading:action.isLoading});
    }

    @Action(GlobalAction.AddNotification)
    addNewGlobalNotification(ctx:StateContext<GlobalModel>,action:GlobalAction.AddNotification)
    {
        const state = ctx.getState()
        const notifs = [...state.notifications,action.notification];
        const pos = notifs.length-1;
        ctx.patchState({notifications:notifs});
        setTimeout(()=>{
            notifs.splice(pos,1);
            ctx.patchState({notifications:notifs})
        },10000);
    }
}