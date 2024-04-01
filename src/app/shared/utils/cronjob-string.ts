import { PlanificationType, CRON_JOB_TYPE, CRON_JOB_RECCURENT_TYPE } from "../store/planifcation";
import { DateUtil } from "./date-util";

export class CronJobString
{
    static transformPlanificationToCronJobArray(planning:PlanificationType[]):{planObj:PlanificationType,plan:string}[]
    {
        return planning.map((plan)=>{
            let planString=null;
            if(plan.type==CRON_JOB_TYPE.IS_ALL_DAY) planString=CronJobString.transformAllDatePlanificationToCronJobString(plan)
            if(plan.type==CRON_JOB_TYPE.IS_RECCURENT) planString=CronJobString.transformReccurentPlanificationToCronJobString(plan)
            if(plan.type==CRON_JOB_TYPE.IS_RANDOM) planString=CronJobString.transformRandomPlanificationToCronJobString(plan)
            return {planObj:plan,plan:planString}
        })
    }

    static transformAllDatePlanificationToCronJobString(planning:PlanificationType)
    {
        let cronString = CronJobString.transformTimeToCronJobString(planning.time);
        let dateNow = new Date(), 
        startDate = new Date(planning.startDate),
        endDate = new Date(planning.endDate),
        lastDayOfStartDateMonth = new Date(startDate.getFullYear(),startDate.getMonth()+1,0),
        firstDayOfEndDateMonth = new Date(endDate.getFullYear(),endDate.getMonth(),1),
        lastDayOfEndDateMonth = new Date(endDate.getFullYear(),endDate.getMonth(),1);

        if(startDate.getMonth()==endDate.getMonth() && startDate.getFullYear()==endDate.getFullYear())
        {
            if(startDate.getMonth()==dateNow.getMonth()) cronString+=` ${startDate.getDate()-endDate.getDate()} ${startDate.getMonth()+1} *`
            return null;
        }
        else if(dateNow>=startDate && dateNow<=lastDayOfStartDateMonth) cronString+=` ${startDate.getDate()}-${lastDayOfStartDateMonth.getDate()} ${startDate.getMonth()+1} *`
        else if(dateNow>=firstDayOfEndDateMonth && dateNow<=lastDayOfEndDateMonth && endDate<=lastDayOfEndDateMonth) cronString += `  ${firstDayOfEndDateMonth.getDate()}-${endDate.getDate()} ${startDate.getMonth()+1} *`
        else cronString+=` * ${firstDayOfEndDateMonth.getMonth()+1} *`;
        return cronString;
    }

    static transformReccurentPlanificationToCronJobString(planning:PlanificationType)
    {
        let cronString = CronJobString.transformTimeToCronJobString(planning.time);
        switch (planning.recurency) {
            case CRON_JOB_RECCURENT_TYPE.DAY:
                cronString+=` */${planning.every} ${new Date().getMonth()+1} *`
                break;
            case CRON_JOB_RECCURENT_TYPE.WEEK:
                let newCurrentDateWeek=new Date();
                newCurrentDateWeek.setDate(1);
                DateUtil.setFirstDayOfWeek(newCurrentDateWeek,planning.dayOfWeek+1);
                let datesString= `${newCurrentDateWeek.getDate()}`;
                for(let i=0;i<=4; i++)
                {
                    newCurrentDateWeek.setDate(newCurrentDateWeek.getDate()+7*planning.every);
                    if(newCurrentDateWeek.getMonth()+1<=(new Date().getMonth()+1)) datesString+= `,${newCurrentDateWeek.getDate()}`;
                }                
                cronString+=` ${datesString} ${newCurrentDateWeek.getMonth()+1} *`

                break;
            case CRON_JOB_RECCURENT_TYPE.MONTH:
                let begingMonthDate = new Date(planning.date), newCurrentDateMonth = new Date();
                
                if(newCurrentDateMonth.getFullYear()==begingMonthDate.getFullYear() && newCurrentDateMonth.getMonth()==begingMonthDate.getMonth())
                {
                    cronString+=` ${begingMonthDate.getDate()} ${begingMonthDate.getMonth()+1} *`
                }
                else return null;
                break;
            case CRON_JOB_RECCURENT_TYPE.YEAR:
                let begingYearDate = new Date(planning.date), newCurrentDateYear = new Date();
                newCurrentDateYear.setFullYear(newCurrentDateYear.getFullYear()+planning.every);
                
                if((newCurrentDateYear.getFullYear()-begingYearDate.getFullYear()%planning.every==0) && newCurrentDateYear.getMonth()==begingYearDate.getMonth())
                {
                    cronString+=` ${begingYearDate.getDate()} ${begingYearDate.getMonth()+1} *`
                }
                else return null;
                break;
        }
        return cronString;
    }

    static transformRandomPlanificationToCronJobString(planning:PlanificationType)
    {
        let dayString="";
        let newDate = new Date();
        planning.dates.forEach((date)=>{
            let oldDate = new Date(date);
            if(newDate.getMonth()==oldDate.getMonth()) dayString+=`${oldDate.getDate()},`
        });
        if(dayString.length>0) {
            return `${CronJobString.transformTimeToCronJobString(planning.time)} ${dayString.slice(0,dayString.lastIndexOf(","))} ${newDate.getMonth()+1} *`
            // return `${CronJobString.transformTimeToCronJobString(planning.time)} ${dayString.slice(0,dayString.lastIndexOf(","))} ${newDate.getMonth()+1} *`
        }
        return null;
    }

    static transformTimeToCronJobString(timeDef:string)
    {
        let [time,timeZone] = timeDef.split(" ");
        let [heure,minute] = time.split(":");

        if(timeZone=="PM") return `${parseInt(minute)} ${parseInt(heure)+12}`
        return `${parseInt(minute)} ${parseInt(heure)}`
    }
}