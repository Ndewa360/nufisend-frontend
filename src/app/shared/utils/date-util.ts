export class DateUtil
{
    static setFirstDayOfWeek(todayDate:Date,dayOfWeek)
    {
        while (todayDate.getDay() !== dayOfWeek) {
            todayDate.setDate(todayDate.getDate() + 1);
        }    
    }

    static setToFirstDayOfWeek(toDayDate:Date)
    {
        toDayDate.setDate(toDayDate.getDate()-(toDayDate.getDay()==0?6:toDayDate.getDay()-1))
    }

    static setToLastDayOfWeek(toDayDate:Date)
    {
        toDayDate.setDate(toDayDate.getDate()+ (7-(toDayDate.getDay()==0?7:toDayDate.getDay())))
    }
}