import { ContactModel, MessageModel } from "../store";

export class ContactExtractData
{
    static getWhatsappPhone(contact:ContactModel)
    {
        return contact.phoneNumbers.find((phone)=>phone.label=="whatsapp");
    }

    static getDefaultMail(contact:ContactModel)
    {
        return contact.emails.find((email)=> email.label=="default")
    }
}

export class MessageProcessing
{
    
    static replaceVar(text:string,varArray:Record<string,any>):string
    {
      Object.keys(varArray).forEach((key)=>text = text.replace(`{{${key}}}`, varArray.hasOwnProperty(key)?varArray[key]:`%${key}%`));
      return text;
    }

    static getVarList(text:string):string[]
    {
        return Array.from(text.matchAll(/{{([a-zA-Z]+)}}/g)).map((varFound)=>varFound[1])
    }
  
    static extractPhoneID(phoneNumber:string)
    {
      return phoneNumber.replace("+","").replace(" ","").replace("-","")
    }

    static getVarListWithValues(contact:ContactModel,sender,dateToSend):Record<string,any>
    {
        let receiverEmail =ContactExtractData.getDefaultMail(contact);
        return {
            senderEmail:sender.email,
            senderFullName:`${sender.firstName} ${sender.lastName}`,
            receiverFullName:`${contact.fullName}`,
            receiverEmail: receiverEmail?receiverEmail:"",
            dateToSend:`${(dateToSend?new Date(dateToSend):new Date()).toLocaleDateString()}`,
            plateform: "Ysapp"
        }
    }    
        
    static getPersonalizedMessage(bodyText,contact:ContactModel,sender,dateToSend)
    {
        let varsValues = MessageProcessing.getVarListWithValues(contact,sender,dateToSend);
        let varsList = MessageProcessing.getVarList(bodyText);        
        let values = {};
        varsList.forEach((varItem)=>{
            if(varsValues.hasOwnProperty(varItem)) values[varItem]=varsValues[varItem];
        })
        return MessageProcessing.replaceVar(bodyText,values)
    }
}